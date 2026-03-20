# UMUTIMA Backend

Backend API for the UMUTIMA frontend application built with Django and Django REST Framework.

## Prerequisites

- Python 3.10 or higher
- pip or conda

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

2. Activate the virtual environment:
   ```bash
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env.local` from `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

5. Set your `GEMINI_API_KEY` in `.env.local`

## Database Setup

Run migrations:
```bash
python manage.py migrate
```

Create a superuser:
```bash
python manage.py createsuperuser
```

## Development

Run the development server:
```bash
python manage.py runserver
```

The server will start on `http://localhost:8000` by default.

## Admin Panel

Access the Django admin at `http://localhost:8000/admin`

## Structure

- `config/` - Django project settings
- `apps/` - Django applications
- `manage.py` - Django management script
