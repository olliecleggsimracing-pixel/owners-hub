# Releasing an update

1. Make the change in `app/`, `main.js` or `preload.js`.
2. Bump `"version"` in `package.json` (e.g. 1.0.0 -> 1.0.1).
3. Write what changed in `build/release-notes.md` (shown in the app's update screen).
4. Commit and push to `main`.
5. GitHub Actions ("Build & release") sees the new version, builds the installer and
   publishes release `v<version>` (~10 min). Pushes that don't change the version build nothing.
6. Installed apps find it on next launch, every 6 hours, or via Settings -> Check now.

The repository must be public for the app to download updates without a token.
