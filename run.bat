@echo off
setlocal enabledelayedexpansion

echo ====================================================================
echo                   HelpDeskX Application Launcher
echo ====================================================================
echo.

:: 1. Check for Python
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not found on your PATH.
    echo Please install Python 3.10+ from https://www.python.org/ and check "Add Python to PATH".
    pause
    exit /b 1
)

:: 2. Setup Virtual Environment (if not already created)
if not exist "venv\Scripts\activate.bat" (
    echo [*] Creating Python virtual environment in .\venv ...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo [*] Virtual environment created successfully.
)

:: 3. Activate Virtual Environment
echo [*] Activating virtual environment...
call venv\Scripts\activate.bat

:: 4. Install / Verify Requirements
echo [*] Checking dependencies from requirements.txt...
pip install -r requirements.txt --quiet
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)

:: 5. Launch FastAPI Application
echo.
echo ====================================================================
echo  HelpDeskX Server Starting!
echo ====================================================================
echo.
echo  * Agent Dashboard:    http://127.0.0.1:8000/
echo  * Customer Portal:    http://127.0.0.1:8000/customer
echo  * API Documentation:  http://127.0.0.1:8000/docs
echo.
echo  Press Ctrl+C to stop the server at any time.
echo ====================================================================
echo.

uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

pause
