<p align="center"><img src="LOGO.png" alt="Eva Music" width="220"></p>

# Eva Music

*Feel the music.* A music player for Android with its own front end.

- **Search, home and playlists** with full-length streaming
- **Synced lyrics**
- **Background playback** with notification and lock-screen controls
- **Library** saved on your device

## Build

The `build-apk` GitHub Actions workflow builds a debug APK on every push to `main` and
attaches it to the **latest** release. To build locally:

```
./gradlew :app:assembleDevDebug
```

The APK is written to `app/build/outputs/apk/dev/debug/`. Requires JDK 21 and the Android SDK.

## Licence

Eva Music is free software under the GNU General Public License v3.0 (see `LICENSE`).
Third-party components and their notices are listed in `NOTICE`.
