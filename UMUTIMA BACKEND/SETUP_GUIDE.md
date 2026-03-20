# UMUTIMA Backend Setup Guide

This guide will walk you through setting up the Django backend for the UMUTIMA Gender Data Observatory.

## Quick Start (Windows)

### 1. Create Virtual Environment

```bash
cd "c:\UMUTIMA\UMUTIMA BACKEND"
python -m venv venv
```

### 2. Activate Virtual Environment

```bash
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Copy the example file:
```bash
copy .env.example .env.local
```

Then edit `.env.local` and set:
- `SECRET_KEY`: Generate a random secret key (or use the default for development)
- `GEMINI_API_KEY`: Your Gemini API key (optional for now)
- `DEBUG`: Should be `True` for development
- `ALLOWED_HOSTS`: `localhost,127.0.0.1`
- `CORS_ALLOWED_ORIGINS`: `http://localhost:3000`

### 5. Apply Migrations

```bash
python manage.py migrate
```

### 6. Seed Sample Data

Load the sample gender indicator data:
```bash
python manage.py seed_data
```

### 7. Create Superuser (Admin)

```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin account.

### 8. Run Development Server

```bash
python manage.py runserver
```

The server will start on `http://localhost:8000`

## Verification

### Test Health Endpoint

Open browser or use curl:
```bash
curl http://localhost:8000/api/health/
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-03-17T...",
  "message": "UMUTIMA Backend API is running"
}
```

### Test Metrics Endpoint

```bash
curl http://localhost:8000/api/indicators/metrics/
```

This should return the 4 sample metrics (Economic, Health, Education, Leadership).

### Access Admin Panel

Visit: `http://localhost:8000/admin`

Login with your superuser credentials to:
- Add/edit metrics
- Manage gap alerts
- View insights
- Manage detailed indicators

## API Endpoints

Once running, the backend provides these endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health/` | GET | Health check |
| `/api/indicators/metrics/` | GET | All metrics for dashboard |
| `/api/insights/` | GET | AI insights |
| `/api/gaps/alerts/` | GET | Data gap alerts |
| `/api/indicators/m1/detailed/` | GET | Detailed indicator (m1 sample) |

## Frontend Connection

The frontend is configured to call:
- `http://localhost:3000` (frontend)
- `http://localhost:8000/api/v1` or `http://localhost:8000/api/` (backend)

The CORS is configured to allow requests from the frontend automatically.

## Common Issues

### ModuleNotFoundError
Make sure your virtual environment is activated:
```bash
venv\Scripts\activate
```

### Port Already in Use
Change the port in the command:
```bash
python manage.py runserver 8001
```

### CORS Errors
Ensure `CORS_ALLOWED_ORIGINS` in `.env.local` includes your frontend URL.

## Next Steps

1. Start the frontend: `npm run dev` (in UMUTIMA folder)
2. Start the backend: `python manage.py runserver`
3. Open `http://localhost:3000` in your browser
4. The dashboard should now show the sample data!

## Development Workflow

To add new data:
1. Go to `http://localhost:8000/admin`
2. Navigate to the relevant model (Metrics, Insights, etc.)
3. Add or edit data
4. The frontend will automatically refresh with new data

---

For questions or issues, check the README.md in the UMUTIMA BACKEND directory.
