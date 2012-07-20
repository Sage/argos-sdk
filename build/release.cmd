@echo off

if exist deploy (
	rmdir deploy /S /Q
)

mkdir deploy\content\javascript
mkdir deploy\content\images
mkdir deploy\content\css
mkdir deploy\content\dojo\dojo
mkdir deploy\content\dojo\dojo\selector
mkdir deploy\content\dojo\dijit
mkdir deploy\content\dojo\dojox

REM .NET Build Tool
tools\JsBit\jsbit.exe -p "build/release.jsb2" -d "."

REM Java Build Tool
REM %JAVA_HOME%\bin\java -Dfile.encoding=UTF-8 -jar "tools/JSBuilder/JSBuilder2.jar" -v -p "build/release.jsb2" -d "."

if %errorlevel% neq 0 exit /b %errorlevel%