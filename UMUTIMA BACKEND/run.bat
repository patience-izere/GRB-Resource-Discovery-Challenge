@echo off
REM DD Rw Portal Backend - Development Server
REM Activates the virtual environment and starts Django on http://localhost:8000
REM Run setup.bat first if you have not already done so.

echo.
echo ============================================
echo  DD Rw Portal Backend - Development Server
echo ============================================
echo.

REM ── Verify working directory ─────────────────────────────────────────────
if not exist "manage.py" (
    echo ERROR: manage.py not found.
    echo Please run this script from the "UMUTIMA BACKEND" directory.
    echo.
    pause
    exit /b 1
)

REM ── Verify setup has been run ─────────────────────────────────────────────
if not exist "venv" (
    echo ERROR: Virtual environment not found.
    echo Please run setup.bat first.
    echo.
    pause
    exit /b 1
)

if not exist ".env.local" (
    echo WARNING: .env.local not found.
    echo          Copy .env.example to .env.local and set GEMINI_API_KEY.
    echo          Continuing with default settings...
    echo.
)

REM ── Activate virtual environment ─────────────────────────────────────────
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment.
    pause
    exit /b 1
)

REM ── Start development server ──────────────────────────────────────────────
echo  Starting server on http://localhost:8000
echo  API root:     http://localhost:8000/api/
echo  Health check: http://localhost:8000/api/health/
echo  Admin panel:  http://localhost:8000/admin/
echo.
echo  Press Ctrl+C to stop.
echo.

python manage.py runserver

pause
