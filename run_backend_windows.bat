@echo off
setlocal
cd /d "%~dp0Backend"

if not exist ".venv" (
  echo Creating Python virtual environment in Backend\.venv ...
  py -3 -m venv .venv
  if errorlevel 1 (
    echo Failed to create virtual environment. Make sure Python 3.10+ is installed and available as py or python.
    pause
    exit /b 1
  )
)

call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt

echo.
echo Starting NewsInquisive backend at http://127.0.0.1:8000
echo Keep this window open while using the React app.
echo.
python server.py
pause
