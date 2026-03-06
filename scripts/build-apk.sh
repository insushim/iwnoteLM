#!/bin/bash
# Build EduBrain APK using WSL
# Usage: wsl bash scripts/build-apk.sh

set -e

echo "=== EduBrain APK Build ==="

ANDROID_DIR="$(cd "$(dirname "$0")/../android" && pwd)"
cd "$ANDROID_DIR"

# Check for Java
if ! command -v java &>/dev/null; then
    echo "Installing OpenJDK 17..."
    sudo apt-get update -qq
    sudo apt-get install -y -qq openjdk-17-jdk wget unzip
fi

# Check for Android SDK
ANDROID_HOME="${ANDROID_HOME:-$HOME/android-sdk}"
if [ ! -d "$ANDROID_HOME/platforms" ]; then
    echo "Setting up Android SDK..."
    mkdir -p "$ANDROID_HOME"

    # Download command-line tools
    CMDLINE_TOOLS_URL="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
    wget -q "$CMDLINE_TOOLS_URL" -O /tmp/cmdline-tools.zip
    unzip -q /tmp/cmdline-tools.zip -d "$ANDROID_HOME/cmdline-tools-tmp"
    mkdir -p "$ANDROID_HOME/cmdline-tools"
    mv "$ANDROID_HOME/cmdline-tools-tmp/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest"
    rm -rf "$ANDROID_HOME/cmdline-tools-tmp" /tmp/cmdline-tools.zip

    export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

    # Accept licenses and install required components
    yes | sdkmanager --licenses 2>/dev/null || true
    sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools"
fi

export ANDROID_HOME
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

# Generate Gradle wrapper if not exists
if [ ! -f "$ANDROID_DIR/gradlew" ]; then
    echo "Generating Gradle wrapper..."
    cd "$ANDROID_DIR"
    # Create a minimal gradlew
    cat > gradlew << 'GRADLEW'
#!/bin/sh
GRADLE_VERSION="8.5"
GRADLE_HOME="$HOME/.gradle/wrapper/dists/gradle-${GRADLE_VERSION}-bin"
if [ ! -d "$GRADLE_HOME" ]; then
    mkdir -p "$HOME/.gradle/wrapper/dists"
    wget -q "https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip" -O /tmp/gradle.zip
    unzip -q /tmp/gradle.zip -d "$HOME/.gradle/wrapper/dists"
    rm /tmp/gradle.zip
fi
exec "$HOME/.gradle/wrapper/dists/gradle-${GRADLE_VERSION}/bin/gradle" "$@"
GRADLEW
    chmod +x gradlew
fi

echo "Building APK..."
cd "$ANDROID_DIR"
chmod +x gradlew
./gradlew assembleRelease --no-daemon 2>&1

APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release-unsigned.apk"
if [ -f "$APK_PATH" ]; then
    # Copy to project root
    OUTPUT_DIR="$(dirname "$ANDROID_DIR")/dist"
    mkdir -p "$OUTPUT_DIR"

    VERSION=$(grep 'versionName' "$ANDROID_DIR/app/build.gradle" | head -1 | sed 's/.*"\(.*\)".*/\1/')
    cp "$APK_PATH" "$OUTPUT_DIR/EduBrain-v${VERSION}.apk"

    echo ""
    echo "=== APK Build Complete ==="
    echo "Output: dist/EduBrain-v${VERSION}.apk"
    echo "Size: $(du -h "$OUTPUT_DIR/EduBrain-v${VERSION}.apk" | cut -f1)"
else
    echo "ERROR: APK build failed"
    exit 1
fi
