@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Demohair - Demo (localhost:5000)

set "PY="
where python >nul 2>nul && set "PY=python"
if not defined PY where py >nul 2>nul && set "PY=py"
if not defined PY (
  echo.
  echo   Python wurde nicht gefunden. Bitte Python installieren: https://www.python.org
  echo.
  pause
  exit /b 1
)

cls
echo.
echo   ==========================================================
echo.
echo      Demohair  ^|  Demo-Website by TL-Buildwebsites
echo.
echo      Demo läuft – zum Beenden dieses Fenster schliessen
echo.
echo      Adresse:  http://localhost:5000
echo.
echo   ==========================================================
echo.

rem Browser kurz nach dem Serverstart öffnen
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Milliseconds 1200; Start-Process 'http://localhost:5000/'"

%PY% -m http.server 5000 --bind 127.0.0.1 >nul 2>nul

echo.
echo   Der Server wurde beendet oder konnte nicht starten.
echo   (Ist Port 5000 bereits belegt? Dann ein anderes Demo-Fenster schliessen.)
echo.
pause
