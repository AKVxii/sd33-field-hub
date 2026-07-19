@echo off
cd /d "%~dp0"
echo ============================================
echo  SD 33 - Temporary PUBLIC link (anywhere)
echo ============================================
echo.
echo 1) This window starts a public tunnel to your site.
echo 2) Keep BOTH this window AND the site server running.
echo 3) Email the https://....loca.lt link (NOT localhost).
echo.
echo Starting site server if needed...
start "SD33 Site" cmd /c "node server.js"
timeout /t 2 /nobreak >nul
echo.
echo Starting public tunnel...
echo When you see "your url is: https://...." - copy that link.
echo.
echo First visit on phone may show a loca.lt warning page:
echo   Click Continue, or enter this PC's public IP if asked.
echo.
npx.cmd --yes localtunnel --port 3050
pause
