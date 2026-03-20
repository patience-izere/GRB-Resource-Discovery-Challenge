@echo off
REM UMUTIMA Backend - Run Development Server

echo.
echo ============================================
echo UMUTIMA Backend - Development Server
echo ============================================
echo.

REM Check if we're in the right directory
if not exist "manage.py" (
    echo ERROR: manage.py not found!
    echo Please run this script from the UMUTIMA BACKEND directory.
    pause
    exit /b 1
)

REM Activate virtual environment
if exist "venv" (
    call venv\Scripts\activate.bat
) else (
    echo ERROR: Virtual environment not found!
    echo Please run setup.bat first.
    pause
    exit /b 1
)

echo.
echo Starting development server on http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

python manage.py runserver

pause
