@echo off

if exist deploy (
	rmdir deploy /S /Q
)

mkdir deploy\content\ext
mkdir deploy\content\datejs
mkdir deploy\content\javascript
mkdir deploy\content\images
mkdir deploy\content\css
mkdir deploy\content\reui

tools\JsBit\jsbit.exe -p "build/release.jsb2" -d "."
if %errorlevel% neq 0 exit /b %errorlevel%