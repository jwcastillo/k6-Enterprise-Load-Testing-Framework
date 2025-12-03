#!/bin/bash
set -e

# Automated Versioning Script
# Uses Conventional Commits to determine version bump
# Supports: major, minor, patch, or manual version

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${BLUE}📦 Current version: ${CURRENT_VERSION}${NC}"

# Get last tag (if exists)
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -z "$LAST_TAG" ]; then
  echo -e "${YELLOW}⚠️  No previous tags found, starting from v0.0.0${NC}"
  LAST_TAG="v0.0.0"
fi

echo -e "${BLUE}🏷️  Last tag: ${LAST_TAG}${NC}"

# Get commits since last tag
if [ "$LAST_TAG" = "v0.0.0" ]; then
  COMMITS=$(git log --pretty=format:"%s" --no-merges)
else
  COMMITS=$(git log ${LAST_TAG}..HEAD --pretty=format:"%s" --no-merges)
fi

# Determine version bump type
BUMP_TYPE="patch"
HAS_BREAKING=false
HAS_FEAT=false
HAS_FIX=false

while IFS= read -r commit; do
  # Check for breaking changes
  if echo "$commit" | grep -qE "^[a-z]+(\(.+\))?!:|BREAKING CHANGE:"; then
    HAS_BREAKING=true
  fi
  
  # Check for features
  if echo "$commit" | grep -qE "^feat(\(.+\))?:"; then
    HAS_FEAT=true
  fi
  
  # Check for fixes
  if echo "$commit" | grep -qE "^fix(\(.+\))?:"; then
    HAS_FIX=true
  fi
done <<< "$COMMITS"

# Determine bump type
if [ "$HAS_BREAKING" = true ]; then
  BUMP_TYPE="major"
elif [ "$HAS_FEAT" = true ]; then
  BUMP_TYPE="minor"
elif [ "$HAS_FIX" = true ]; then
  BUMP_TYPE="patch"
else
  echo -e "${YELLOW}⚠️  No conventional commits found (feat/fix/BREAKING)${NC}"
  echo -e "${YELLOW}   Defaulting to patch bump${NC}"
  BUMP_TYPE="patch"
fi

# Allow manual override
if [ ! -z "$1" ]; then
  if [[ "$1" =~ ^(major|minor|patch)$ ]]; then
    BUMP_TYPE="$1"
    echo -e "${BLUE}🔧 Manual bump type: ${BUMP_TYPE}${NC}"
  else
    echo -e "${RED}❌ Invalid bump type: $1${NC}"
    echo -e "${YELLOW}   Usage: $0 [major|minor|patch]${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✨ Auto-detected bump type: ${BUMP_TYPE}${NC}"
fi

# Calculate new version
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"

case "$BUMP_TYPE" in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"
echo -e "${GREEN}🚀 New version: ${NEW_VERSION}${NC}"

# Confirm
if [ -z "$CI" ]; then
  read -p "Continue with version bump? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Aborted${NC}"
    exit 1
  fi
fi

# Update package.json
echo -e "${BLUE}📝 Updating package.json...${NC}"
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '${NEW_VERSION}';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Update CHANGELOG.md (replace [Unreleased] with version)
echo -e "${BLUE}📝 Updating CHANGELOG.md...${NC}"
DATE=$(date +%Y-%m-%d)
if grep -q "\[Unreleased\]" CHANGELOG.md; then
  # If there's an Unreleased section, convert it to the new version
  sed -i.bak "s/\[Unreleased\]/[${NEW_VERSION}] - ${DATE}/" CHANGELOG.md
  rm CHANGELOG.md.bak
else
  echo -e "${YELLOW}⚠️  No [Unreleased] section found in CHANGELOG.md${NC}"
fi

# Commit changes
echo -e "${BLUE}💾 Committing version bump...${NC}"
git add package.json CHANGELOG.md
git commit -m "chore(release): v${NEW_VERSION}"

# Create tag
echo -e "${BLUE}🏷️  Creating tag v${NEW_VERSION}...${NC}"
git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}"

echo -e "${GREEN}✅ Version bumped successfully!${NC}"
echo -e "${YELLOW}📌 Don't forget to push: git push && git push --tags${NC}"
