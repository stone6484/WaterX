#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JAVA_DIR="$PROJECT_DIR/.tools/runtime/jdk-21.0.11+10/Contents/Home"
MAVEN_BIN="$PROJECT_DIR/.tools/runtime/apache-maven-3.9.16/bin/mvn"

if [[ ! -x "$JAVA_DIR/bin/java" || ! -x "$MAVEN_BIN" ]]; then
  echo "未找到项目本地 JDK/Maven，请先按 README 安装环境。" >&2
  exit 1
fi

export JAVA_HOME="$JAVA_DIR"
export PATH="$JAVA_HOME/bin:/usr/bin:/bin"

cd "$PROJECT_DIR/backend"
exec "$MAVEN_BIN" -o test
