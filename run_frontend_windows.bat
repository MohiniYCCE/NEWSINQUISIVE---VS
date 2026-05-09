@echo off
setlocal
cd /d "%~dp0Frontend\newsinquisive"

if not exist "node_modules" (
  echo Installing frontend dependencies. This can take a few minutes ...
  npm install
  if errorlevel 1 (
    echo npm install failed. Make sure Node.js LTS is installed.
    pause
    exit /b 1
  )
)

echo.
echo Starting NewsInquisive frontend at http://localhost:3000
echo Make sure run_backend_windows.bat is already running in another window.
echo.
npm start
pause
