@echo off
echo ========================================
echo   PTest — Build and Deploy to Railway
echo ========================================
echo.

cd /d C:\Users\shoxr\OneDrive\Desktop\Ravshanjon\ptest-app

echo [1/6] Installing dependencies...
call npm install
echo.

echo [2/6] Building production bundle...
call npm run build
echo.

echo [3/6] Copying HD images...
if not exist rasmlar (
    echo Copying rasmlar folder...
    xcopy /E /I /Q "..\rasmlar" "rasmlar"
    echo Done! Copied rasmlar.
) else (
    echo rasmlar folder already exists.
)
echo.

echo [4/6] Initializing git...
git init
git add .
echo.

echo [5/6] Creating commit...
git commit -m "PTest v2 — premium quiz manager"
echo.

echo [6/6] Ready for Railway!
echo.
echo ========================================
echo   NOW RUN: railway up
echo   Or link to GitHub and deploy from there
echo ========================================
echo.

pause
