#!/usr/bin/env bash
# Build a local preview APK into builds/ with a readable timestamped name.
# Usage: bash scripts/build-apk.sh   (no EAS build quota used — builds on this Mac)
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p builds

# Toolchain (Android Studio's SDK + bundled JDK).
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export JAVA_HOME="${JAVA_HOME:-/Applications/Android Studio.app/Contents/jbr/Contents/Home}"
export PATH="$PATH:$ANDROID_HOME/platform-tools"

TS="$(date "+%Y%m%d-%H%M%S")"
OUT="builds/kept-preview-$TS.apk"

echo "Building preview APK → $OUT"
eas build --profile preview --platform android --local --non-interactive --output "$OUT"
echo "Done: $OUT"
