@echo off
REM UMUTIMA Backend Quick Start Script for Windows

echo.
echo ============================================
echo UMUTIMA Backend - Quick Start
echo ============================================
echo.

REM Check if we're in the right directory
if not exist "manage.py" (
    echo ERROR: manage.py not found!
    echo Please run this script from the UMUTIMA BACKEND directory.
    echo.
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt -q
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

REM Run migrations
echo Running database migrations...
python manage.py migrate
if errorlevel 1 (
    echo ERROR: Failed to run migrations
    pause
    exit /b 1
)

REM Seed data
echo Seeding sample data...
python manage.py seed_data
if errorlevel 1 (
    echo ERROR: Failed to seed data
    pause
    exit /b 1
)

echo.
echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo To start the development server, run:
echo.
echo   python manage.py runserver
echo.
echo Then open your browser to:
echo   http://localhost:8000/api/health/
echo.
echo Admin panel available at:
echo   http://localhost:8000/admin
echo.
echo Press any key to continue...
pause
