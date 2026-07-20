@echo off
cd /d "%~dp0"
set PATH=%PATH%;C:\Program Files\Git\bin;C:\Program Files\GitHub CLI

echo ============================================
echo  Deploy SD 33 Field Hub (permanent URL)
echo ============================================
echo.

gh auth status >nul 2>&1
if errorlevel 1 (
  echo You need to log into GitHub once...
  gh auth login --hostname github.com --git-protocol https --web
)

echo.
echo Creating public GitHub repo and pushing...
gh repo create sd33-field-hub --public --source=. --remote=origin --push 2>nul
if errorlevel 1 (
  echo Repo may already exist - pushing...
  git branch -M main
  git remote remove origin 2>nul
  for /f "tokens=*" %%u in ('gh api user -q .login') do set GHUSER=%%u
  git remote add origin https://github.com/%GHUSER%/sd33-field-hub.git
  git push -u origin main
)

for /f "tokens=*" %%u in ('gh api user -q .login') do set GHUSER=%%u
echo.
echo Repo: https://github.com/%GHUSER%/sd33-field-hub
echo.
echo Opening Render deploy page...
echo 1. Sign up free with GitHub on Render
echo 2. New + Web Service - connect sd33-field-hub
echo 3. Create Web Service
echo 4. After live, set PUBLIC_URL env to your onrender.com URL
echo.
start "" "https://dashboard.render.com/select-repo?type=web"
start "" "https://github.com/%GHUSER%/sd33-field-hub"
echo.
pause
