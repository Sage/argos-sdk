#!/bin/sh

if [ -d "deploy" ]; then
    rm -rf deploy
fi

mkdir -p deploy/content/ext
mkdir -p deploy/content/datejs
mkdir -p deploy/content/javascript
mkdir -p deploy/content/images
mkdir -p deploy/content/css
mkdir -p deploy/content/reui

# .NET Build Tool
# mono tools/JsBit/JsBit.exe -p "build/release.jsb2" -d "."

# Java Build Tool
$JAVA_HOME/bin/java -Dfile.encoding=UTF-8 -jar "tools/JSBuilder/JSBuilder2.jar" -v -p "build/release.jsb2" -d "."