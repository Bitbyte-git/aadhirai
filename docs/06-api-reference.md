# 6. API reference

Base URL: `https://<backend-host>/api/`. All endpoints need `Authorization: Bearer <access>` unless marked **public**. Role checks happen inside each view, so a wrong role gets `403 {"error": "..."}`.

Errors are always `{"error": "<human message>"}` with 400 / 403 / 404, or DRF field errors for serializer validation.

> The **Access** column summarises the role checks in `views.py` at the time of writing. The code is the source of truth, so confirm the check in the view before depending on it.

**Roles:** SA = Super Admin, SS = Super Stockist, DI = Distributor, WD = Wholesale Dealer, RT = Retailer, SH = Shop, CU = Customer. "Stock roles" = SA, SS, DI, WD, RT, SH. "Team" = the caller plus their downline (see [Roles → team scope](02-roles-and-hierarchy.md#team-scope--who-can-see-what)).

## Auth & account

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `ping/` | public | Health check (use it to wake Render) |
| POST | `login/` | public | `{email, password}`. `email` may be email, phone or member ID. Returns `{access, refresh, role, email}` and grants daily login rewards (non-SA). |
| POST | `login/refresh/` | public | `{refresh}` → new `access` |
| POST | `register-send-otp/`, `register-verify-otp/` | public | Email OTP for customer registration |
| POST | `public-register-customer/` | public | Register with a one-time referral token |
| GET | `referrer-info/` | public | Who owns a referral token |
| POST | `generate-referral-link/` | auth | New one-time referral token |
| GET | `my-info/` | auth | Caller's basic profile |
| GET/POST | `profile-update-request/` | auth | Submit or list profile change requests |
| POST | `profile-update-request/<pk>/approve/` | approver | Apply a profile change |

## Daily work check-in

Attendance tracking only; this feature does not change commissions, wallet balances or login rewards.

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `daily-work-check-in/` | SS, DI, WD, RT | Current user's IST date, three slot statuses, completion count, server time and next status-change time. |
| POST | `daily-work-check-in/` | SS, DI, WD, RT | Submit `{"slot":"12:00"}`, `{"slot":"16:00"}` or `{"slot":"20:00"}` for the authenticated user. |

Windows use **Asia/Kolkata**: 12:00-12:30, 16:00-16:30 and 20:00-20:30. Opening time is inclusive; closing time is exclusive. The backend selects the work date and timestamp. Clients cannot submit for another user or backdate a check-in.

Slot statuses are `upcoming`, `available`, `completed` and `missed`. A new submission returns `201`; a repeat of an already completed slot on the same day returns `200` without another record, including after that slot closes. Submitting outside the window returns `409` with `error` and the current status snapshot. Invalid slots return serializer errors (`400`); other roles receive `403`. GET and POST snapshots include `date`, `timezone`, `server_now`, `slots`, `completed_count`, `active_slot` and `next_change_at`; successful POST responses also include `created` and `message`.

The `DailyWorkCheckIn` model enforces unique `(user, work_date, slot)` submissions and valid slot IDs, with an index on `(work_date, slot)`. **Before enabling this feature, manually generate and apply the model migration** from `backend`: `python manage.py makemigrations accounts`, then `python manage.py migrate`. No migration file is supplied with this change.

### Super Admin check-in report

`GET daily-work-check-in/report/` is restricted to `super_admin`. It accepts optional `date` (YYYY-MM-DD, defaults to today in IST), `search` (ID/name/phone/email, max 100 characters), `role` (`all`, `admin`, `dealer`, `sub_dealer`, `promotor`), `status` (`all`, `checked_in`, `no_check_in`) and a signed `cursor` from the previous response. Future dates are rejected. Keep filters unchanged when using a cursor.

The first page returns `summary`: `all_users`, `daily_check_in` (at least one submission) and `no_check_in` (zero submissions). Counts cover currently active worker accounts created by the selected day, filtered by search and role; the status filter only affects the list. This is not a historical workforce-membership snapshot. Subsequent pages omit count computation (`summary: null`). Each page contains at most 40 users with member ID, name, phone, role and all three slots. Slots use `success` (with `submitted_at`), `available`, `upcoming` or `missed`; a missed slot has passed its exclusive closing time. The response also includes `date`, `timezone`, `server_now`, `items`, `has_more`, `next_cursor` and `page_size`.

Pagination uses an ascending user-ID cursor with an initial upper bound, not SQL offsets; profiles and check-ins are fetched in bounded batches. New submissions can change a user's filter membership while browsing; refresh restarts the list and counts. No additional model migration is needed beyond the worker check-in model migration.

## Creating & listing members

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET/POST | `admins/` | SA | Create or list Super Stockists |
| GET | `admins/list/` | SA, SS | Super Stockist list for pickers |
| GET/POST | `dealers/` | SS | Create or list own Distributors |
| GET | `dealers/list/` | auth | Distributor list |
| GET/POST | `sub-dealers/` | DI | Create or list own Wholesale Dealers |
| GET | `sub-dealers/list/` | auth | Wholesale list |
| GET/POST | `promotors/` | WD | Create or list own Retailers |
| GET | `promotors/list/` | auth | Retailer list |
| GET/POST | `customers/` | POST: RT, CU, SA · GET: RT–SS, SA, CU | Create or list customers |
| GET | `general-customers/`, `referral-customers/` | SA, SS | Customer lists by origin |
| POST | `shops/` | **public** | Shop registration form |
| GET | `shops/` | SA | All shops |
| GET | `my-shop-profile/` | SH | Own shop profile |
| GET | `shop-list/` | SA, SH | Shop list (paged) |
| GET | `users/lookup/` | SA | Find a user by id/phone/email |

## Hierarchy & dashboards

| Method | Path | Purpose |
|---|---|---|
| GET | `hierarchy/full/`, `my-hierarchy/` | Full tree / caller's tree |
| GET | `hierarchy/admins/`, `hierarchy/children/`, `hierarchy/tier-directory/` | Lazy tree loading |
| GET | `hierarchy/node-info/`, `hierarchy/path-to-node/`, `hierarchy/search-person/` | Popups, "locate in tree", search |
| GET | `hierarchy/node-orders/` | Sales Count page. `period=month|3months|6months`, offset/limit; first page carries totals. |
| GET | `hierarchy/subtree-orders/` | Orders under a node |
| GET | `role-distribution-counts/` | Members per role |
| GET | `dashboard/`, `dashboard-quick-stats/` | Home dashboard numbers (cached) |
| GET | `today-login-status/` | Login Active / Inactive lists (supports shops) |
| GET | `shop-hierarchy/`, `shop-dashboard-stats/` | Shop network tree and dashboard |
| GET | `shop-report/summary/`, `shop-report/trend/`, `shop-report/tree/`, `shop-report/login-status/` | Shop reports (`shop_id` narrows to a subtree) |
| GET | `sales-report/`, `sales-report/summary/`, `sales-report/trend/`, `order-timeseries/` | Sales reports and charts |

## Catalogue, storefront & orders

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET/POST | `metal-rates/` | GET public · POST SA | Today's (or latest) rates / set rates for a date |
| GET/POST | `jewelry-products/` | GET auth · POST SA | List (filters, `internal=true`) / create with `uploaded_images` |
| GET/PUT/PATCH/DELETE | `jewelry-products/<pk>/` | write: SA | Product detail |
| DELETE | `jewelry-product-images/<pk>/` | SA | Remove an image |
| GET | `jewelry-products/sold-out/` | SA | Sold-out list |
| GET | `products/affordable/` | public | AUG / affordable products |
| GET/POST | `notify-me/` | auth | Stock notify requests |
| GET/POST, PUT/DELETE | `home-banners/`, `home-banners/<pk>/` | write: SA | Homepage banners (slots 1–5) |
| GET/POST/DELETE | `cart/`, `cart/<pk>/qty/` | CU + network | Cart |
| GET/POST/DELETE | `wishlist/` | CU + network | Wishlist toggle |
| GET/POST | `orders/`, `orders/<pk>/` | auth | Place / list / view orders |
| GET | `admin-orders/` | SA | All orders |
| GET | `orders/<order_id>/receipt/` | owner, SA | Order receipt PDF |
| GET/POST | `orders/<order_id>/tracking/` | GET owner · POST SA | Tracking timeline |
| POST | `create-razorpay-order/`, `verify-payment/` | auth | Razorpay checkout; success triggers commission |
| POST | `orders/pay-with-coins/` | auth | Pay an order from AUG coin balance |
| POST | `generic-table-pdf/` | auth | Export any table to PDF |

## Coins & jewellery stock

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `coin-stock/` | stock roles | Own vault. `scope=hierarchy&paged=1` = team holdings (summary + members, offset/limit). |
| GET | `coin-stock/for-user/` | stock roles | Another member's coins (team only) |
| POST | `coin-stock/add/` | SA | Mint coins into the vault (`{items:[{metal_type, weight_label, weight_grams, qty}]}`), logged as `MASTER_MINT` |
| GET | `jewelry-stock/` | stock roles | Own jewellery; `scope=hierarchy&paged=1` for team |
| GET | `jewellery-stock-detail/<product_id>/` | stock roles | Who holds a design |
| GET | `member-holdings/<user_id>/` | stock roles | One member's full holdings. 403 outside team. |

### Requests (same shape for coins and jewellery)

| Method | Coins | Jewellery | Access | Purpose |
|---|---|---|---|---|
| POST | `coin-requests/` | `jewelry-requests/` | SS, DI, WD, RT, SH | New request to own leader. Coins: `{items:[{metal_type, weight_label, weight_grams, qty}]}` · Jewellery: `{items:[{product_id, qty}]}` |
| GET | `coin-requests/?box=board…` | `jewelry-requests/?box=board…` | stock roles | Board: cards, counts, one page ([format](04-architecture.md#the-board-endpoint-pattern)) |
| GET | `coin-requests/catalog/` | `jewelry-requests/catalog/` | SS–RT, SH | What the leader holds vs. Super-Admin-only stock |
| POST | `coin-requests/<pk>/approve/` | `jewelry-requests/<pk>/approve/` | receiver; SA any (`{password}`) | Move stock requester ← approver |
| POST | `coin-requests/<pk>/reject/` | `jewelry-requests/<pk>/reject/` | receiver; SA any (`{password}`) | `{message}` reason required |
| POST | `coin-requests/<pk>/forward/` | `jewelry-requests/<pk>/forward/` | receiver (not SA) | Forward the shortfall to own leader |
| POST | `coin-requests/approve-all/` | — | receiver; SA (`{password}`) | Approve every pending request addressed to the caller (skips chain-blocked ones) |

Request serializer extras: `forwarded_for`, `forward_info` (latest upstream status), `stock_shortfall` (what the approver is missing), `chain` (every hop from the first requester up), and for coins `covered_by_forwarder` (coins the forwarding leader already holds).

### Store sales

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `stock-sales/` | SS, DI, WD, RT, SH | Sell. Jewellery: `{kind:"jewellery", product_id, qty, discount_percent, customer_name, customer_phone}` · Coin: `{kind:"coin", coin_stock_id, qty, customer_name, customer_phone}` |
| GET | `stock-sales/` | stock roles | Team sales. Params: `kind`, `scope=all|mine|team`, `period`, `role`, `status`, `discounted=1`, `search`, `offset`, `limit`. Returns `items`, `summary`, `role_counts`, `top_sellers`, `discount_by`. |
| POST | `stock-sales/<pk>/cancel/` | seller, same day | Cancel and return stock |
| GET | `stock-sales/<pk>/receipt/` | seller, upline, SA | Receipt PDF |

## Commission, wallet & payments

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `wallet/` | auth | Balance + lifetime totals |
| POST | `recharge/create-order/`, `recharge/verify/` | auth | Buy AUG coins with Razorpay |
| GET | `recharge/history/`, `recharge/statement/` | auth | Ledger |
| GET | `superadmin/payments/` | SA; others `my_commission` / `team_commission` | Sales, commission views |
| GET | `superadmin/tier-commission/` | SA | Commission leaderboard by tier |
| POST | `admin/send-coins/` | SA | Credit coins to a user manually |
| GET | `admin/user-history/`, `admin/sent-history/` | SA | Manual credit history |
| POST | `autopay/create/`, `autopay/confirm/`, `autopay/toggle/` | auth | Razorpay subscription recharge |
| GET | `autopay/status/` · `autopay/mandates/` | auth · SA | Mandate status / list |
| POST | `autopay/webhook/` | Razorpay | Subscription events |

## Rewards, promotions, messaging

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `rewards/today/`, `login-reward-transactions/` | auth / SA | Login rewards |
| GET | `retailer-promotions/`, `wholesale-dealer-promotions/`, `distributor-promotions/`, `super-stockist-promotions/` | SA | Eligible candidates per tier |
| POST | `…-promotions/<user_id>/action/` | SA | Approve (convert role) or reject |
| GET | `promotion-customers/`, `promotion-nodes/` | SA | Drill-downs for promotion pages |
| GET/POST | `announcements/` | GET auth · POST SA | Announcements by role or to a person |
| GET/POST | `announcements/<pk>/replies/` | auth | One reply per user |
| GET/POST | `metal-orders/`, `metal-orders/summary/` | auth | Legacy bullion orders |
