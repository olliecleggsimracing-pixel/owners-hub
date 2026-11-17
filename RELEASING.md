# Releasing an update

1. Make the change in `app/`, `main.js` or `preload.js`.
2. Bump `"version"` in `package.json` (e.g. 1.0.0 -> 1.0.1).
3. Write what changed in `build/release-notes.md` (shown in the app's update screen).
4. Commit, then tag and push:  `git tag v1.0.1 && git push && git push --tags`
5. GitHub Actions ("Build & release") builds the installer and publishes the release (~10 min).
6. Installed apps find it within 6 hours, on next launch, or via Settings -> Check now.

The repository must be public for the app to download updates without a token.
