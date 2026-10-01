# Athirai — Technical Documentation

Athirai (UI brand: **Luxiva**) is a jewellery and coin distribution platform with two sides in one codebase:

- **Network side**: a six-level distribution hierarchy (Super Admin → Super Stockist → Distributor → Wholesale Dealer → Retailer → Customer) plus a separate **Shop** network. Members move coin and jewellery stock down the chain, sell to walk-in customers and earn commission.
- **Customer side**: a public e-commerce storefront (collections, cart, wishlist, Razorpay checkout, order tracking, AUG coin wallet).

These documents are written for developers who will maintain or extend the system.

## Contents

| # | Document | What it covers |
|---|---|---|
| 1 | [Overview](01-overview.md) | Tech stack, system diagram, repository layout, glossary |
| 2 | [Roles & hierarchy](02-roles-and-hierarchy.md) | Every role, how users are linked, what each role can see and do, their pages |
| 3 | [Setup & deployment](03-setup-and-deployment.md) | Local setup, environment variables, running, deploying to Render |
| 4 | [Architecture & conventions](04-architecture.md) | Backend and frontend structure, auth, patterns used across pages |
| 5 | [Data model](05-data-model.md) | All 34 models, relationships, ID formats, delete behaviour |
| 6 | [API reference](06-api-reference.md) | All `/api/` endpoints grouped by feature, with the roles allowed |
| 7 | [Business flows](07-business-flows.md) | Stock requests, forward chain, sales & receipts, pricing, commission, rewards, promotions, orders, wallet |
| 8 | [Operations & safety](08-operations-and-safety.md) | Live-database rules, migrations, testing, known risks, incident notes |

## Quick facts

| | |
|---|---|
| Backend | Django 4.2 + Django REST Framework, JWT auth (SimpleJWT) |
| Frontend | React 19 + Vite, React Router 7 |
| Database | PostgreSQL on Neon |
| Hosting | Render (backend), Cloudinary (images), Razorpay (payments) |
| Size | ~117 API views, 123 API routes, 34 models, 69 migrations, 178 frontend routes |

> **Read [Operations & safety](08-operations-and-safety.md) before running any `manage.py` command.** `backend/.env` points at the **live** database.
