package com.music.bitchord

import android.Manifest
import android.annotation.SuppressLint
import android.os.Build
import androidx.activity.result.contract.ActivityResultContracts
import android.content.Intent
import org.json.JSONObject
import android.graphics.Color
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity

/**
 * Eva Music front end: the HTML app in assets/eva/index.html, shown full screen.
 *
 * The page is served from a fixed https origin that this activity answers itself
 * (no network, no extra dependency), so fetch(), localStorage and the music APIs
 * behave as they do in a normal browser tab instead of on an opaque file:// origin.
 */
class EvaWebActivity : AppCompatActivity() {

    private lateinit var web: WebView
    private lateinit var engine: EvaEngine
    private var pendingAuth: String? = null
    private var pendingCar = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Page sits between the system bars, tinted to match its own dark theme.
        window.statusBarColor = Color.parseColor("#141516")
        window.navigationBarColor = Color.parseColor("#141516")

        web = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#141516"))
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                mediaPlaybackRequiresUserGesture = false
                mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
                allowFileAccess = false
                allowContentAccess = false
                textZoom = 100
                setSupportZoom(false)
                builtInZoomControls = false
            }
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView, url: String?) { deliverAuth(); if (pendingCar) { pendingCar = false; engine.openCar() } }

                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest,
                ): WebResourceResponse? {
                    val u = request.url
                    if (u.host != HOST) return null
                    val path = u.path?.trimStart('/').orEmpty().ifEmpty { "index.html" }
                    return try {
                        val mime = when (path.substringAfterLast('.', "")) {
                            "html" -> "text/html"
                            "js" -> "application/javascript"
                            "css" -> "text/css"
                            "png" -> "image/png"
                            "svg" -> "image/svg+xml"
                            "json" -> "application/json"
                            else -> "application/octet-stream"
                        }
                        WebResourceResponse(mime, "utf-8", assets.open("eva/$path"))
                    } catch (e: Exception) {
                        null
                    }
                }

                // Anything that isn't the app itself opens in the user's browser.
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    if (request.url.host == HOST) return false
                    runCatching { startActivity(Intent(Intent.ACTION_VIEW, request.url)) }
                    return true
                }
            }
        }
        engine = EvaEngine(this, web)
        web.addJavascriptInterface(engine, "EvaNative")
        setContentView(web)

        if (Build.VERSION.SDK_INT >= 33) {
            registerForActivityResult(ActivityResultContracts.RequestPermission()) { }
                .launch(Manifest.permission.POST_NOTIFICATIONS)
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                web.evaluateJavascript("(window.evaBack ? window.evaBack() : false)") { handled ->
                    if (handled != "true") {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                    }
                }
            }
        })

        pendingAuth = authLink(intent)
        if (intent.data?.let { it.scheme == "evamusic" && it.host == "car" } == true) pendingCar = true
        if (savedInstanceState != null) web.restoreState(savedInstanceState)
        else web.loadUrl("https://$HOST/index.html")
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        authLink(intent)?.let { pendingAuth = it; deliverAuth() }
        if (intent.data?.let { it.scheme == "evamusic" && it.host == "car" } == true) engine.openCar()
    }

    private fun authLink(i: Intent?): String? =
        i?.data?.takeIf { it.scheme == "evamusic" && it.host == "auth" }?.toString()

    // Hands the sign-in result (from the browser) to the page.
    private fun deliverAuth() {
        val link = pendingAuth ?: return
        pendingAuth = null
        web.evaluateJavascript("(window.evaOAuth&&window.evaOAuth(${JSONObject.quote(link)}))", null)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    override fun onDestroy() {
        engine.release()
        web.destroy()
        super.onDestroy()
    }

    private companion object {
        const val HOST = "appassets.androidplatform.net"
    }
}
