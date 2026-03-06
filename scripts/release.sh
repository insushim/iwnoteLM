#!/bin/bash
# Create a new release with version bump
# Usage: bash scripts/release.sh [major|minor|patch]

set -e

BUMP_TYPE=${1:-patch}

# Read current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Calculate new version
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
case $BUMP_TYPE in
    major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
    minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
    patch) PATCH=$((PATCH + 1)) ;;
    *) echo "Usage: $0 [major|minor|patch]"; exit 1 ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo "New version: $NEW_VERSION"

# Update package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '$NEW_VERSION';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Update .env.local
sed -i "s/NEXT_PUBLIC_APP_VERSION=.*/NEXT_PUBLIC_APP_VERSION=$NEW_VERSION/" .env.local 2>/dev/null || true

# Update android version
sed -i "s/versionName \".*\"/versionName \"$NEW_VERSION\"/" android/app/build.gradle 2>/dev/null || true

# Commit and tag
git add -A
git commit -m "release: v$NEW_VERSION"
git tag "v$NEW_VERSION"

echo ""
echo "=== Release v$NEW_VERSION ready ==="
echo "Run 'git push && git push --tags' to trigger the CI/CD pipeline."
echo "This will:"
echo "  1. Deploy to Cloudflare Pages"
echo "  2. Build Android APK"
echo "  3. Create GitHub Release with APK"
