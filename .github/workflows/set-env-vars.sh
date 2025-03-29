. ./.github/workflows/fns.sh --source-only

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

vercomp "${FIBJS_VERSION}" "0.37.0"
if [[ "$vercomp_last_result" -eq "2" ]]; then
    export lower_than_0_37_0="true"
else
    export lower_than_0_37_0="false"
fi

echo "::set-output name=lower_than_0_37_0::$lower_than_0_37_0";

case "${RUNNER_OS}" in
    Windows)
        # lower than 0.37.0
        if [[ "$lower_than_0_37_0" == "true" ]]; then
            export FIBJS_OS=windows
        else
            export FIBJS_OS=win32
        fi
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
    i386|ia32|x86)
        if [[ "$lower_than_0_37_0" == "true" ]]; then
            export FIBJS_ARCH=x86
        else
            export FIBJS_ARCH=ia32
        fi
        ;;
    amd64|x64)
        export FIBJS_ARCH=x64
        ;;
    *)
        export FIBJS_ARCH=$ARCH
        ;;
esac
echo "::set-output name=FIBJS_ARCH::$FIBJS_ARCH";
