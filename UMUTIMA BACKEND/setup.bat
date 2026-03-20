@echo off
REM DD Rw Portal Backend - First-Time Setup Script (Windows)
REM Run this once from the UMUTIMA BACKEND directory.
REM After setup completes, use run.bat to start the development server.

echo.
echo ============================================
echo  DD Rw Portal Backend - Setup
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

REM ── Create virtual environment if missing ─────────────────────────────────
if not exist "venv" (
    echo [1/7] Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment.
        echo Make sure Python 3.10+ is installed and on your PATH.
        pause
        exit /b 1
    )
) else (
    echo [1/7] Virtual environment already exists, skipping creation.
)

REM ── Activate virtual environment ─────────────────────────────────────────
echo [2/7] Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment.
    pause
    exit /b 1
)

REM ── Install dependencies ─────────────────────────────────────────────────
echo [3/7] Installing dependencies (this may take a few minutes)...
pip install -r requirements.txt -q
if errorlevel 1 (
    echo ERROR: pip install failed. Check your internet connection and requirements.txt.
    pause
    exit /b 1
)

REM ── Create .env.local if missing ──────────────────────────────────────────
if not exist ".env.local" (
    echo [4/7] Creating .env.local from .env.example...
    copy .env.example .env.local >nul
    echo.
    echo  IMPORTANT: Open .env.local and set the following before proceeding:
    echo    - GEMINI_API_KEY   : your Google Gemini API key
    echo    - CORS_ALLOWED_ORIGINS : http://localhost:5173  (Vite frontend)
    echo.
    echo  Press any key once you have saved .env.local ...
    pause >nul
) else (
    echo [4/7] .env.local already exists, skipping.
)

REM ── Apply database migrations ─────────────────────────────────────────────
echo [5/7] Applying database migrations...
python manage.py migrate
if errorlevel 1 (
    echo ERROR: migrate failed.
    pause
    exit /b 1
)

REM ── Load data ─────────────────────────────────────────────────────────────
echo [6/7] Loading data...

REM Seed hardcoded metrics, insights, gap alerts, and indicators
python manage.py seed_data
if errorlevel 1 (
    echo WARNING: seed_data failed. Continuing anyway.
)

REM Import full study catalog from CSV files in data/ (if they exist)
if exist "data\studies.csv" (
    python manage.py load_csv_data
    if errorlevel 1 (
        echo WARNING: load_csv_data failed. Check that data\studies.csv,
        echo          data\study_resources.csv, and data\quality_report.csv exist.
    )
) else (
    echo WARNING: data\studies.csv not found. Skipping CSV import.
    echo          Place the three CSV files in the data\ directory and run:
    echo            python manage.py load_csv_data
)

REM ── Build FAISS search indices ────────────────────────────────────────────
echo [7/7] Building FAISS semantic search indices...
echo        (Downloads ~90MB sentence-transformer model on first run.)
python manage.py build_search_index
if errorlevel 1 (
    echo WARNING: build_search_index failed.
    echo          The /api/search/ endpoint will return HTTP 503 until indices are built.
    echo          Re-run manually:  python manage.py build_search_index
)

echo.
echo ============================================
echo  Setup complete!
echo ============================================
echo.
echo Next steps:
echo   1. Run the development server:   run.bat
echo      (or: python manage.py runserver)
echo.
echo   2. Optional - create admin user:
echo      python manage.py createsuperuser
echo.
echo   3. API health check:  http://localhost:8000/api/health/
echo   4. Admin panel:       http://localhost:8000/admin/
echo   5. Start frontend:    npm run dev  (in the UMUTIMA directory)
echo.
pause
