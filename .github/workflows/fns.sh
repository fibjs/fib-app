#!/bin/bash

vercomp () {
  if [[ $1 == $2 ]]; then
    export vercomp_last_result=0
    return $vercomp_last_result
  fi
  local IFS=.
  local i ver1=($1) ver2=($2)
  # fill empty fields in ver1 with zeros
  for ((i=${#ver1[@]}; i<${#ver2[@]}; i++))
  do
      ver1[i]=0
  done
  for ((i=0; i<${#ver1[@]}; i++))
  do
      if [[ -z ${ver2[i]} ]]; then
          # fill empty fields in ver2 with zeros
          ver2[i]=0
      fi
      if ((10#${ver1[i]} > 10#${ver2[i]})); then
        export vercomp_last_result=1
        return $vercomp_last_result
      fi
      if ((10#${ver1[i]} < 10#${ver2[i]})); then
        export vercomp_last_result=2
        return $vercomp_last_result
      fi
  done
    export vercomp_last_result=0
  return $vercomp_last_result
}

install_fibjs() {
    local version=$1
    if [[ -z "$version" ]]; then
        echo "[install_fibjs] version is required"
        exit 1
    fi
    local os=$2
    if [[ -z "$os" ]]; then
        echo "[install_fibjs] os is required"
        exit 1
    fi
    local arch=$3
    if [[ -z "$arch" ]]; then
        echo "[install_fibjs] arch is required"
        exit 1
    fi

    local url_base="https://github.com/fibjs/fibjs/releases/download/v${version}/fibjs-v${version}-${os}-${arch}"

    # in fact, there's also non-archived linux fibjs
    if [[ "$RUNNER_OS" == "Linux" ]]; then
        if [ "$lower_than_0_37_0" == "true" ]; then
            local remote_url="${url_base}.xz"
            curl -SL "$remote_url" -o ./node_modules/.bin/fibjs.xz;
            xz -d ./node_modules/.bin/fibjs.xz;
        else
            local remote_url="${url_base}.tar.gz"
            curl -SL "$remote_url" -o ./node_modules/.bin/fibjs.tar.gz;
            tar -xzf ./node_modules/.bin/fibjs.tar.gz -C ./node_modules/.bin;
        fi
        chmod a+x ./node_modules/.bin/fibjs;
    elif [[ "$RUNNER_OS" == "macOS" ]]; then
        local remote_url="${url_base}"
        curl -SL "$remote_url" -o ./node_modules/.bin/fibjs;
        chmod a+x ./node_modules/.bin/fibjs;
    else
        local remote_url="${url_base}.exe"
        curl -SL "$remote_url" -o ./node_modules/.bin/fibjs.exe;
    fi
    echo "[install_fibjs] Downloading fibjs from ${remote_url}"
}
