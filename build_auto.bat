@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo Auto Build Script (Electron)
echo ========================================
echo.

if not exist "package.json" (
    echo ERROR: package.json not found.
    pause
    exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed or not in PATH.
    pause
    exit /b 1
)

set "BUILD_TARGET=all"
if /i "%~1"=="win" set "BUILD_TARGET=win"

echo [1/5] Installing npm dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
)

echo [2/5] Installing Playwright Chromium...
call npx playwright install chromium
if errorlevel 1 (
    echo ERROR: playwright install failed.
    pause
    exit /b 1
)

echo [3/5] Running tests (includes live DMV test)...
call npm test
if errorlevel 1 (
    echo ERROR: tests failed.
    pause
    exit /b 1
)

echo [4/5] Building app (target=%BUILD_TARGET%)...
set "BUILD_TARGET=%BUILD_TARGET%"
call npm run build:all
if errorlevel 1 (
    echo ERROR: build failed.
    pause
    exit /b 1
)

echo [5/5] Build completed.
echo Output folder: release
echo.
echo Tip:
echo   build_auto.bat win   ^(only Windows build^)
echo ========================================
pause
exit /b 0
