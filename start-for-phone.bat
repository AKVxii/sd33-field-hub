@echo off
cd /d "%~dp0"
echo.
echo Starting SD 33 Field Hub for PC + phone...
echo.
echo On THIS computer:  http://localhost:3050/review
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  for /f "tokens=1" %%b in ("%%a") do (
    echo On your PHONE same Wi-Fi:  http://%%b:3050/review
  )
)
echo.
echo Email yourself the PHONE link above - not localhost.
echo Keep this window open while using the site.
echo.
node server.js
pause
