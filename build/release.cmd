@echo off

if exist deploy (
	rmdir deploy /S /Q
)

mkdir deploy\src\argos-sdk\libraries
mkdir deploy\app\content\javascript
mkdir deploy\app\content\images
mkdir deploy\app\content\css
mkdir deploy\app\content\reui

%JAVA_HOME%\bin\java -Dfile.encoding=UTF-8 -jar "tools/JSBuilder/JSBuilder2.jar" -v -p "build/release.jsb2" -d "."
if %errorlevel% neq 0 exit /b %errorlevel%