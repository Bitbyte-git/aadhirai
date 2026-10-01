# 8. Operations & safety

## Golden rules

1. **`backend/.env` is production.** `settings.py` loads it with `override=True`, so a shell variable cannot override it. Any `manage.py migrate`, `shell`, seeder or test run on a machine with that `.env` changes live data.
2. **Develop against a Neon branch.** Create a branch in Neon, put its URL in `.env` on development machines, and keep the production URL only in Render.
3. **Never delete users with history.** Deleting a user cascades into their requests, stock, sales, orders and wallet ([why](05-data-model.md#delete-behaviour)). Set `is_active=False` instead.
4. **Migrations reach production on push.** Render's build command runs `migrate`. Review every migration file before pushing to `main`.
5. **Exactly one Super Admin.** Code everywhere uses `User.objects.filter(role='super_admin').first()`. Do not create a second one, and do not delete and recreate it.

## Safe testing

The repository has no automated tests (`accounts/tests.py` is empty). Until it does, test changes like this:

| Kind of check | How |
|---|---|
| Read-only checks on live data | `manage.py shell -c "..."` with **only** `.filter()`, `.count()`, `.aggregate()`, or `GET` calls through `APIRequestFactory`. No `.save()`, `.create()`, `.delete()`, `.update()`. |
| Anything that writes | A throwaway settings module that swaps `DATABASES` for SQLite and asserts it, then `manage.py migrate --settings=<module>` and run scripts with `--settings=<module>` |
| Frontend | `npm run build` (compiles every page), then click through as each role |
| Migrations | `manage.py makemigrations --check --dry-run` (read-only) |

Throwaway settings example:

```python
# test_settings.py  (put its folder on PYTHONPATH)
from bitbyte_backend.settings import *  # noqa
DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': 'test.sqlite3'}}
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
```

Start every write script with `assert 'sqlite' in settings.DATABASES['default']['ENGINE']`.

## Monitoring checklist

| What | Where |
|---|---|
| Backend errors, deploys, restarts | Render → service → Logs / Events |
| Database load, connections, restore points | Neon console → Monitoring, Branches, Restore |
| Payment failures | Razorpay dashboard. Autopay mandate `last_charge_*` fields. |
| Who is the Super Admin | `User.objects.filter(role='super_admin').values('id', 'created_at')`. The id should never change. |

## Backups & restore

Neon keeps point-in-time history. To recover data lost at time T:

1. In Neon, create a **branch from a timestamp** just before T.
2. Connect to that branch **read-only** and export the missing rows.
3. Re-insert them into production in a reviewed script (keep original ids when possible, and fix foreign keys to recreated users).

Restoring the whole production branch rolls back **everything** after T, including new orders. Prefer the branch-and-copy method.

## Known risks

Ordered by priority.

| # | Risk | Impact | Suggested fix |
|---|---|---|---|
| 1 | `CASCADE` from `User` on requests, stock, sales | Deleting a user (especially Super Admin) silently erases history and stock | Change to `PROTECT` for `CoinRequest/JewelryRequest.requested_by/requested_to`, `CoinStock.user`, `JewelryStock.user`, `StockSale.seller`. Deactivate users instead of deleting. |
| 2 | Development machines hold the production `DATABASE_URL` | Local tests and scripts change live data | Use a Neon dev branch locally. Rotate the production password. |
| 3 | `create_default_user` deletes then recreates a superuser | Data loss if run on a real account | Rewrite as get-or-create, or delete the command |
| 4 | `/admin/` is public | Brute-force target | Restrict by IP, or remove from production URLs |
| 5 | `CORS_ALLOW_ALL_ORIGINS=True`, `ALLOWED_HOSTS=['*']` | Any site can call the API with a stolen token | Allow only the real frontend domain(s) |
| 6 | `SECRET_KEY` default `"unsafe-secret-key"`; Razorpay **test** keys hard-coded as defaults in `settings.py` | Token forgery if env is missing; keys visible in git | Fail at startup when env is missing; remove defaults from code |
| 7 | IDs from `count() + 1` | Duplicate member IDs after deletes or concurrent creates | Use a sequence or retry loop (as shops and products already do) |
| 8 | No automated tests; ESLint config broken | Regressions go unnoticed | Add tests for request → approve → stock, forward chain, sales pricing, commission. Fix ESLint. |
| 9 | `views.py` ~11,400 lines | Hard to navigate and review | Split by feature module (stock, sales, hierarchy, payments, …) |
| 10 | Local-memory cache with 2 Gunicorn workers | Dashboard counts can briefly disagree between requests | Use Redis or database cache if exact counts matter |
| 11 | Render free plan sleeps | First request after idle takes 30–50 s | Paid instance, or a ping to `/api/ping/` |

## Incident log

### 30 Sep 2026: Super Admin account deleted and recreated

| | |
|---|---|
| What happened | The Super Admin user was deleted and recreated with the same email twice: id 3719 → **3722** at 15:50:47 IST, then → **3723** at 16:18:00 IST. New account had `is_superuser=True` (created by a superuser-type command, not by the app). |
| Impact | Cascade deleted every request sent to or approved from Super Admin (e.g. coin REQ-50, #64, #65; jewellery #35, #39) and the Super Admin vault stock. Orders, users, products and leader-to-leader requests were unaffected. Gaps in older request ids suggest the same thing happened before. |
| Checked and ruled out | Application code (no path deletes or recreates Super Admin), git history, Render build/start commands, the development machine's shell history and running processes, and developer tooling (read-only commands only). |
| Open | Root cause not yet identified. The recreation came from outside the repository and Render config: another machine or service holding the database credentials, or the Neon console. |
| Actions | 1. Rotate the Neon password and update Render + local `.env`. 2. Switch the cascading keys to `PROTECT` (risk #1). 3. Optionally restore lost rows from a Neon branch. |

### 29 Sep 2026: Migration applied to production from a development machine

A `migrate` run meant for testing hit production because of `.env` override (migration 0064, which was intended anyway) and created a test user, product and order. The test records were removed the same day. From then on, all write tests use SQLite settings (see [Safe testing](#safe-testing)).
