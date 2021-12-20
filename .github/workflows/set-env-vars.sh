export GIT_BRANCH=${GITHUB_REF#refs/heads/}
echo "::set-output name=GIT_BRANCH::$GIT_BRANCH"
export GIT_TAG=$(git tag | grep $(git describe --tags HEAD))
echo "::set-output name=GIT_TAG::$GIT_TAG"
export GIT_COMMIT_HEAD_MSG=$(git log --format=%b -1)
echo "::set-output name=GIT_COMMIT_HEAD_MSG::$GIT_COMMIT_HEAD_MSG"
export GIT_COMMIT_SHORTCUTS=$(git log --format=%h -1)
echo "::set-output name=GIT_COMMIT_SHORTCUTS::$GIT_COMMIT_SHORTCUTS"
export GIT_COMMIT_TIME=$(git show -s --format="%cd" --date=format:%Y%m%d%H%M%S HEAD)
echo "::set-output name=GIT_COMMIT_TIME::$GIT_COMMIT_TIME"

if [[ "$GIT_TAG" =~ ^v?[012]\.[0-9]+\.[0-9]+$ ]]; then
    export IS_GIT_TAG_MATCH_SEMVER="true"
    echo "::set-output name=IS_GIT_TAG_MATCH_SEMVER::$IS_GIT_TAG_MATCH_SEMVER"
fi

if [ -z "$GIT_TAG" ]; then
    export RELEASE_TAG="$GIT_COMMIT_TIME-$GIT_COMMIT_SHORTCUTS";
else
    export RELEASE_TAG="$GIT_TAG";
fi
if [ -z "$IS_GIT_TAG_MATCH_SEMVER" ]; then
    SUFFIX=${GIT_BRANCH//\//'-'}
    RELEASE_TAG="$RELEASE_TAG-$SUFFIX"
fi
echo "::set-output name=RELEASE_TAG::$RELEASE_TAG";

case "${RUNNER_OS}" in
    Windows)
        export FIBJS_OS=windows
        ;;
    macOS)
        export FIBJS_OS=darwin
        ;;
    Linux)
        export FIBJS_OS=linux
        ;;
    *)
        echo "unsupported RUNNER_OS ${RUNNER_OS}";
        exit 1
        ;;
esac
echo "::set-output name=FIBJS_OS::$FIBJS_OS";

case "${ARCH}" in
    i386)
        export FIBJS_ARCH=x86
        ;;
    amd64)
        export FIBJS_ARCH=x64
        ;;
    *)
        export FIBJS_ARCH=$ARCH
        ;;
esac
echo "::set-output name=FIBJS_ARCH::$FIBJS_ARCH";
