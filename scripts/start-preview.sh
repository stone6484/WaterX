#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JAVA_DIR="$PROJECT_DIR/.tools/runtime/jdk-21.0.11+10/Contents/Home"
MAVEN_BIN="$PROJECT_DIR/.tools/runtime/apache-maven-3.9.16/bin/mvn"

export JAVA_HOME="$JAVA_DIR"
export PATH="$JAVA_HOME/bin:/usr/bin:/bin"

cd "$PROJECT_DIR/backend"
exec "$MAVEN_BIN" test-compile org.codehaus.mojo:exec-maven-plugin:3.5.1:java \
  -Dexec.mainClass=com.waterx.safety.LocalPreviewLauncher \
  -Dexec.classpathScope=test
