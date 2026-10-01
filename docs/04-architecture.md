# 4. Architecture & conventions

## Backend

### Shape

- **One Django app** (`accounts`) holds every model, serializer and view. `bitbyte_backend/urls.py` mounts it at `/api/`, plus `/admin/` (Django admin) and `/media/`.
- Views are almost all `APIView` classes with hand-written `get` and `post` methods. There are a few function views: `ping`, `create_razorpay_order`, `verify_payment`, `autopay_webhook`.
- `views.py` is about 11,400 lines. Search it by class name (`class CoinRequestView`) or by the section banners (`# ═══ … ═══`).

### Settings that matter

| Setting | Value | Note |
|---|---|---|
| Auth | `JWTAuthentication` only | Access token 8 h, refresh 1 day, header `Authorization: Bearer <token>` |
| `TIME_ZONE` | `Asia/Kolkata`, `USE_TZ=True` | Stored in UTC. Date filters use `timezone.localdate()`. |
| `DATABASES` | `dj_database_url` from `DATABASE_URL`, `conn_max_age=600` | |
| Media | `MediaCloudinaryStorage` | `ImageField.url` needs Cloudinary env vars |
| Static | WhiteNoise, compressed manifest | `collectstatic` runs in the Render build |
| Cache | Django default (local memory) | Per Gunicorn worker; cached counts can differ between workers for up to the TTL |
| CORS / hosts | `CORS_ALLOW_ALL_ORIGINS=True`, `ALLOWED_HOSTS=['*']` | See [known risks](08-operations-and-safety.md#known-risks) |

### Authorization pattern

There are no DRF permission classes per role. Every view checks the role inline:

```python
class CreateDealerView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=403)
```

When you add an endpoint, write the role check first. Then apply team scope (below) to every queryset that returns other users' data.

### Team scope helpers (`views.py`)

| Helper | Returns |
|---|---|
| `_team_user_ids(user)` | `None` for Super Admin (no filter); otherwise the set of user ids below `user` that can hold stock (shops → shop subtree). Excludes `user` itself. |
| `_shop_parent_user(user)` | The parent shop, or Super Admin for a root shop |
| `_shop_network_user_ids(user, include_self)` | Every shop id in the subtree |
| `_jewelry_request_target(user)` | Who a user's requests go to (direct leader, or Super Admin). Used by coins **and** jewellery. |
| `_holder_info(user)` | `(id_string, display_name, phone)` for any role |

### The "board" endpoint pattern

The request and transaction pages call one endpoint with `box=board`:

```
GET /api/coin-requests/?box=board&view=requests&card=my_requests&period=all&role=all&offset=0&limit=20
GET /api/jewelry-requests/?box=board&view=transactions&card=chain&status=all&search=...&offset=30&limit=30
```

`_request_board()` returns:

```json
{
  "items": [ ... one page ... ],
  "has_more": true,
  "list_total": 57,
  "counts": { "my_requests": 3, "my_approved": 9, "leader_approved": 22, "leader_pending": 2 },
  "role_counts": { "all": 22, "admin": 4, "dealer": 8, ... },
  "status_counts": { "pending": 2, "sent": 20, "rejected": 1, "total": 23, ... },
  "approvable_count": 3
}
```

| `view` | `card` values | Meaning |
|---|---|---|
| `requests` | `my_requests`, `my_approved`, `leader_approved`, `leader_pending` | Inbox cards. Pending cards ignore `period`; approved cards filter by approval date. |
| `transactions` | `my`, `leader`, `chain` | History. `chain` = any request that is part of a forward chain. |

Counts are computed over the **whole** team-scoped table, not the loaded page. Each row also carries `highlight` and `highlight_label` (for example "Your request · Approved by Super Admin").

### Pagination convention

List endpoints that can grow use `offset` + `limit`. They fetch `limit + 1` rows to compute `has_more` without a second `COUNT`. The frontend loads the next page with an `IntersectionObserver` sentinel (`rootMargin: 500px`).

### Snapshot pattern

Anything that records a sale stores a **copy** of the price inputs at that moment, so later edits to products or rates never change history:

- `JewelryOrder`: `product_name`, `product_metal`, `product_image_url`, `product_net_weight`, `unit_price`
- `StockSale`: product name, code, image URL, weights, `rate_per_gram`, `making_percent`, stone, die, GST, MRP, discount, final amount

### PDFs

ReportLab builds PDFs in memory and returns a `FileResponse`:

| Endpoint | Output |
|---|---|
| `GET /api/orders/<order_id>/receipt/` | Customer order receipt (Athirai design) |
| `GET /api/stock-sales/<id>/receipt/` | Store sale receipt, id `BBSALE000123` |
| `POST /api/generic-table-pdf/` | Any table exported from the UI |

Shared drawing helpers: `_check_icon()` (vector tick badge) and `_inr_fmt()` (Indian number grouping).

## Frontend

### Shape

- `main.jsx` mounts `App.jsx`. Every page is `React.lazy` loaded inside one `<Suspense>`.
- `App.jsx` holds all routes, `ProtectedRoute`, the navbar wrappers and `DashboardRedirect`.
- `api.js` exports one Axios instance. It adds `Authorization: Bearer <token>` from `localStorage`. On a `401` it calls `/login/refresh/` once and retries; if refresh fails it clears storage and sends the user to `/login`.

### Auth state

| `localStorage` key | Set on login |
|---|---|
| `token` | JWT access token |
| `refresh` | JWT refresh token |
| `role` | `super_admin`, `admin`, … |
| `email` | user email |

The frontend role check is cosmetic. The backend role check is what actually protects data.

### Page conventions

Most pages follow the same structure. Copy an existing page (for example `Coins_products/Stock_Sales.jsx`) when you build a new one.

| Convention | How |
|---|---|
| Styling | One `<style>{\`…\`}</style>` block per page with a page prefix (`.ss-`, `.cr-`, `.jr-`, `.bc-`). No CSS framework. |
| Brand colours | Deep teal `#073B3F` (primary), gold `#BB8958` / `#A0713F` (accent), background `#F8FAF9` |
| Icons | SVG only, from `components/SvgIcons.jsx`. No emoji in UI. |
| Loading | Skeleton blocks (`components/Skeleton`), never plain "Loading…" text. Skeletons fill whole grid rows (column count measured from `getComputedStyle(grid).gridTemplateColumns`). |
| Lists | First page (20–30 items) then infinite scroll. A `reqIdRef` counter drops stale responses when filters change quickly. |
| Confirmations | Custom confirm popups with an SVG icon, short text and a busy spinner. No `window.alert` or `confirm`. |
| Responsive | Card grids 4 columns desktop → 3 tablet → 2 mobile. 16 px side padding on mobile. |
| Money | `₹` + `toLocaleString("en-IN")`, rounded to the rupee |

### Build notes

- Vite 8 with rolldown. `npm run build` is the quickest way to check syntax across the whole app.
- `npm run lint` is currently broken (ESLint 9 vs. the config file). Treat a clean build as the gate until lint is fixed.
