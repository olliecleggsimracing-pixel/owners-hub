THE OWNERS HUB - DESKTOP APP (Windows)

INSTALLING
The installer is built automatically on GitHub. Open your repository's
"Releases" page and download The-Owners-Hub-Setup-<version>.exe, then run it.
Windows may say "Windows protected your PC" (the app isn't code-signed yet):
click "More info" -> "Run anyway".

UPDATES
When a new version is published, the app shows a green "Update" button
(top right, and a banner on the Garage screen). Press it, then "Restart now".
You can also check any time: gear icon -> App updates -> Check now.
Your cars and history are kept through updates.

SMART FEATURES (variant list, schedule lookup, scanning)
Gear icon -> paste an Anthropic API key from https://console.anthropic.com/settings/keys .
Stored encrypted on this PC. Everything else works without a key.

YOUR DATA
Saved on this PC (%APPDATA%\The Owners Hub). Use My Car -> Export backup now and then.
From the web version: Export backup there, Restore from backup here.

BUILDING IT YOURSELF (optional, needs Node.js)
"BUILD INSTALLER.bat" builds a local installer in "dist". "RUN WITHOUT INSTALLING.bat"
runs it straight away. Updates only work in the version installed from GitHub Releases.
