#!/usr/bin/env sh

if [ -z $VERSION ]; then
    echo "VERSION env variable is not set. Please set it to the version you want to release."
    exit 1
fi

npm --no-git-tag-version version $VERSION;

echo ":wq" | git-changelog --all --prune-old --tag v$VERSION;
echo ""
echo "[prelease] enforce publish release by running 'git-release v$VERSION'"
echo ""