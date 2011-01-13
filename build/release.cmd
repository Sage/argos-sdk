@echo off

if exist deploy (
	rmdir deploy /S /Q
)

mkdir deploy\app\content\ext
mkdir deploy\app\content\datejs
mkdir deploy\app\content\javascript
mkdir deploy\app\content\images
mkdir deploy\app\content\css
mkdir deploy\app\content\reui

tools\JsBit\jsbit.exe -p "build/release.jsb2" -d "."
if %errorlevel% neq 0 exit /b %errorlevel%