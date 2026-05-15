@echo off
setlocal

set "HOST_NAME=hr.abeceda.pdfsigner"
set "MANIFEST_PATH=%~dp0native-host.json"

if not exist "%MANIFEST_PATH%" (
  echo native-host.json nije pronadjen: %MANIFEST_PATH%
  exit /b 1
)

reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\%HOST_NAME%" /ve /t REG_SZ /d "%MANIFEST_PATH%" /f
if errorlevel 1 (
  echo Registracija Native Messaging hosta nije uspjela.
  exit /b 1
)

echo Native Messaging host registriran:
echo %HOST_NAME%
echo %MANIFEST_PATH%
endlocal
