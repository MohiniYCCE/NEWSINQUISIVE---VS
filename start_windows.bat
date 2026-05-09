@echo off
setlocal
cd /d "%~dp0"
echo Starting NewsInquisive backend and frontend in separate windows...
start "NewsInquisive Backend" cmd /k "%~dp0run_backend_windows.bat"
timeout /t 5 /nobreak >nul
start "NewsInquisive Frontend" cmd /k "%~dp0run_frontend_windows.bat"
echo.
echo Backend:  http://127.0.0.1:8000/health
echo Frontend: http://localhost:3000
echo.
echo If this is the first run, model downloads and npm install can take several minutes.
pause
