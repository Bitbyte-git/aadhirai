# 3. Setup & deployment

> ⚠️ `backend/settings.py` calls `load_dotenv(override=True)`. Whatever is in `backend/.env` **wins over shell environment variables**. If `.env` holds the production `DATABASE_URL`, every `manage.py` command, including `migrate`, `shell` and seed scripts, runs against **production**. Read [Operations & safety](08-operations-and-safety.md) first.

## Prerequisites

| Tool | Version |
|---|---|
| Python | 3.12 (`backend/.python-version`, `runtime.txt`) |
| Node.js | 20+ (Vite 8 / rolldown) |
| PostgreSQL | Any reachable database. Use a Neon **branch**, not the production branch, for development. |

## Environment variables

### Backend (`backend/.env`, or the Render dashboard)

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string (Neon pooled URL) |
| `SECRET_KEY` | ✅ in production | Django secret. Falls back to `"unsafe-secret-key"` if missing. Never rely on the fallback. |
| `DEBUG` | — | `"True"` enables debug; anything else is off |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | ✅ | Image storage. Serializing any product image fails without them. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | ✅ for payments | Checkout, recharge, autopay |

### Frontend (`frontend/.env`)

| Variable | Purpose |
|---|---|
| `VITE_BASE_URL` | API base, e.g. `http://127.0.0.1:8000/api/`. **If unset, the app calls the production Render backend.** |

## Local setup

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate            # Windows  (source venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
# create backend/.env pointing at a DEV database (see table above)
python manage.py migrate
python manage.py runserver       # http://127.0.0.1:8000/api/ping/

# Frontend
cd frontend
npm install
echo VITE_BASE_URL=http://127.0.0.1:8000/api/ > .env
npm run dev                      # http://localhost:5173 (or next free port)
```

### Creating the Super Admin on a fresh database

`manage.py createsuperuser` works: `UserManager.create_superuser` sets `role='super_admin'`, `is_staff` and `is_superuser`. There must be **exactly one** `super_admin`, because the code uses `User.objects.filter(role='super_admin').first()` in many places.

> ❌ Do **not** use `manage.py create_default_user` against a database with real data. It **deletes** the user with that email and recreates it, which cascades into that user's requests, stock, wallet and sales (see [Data model → delete behaviour](05-data-model.md#delete-behaviour)).

### Seed data (development only)

`accounts/management/commands/` has seeders: `create_dummy_admins`, `create_dummy_dealers`, `create_dummy_subdealers`, `create_dummy_promotors`, `create_dummy_customers`, `create_dummy_subcustomers`, `create_dummy_shops`, `create_dummy_products`, `create_dummy_orders`, `create_dummy_logins`, `create_dummy_rewards`, `create_dummy_autopay`. They write to whatever database `.env` points at, so never run them against production.

## Deployment (Render)

| Setting | Value |
|---|---|
| Root directory | `backend` |
| Build command | `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate` |
| Pre-deploy command | *(empty)* |
| Start command | `gunicorn bitbyte_backend.wsgi:application --workers 2 --threads 4 --timeout 120` |
| Auto-deploy | On commit to `main` |
| Environment | All backend variables above |

Because the build command runs `migrate`, **pushing a commit that contains a migration applies it to production automatically**. Review migrations before pushing.

The free Render plan sleeps when idle. The first request after a sleep can take 30–50 s, which is why `api.js` sets no Axios timeout.

### Frontend build

```bash
cd frontend
npm run build        # outputs frontend/dist
```

Host `dist/` on any static host with an SPA fallback (all paths → `index.html`), and set `VITE_BASE_URL` at build time.

## Release checklist

1. `python manage.py makemigrations --check --dry-run` shows no unexpected model changes.
2. Every new migration is reviewed. Nothing drops or rewrites live data without a plan.
3. `npm run build` succeeds.
4. Commit, then push to `main`. Render builds and migrates.
5. Smoke-test: login per role, one request → approve, one sale → receipt.
