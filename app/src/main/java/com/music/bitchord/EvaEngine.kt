package com.music.bitchord

import android.content.ComponentName
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.core.content.ContextCompat
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.google.common.util.concurrent.ListenableFuture
import com.music.bitchord.data.YtMusicRepository
import com.music.bitchord.data.lyrics.LyricsRepository
import com.music.bitchord.data.model.SearchFilter
import com.music.bitchord.data.model.SearchResult
import com.music.bitchord.data.model.Song
import com.music.bitchord.data.settings.AppSettings
import com.music.bitchord.playback.PlaybackService
import com.music.bitchord.playback.playSongs
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

/**
 * Eva Music's bridge between the HTML front end and the native engine.
 *
 * The page calls window.EvaNative.request(id, method, argsJson) for data (search, home,
 * lyrics) and EvaNative.play/pause/resume/seek for playback. Answers come back through
 * window.__evaResolve / __evaReject, and playback state is pushed with window.__evaState.
 * Audio itself is played by the original playback service, so full-length streams,
 * the notification and lock-screen controls all come from the engine.
 */
/** Lets the notification / lock screen / headset skip buttons reach the page's own queue. */
object EvaBridge {
    @Volatile var onNext: (() -> Unit)? = null
    @Volatile var onPrev: (() -> Unit)? = null
}

class EvaEngine(private val activity: android.app.Activity, private val web: WebView) {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private val main = Handler(Looper.getMainLooper())
    private var future: ListenableFuture<MediaController>? = null
    private var controller: MediaController? = null
    private var pending: Song? = null

    private val ticker = object : Runnable {
        override fun run() {
            pushState()
            if (controller?.isPlaying == true) main.postDelayed(this, 500)
        }
    }

    private val listener = object : Player.Listener {
        override fun onIsPlayingChanged(isPlaying: Boolean) {
            pushState()
            main.removeCallbacks(ticker)
            if (isPlaying) main.postDelayed(ticker, 500)
        }
        override fun onPlaybackStateChanged(playbackState: Int) = pushState()
        override fun onPlayWhenReadyChanged(playWhenReady: Boolean, reason: Int) = pushState()
        override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) = pushState()
        override fun onPlayerError(error: PlaybackException) = pushState(error = error.message ?: "Playback error")
    }

    init {
        // Eva has its own queue and autoplay logic in the page; the engine plays one track at a time.
        AppSettings.setAutoplay(false)
        EvaBridge.onNext = { main.post { web.evaluateJavascript("(window.evaCmd&&evaCmd('next'))", null) } }
        EvaBridge.onPrev = { main.post { web.evaluateJavascript("(window.evaCmd&&evaCmd('prev'))", null) } }
        main.post {
            val token = SessionToken(activity, ComponentName(activity, PlaybackService::class.java))
            val f = MediaController.Builder(activity, token).buildAsync()
            future = f
            f.addListener({
                controller = runCatching { f.get() }.getOrNull()
                controller?.addListener(listener)
                pending?.let { s -> pending = null; startPlayback(s) }
                pushState()
            }, ContextCompat.getMainExecutor(activity))
        }
    }

    fun release() {
        EvaBridge.onNext = null
        EvaBridge.onPrev = null
        main.removeCallbacks(ticker)
        controller?.removeListener(listener)
        future?.let { MediaController.releaseFuture(it) }
        controller = null
        scope.cancel()
    }


    // ---------- in-app updates ----------

    private val apkFile get() = java.io.File(activity.cacheDir, "updates/EvaMusic.apk")

    /** Which build is installed, so the page can tell whether a newer one exists. */
    @JavascriptInterface
    fun appInfo(): String {
        val pi = activity.packageManager.getPackageInfo(activity.packageName, 0)
        val code = if (android.os.Build.VERSION.SDK_INT >= 28) pi.longVersionCode else @Suppress("DEPRECATION") pi.versionCode.toLong()
        return JSONObject()
            .put("build", code - 1000)
            .put("version", pi.versionName ?: "")
            .put("arm64", android.os.Build.SUPPORTED_ABIS.contains("arm64-v8a"))
            .toString()
    }

    private fun updateState(json: JSONObject) =
        main.post { web.evaluateJavascript("(window.__evaUpdate&&__evaUpdate($json))", null) }

    /** Downloads a release APK from this app's own GitHub releases and hands it to the installer. */
    @JavascriptInterface
    fun installUpdate(url: String) {
        if (!url.startsWith("https://github.com/santhoshff/Clone-2/releases/download/")) {
            updateState(JSONObject().put("state", "error").put("msg", "Unexpected update address"))
            return
        }
        scope.launch(Dispatchers.IO) {
            try {
                val out = apkFile.also { it.parentFile?.mkdirs(); it.delete() }
                val c = java.net.URL(url).openConnection() as java.net.HttpURLConnection
                c.connectTimeout = 15000; c.readTimeout = 30000; c.instanceFollowRedirects = true
                if (c.responseCode !in 200..299) error("Download failed (${c.responseCode})")
                val total = c.contentLengthLong
                var done = 0L; var lastPct = -1
                c.inputStream.use { inp -> out.outputStream().use { o ->
                    val buf = ByteArray(64 * 1024)
                    while (true) {
                        val n = inp.read(buf); if (n < 0) break
                        o.write(buf, 0, n); done += n
                        val pct = if (total > 0) (done * 100 / total).toInt() else -1
                        if (pct != lastPct) { lastPct = pct; updateState(JSONObject().put("state", "downloading").put("pct", pct)) }
                    }
                } }
                updateState(JSONObject().put("state", "ready"))
                main.post { launchInstaller() }
            } catch (e: Throwable) {
                updateState(JSONObject().put("state", "error").put("msg", e.message ?: "Download failed"))
            }
        }
    }

    @JavascriptInterface
    fun installDownloaded() { main.post { launchInstaller() } }

    private fun launchInstaller() {
        val f = apkFile
        if (!f.exists()) { updateState(JSONObject().put("state", "error").put("msg", "Update file is missing. Download it again.")); return }
        if (android.os.Build.VERSION.SDK_INT >= 26 && !activity.packageManager.canRequestPackageInstalls()) {
            updateState(JSONObject().put("state", "perm"))
            activity.startActivity(android.content.Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                android.net.Uri.parse("package:" + activity.packageName)))
            return
        }
        val uri = androidx.core.content.FileProvider.getUriForFile(activity, activity.packageName + ".fileprovider", f)
        activity.startActivity(android.content.Intent(android.content.Intent.ACTION_VIEW)
            .setDataAndType(uri, "application/vnd.android.package-archive")
            .addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION or android.content.Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    // ---------- data requests ----------

    @JavascriptInterface
    fun request(id: String, method: String, args: String) {
        scope.launch {
            try {
                val a = JSONObject(args.ifBlank { "{}" })
                val out: Any = when (method) {
                    "search" -> search(a.optString("q"))
                    "recs" -> recs(a.optString("genre"), a.optInt("limit", 20))
                    "lyrics" -> lyrics(a)
                    else -> error("Unknown method $method")
                }
                reply("__evaResolve", id, out.toString())
            } catch (e: Throwable) {
                reply("__evaReject", id, JSONObject.quote(e.message ?: e.javaClass.simpleName))
            }
        }
    }

    private suspend fun search(q: String): JSONArray {
        val page = YtMusicRepository.searchPage(q, SearchFilter.SONGS).getOrThrow()
        val out = JSONArray()
        val seen = HashSet<String>()
        for (row in page.rows) {
            val song = when (row) {
                is SearchResult.Track -> row.song
                is SearchResult.TopTrack -> row.song
                else -> null
            } ?: continue
            if (seen.add(song.videoId)) out.put(track(song))
        }
        return out
    }

    private suspend fun recs(genre: String, limit: Int): JSONArray {
        val songs: List<Song> = if (genre.isBlank()) {
            YtMusicRepository.quickPicks().getOrThrow()
        } else {
            val page = YtMusicRepository.searchPage(genre, SearchFilter.SONGS).getOrThrow()
            page.rows.mapNotNull { (it as? SearchResult.Track)?.song ?: (it as? SearchResult.TopTrack)?.song }
        }
        val out = JSONArray()
        songs.distinctBy { it.videoId }.take(limit).forEach { out.put(track(it)) }
        return out
    }

    private suspend fun lyrics(a: JSONObject): JSONObject {
        val res = LyricsRepository.lyrics(
            videoId = a.optString("id"),
            title = a.optString("title"),
            artist = a.optString("artist"),
            durationMs = a.optLong("durMs", 0L),
            album = a.optString("album").ifBlank { null },
            sources = AppSettings.lyricsSources.value,
            order = AppSettings.lyricsSourceOrder.value,
        )
        val o = JSONObject()
        val synced = JSONArray()
        val lines = JSONArray()
        if (res != null) {
            val ls = res.lines.filter { !it.isGap }
            val timed = ls.map { it.timeMs }.distinct().size > 1
            for (l in ls) {
                lines.put(l.text)
                if (timed) synced.put(JSONObject().put("time", l.timeMs / 1000.0).put("text", l.text))
            }
            o.put("provider", res.source.toString())
        } else {
            o.put("provider", "none")
        }
        o.put("synced", synced).put("lines", lines)
        return o
    }

    private fun track(s: Song): JSONObject = JSONObject()
        .put("id", s.videoId)
        .put("title", s.title)
        .put("artist", s.artist)
        .put("artistId", s.artistId ?: JSONObject.NULL)
        .put("album", s.albumName ?: JSONObject.NULL)
        .put("albumId", s.albumId ?: JSONObject.NULL)
        .put("coverUrl", s.thumbnailUrl ?: "")
        .put("durationSeconds", parseDuration(s.durationText))

    private fun parseDuration(t: String?): Int {
        if (t.isNullOrBlank()) return 0
        return t.split(":").mapNotNull { it.trim().toIntOrNull() }.fold(0) { acc, p -> acc * 60 + p }
    }

    private fun fmtDuration(sec: Int): String? =
        if (sec <= 0) null else "%d:%02d".format(sec / 60, sec % 60)

    private fun reply(fn: String, id: String, jsLiteral: String) {
        web.post { web.evaluateJavascript("window.$fn&&window.$fn(${JSONObject.quote(id)},$jsLiteral)", null) }
    }

    // ---------- playback ----------

    @JavascriptInterface
    fun play(json: String) {
        val a = JSONObject(json)
        val song = Song(
            videoId = a.getString("id"),
            title = a.optString("title"),
            artist = a.optString("artist"),
            thumbnailUrl = a.optString("cover").ifBlank { null },
            durationText = fmtDuration(a.optInt("dur", 0)),
            albumName = a.optString("album").ifBlank { null },
        )
        main.post { startPlayback(song) }
    }

    private fun startPlayback(song: Song) {
        val c = controller
        if (c == null) { pending = song; return }
        scope.launch(Dispatchers.Main) { c.playSongs(listOf(song), 0) }
    }

    @JavascriptInterface fun resume() { main.post { controller?.play() } }
    @JavascriptInterface fun pause() { main.post { controller?.pause() } }
    @JavascriptInterface fun seek(ms: Long) { main.post { controller?.seekTo(ms) } }

    private fun pushState(error: String? = null) {
        val c = controller ?: return
        val o = JSONObject()
            .put("playing", c.playWhenReady && c.playbackState != Player.STATE_ENDED && c.playbackState != Player.STATE_IDLE)
            .put("pos", c.currentPosition.coerceAtLeast(0))
            .put("dur", if (c.duration > 0) c.duration else 0)
            .put("state", c.playbackState)
            .put("id", c.currentMediaItem?.mediaId ?: "")
        if (error != null) o.put("error", error)
        web.post { web.evaluateJavascript("window.__evaState&&window.__evaState(${o})", null) }
    }
}
