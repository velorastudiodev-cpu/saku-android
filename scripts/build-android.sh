#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${ANDROID_HOME:?Set ANDROID_HOME to the Android SDK directory}"
: "${SAKU_KEYSTORE:?Set SAKU_KEYSTORE to the original release keystore}"
: "${SAKU_STORE_PASSWORD_FILE:?Set SAKU_STORE_PASSWORD_FILE to a file containing the keystore password}"
SAKU_KEY_ALIAS="${SAKU_KEY_ALIAS:-saku}"
SAKU_BUILD_TOOLS="${SAKU_BUILD_TOOLS:-36.0.0}"
tools_dir="$ANDROID_HOME/build-tools/$SAKU_BUILD_TOOLS"
npm run android:sync
(cd android && ./gradlew --no-daemon :app:assembleRelease :app:lintRelease)
mkdir -p artifacts
version=$(node -p 'JSON.parse(require("fs").readFileSync("package.json","utf8")).version')
unsigned=android/app/build/outputs/apk/release/app-release-unsigned.apk
aligned=artifacts/saku-aligned.apk
output="artifacts/Saku-$version.apk"
"$tools_dir/zipalign" -f -p 4 "$unsigned" "$aligned"
"$tools_dir/apksigner" sign --ks "$SAKU_KEYSTORE" --ks-key-alias "$SAKU_KEY_ALIAS" --ks-pass "file:$SAKU_STORE_PASSWORD_FILE" --out "$output" "$aligned"
"$tools_dir/apksigner" verify --verbose "$output"
rm "$aligned"
(cd artifacts && sha256sum "Saku-$version.apk" > "Saku-$version.apk.sha256")
printf 'APK: %s\n' "$output"
