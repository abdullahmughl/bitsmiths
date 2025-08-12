# RecipeStudio — Simple MVP Architecture (Feature-Complete)

This **simpler** architecture implements all required features while staying easy to ship.

## Components

- **Next.js (SSR/CSR)** — single web app (editor, feed, search, collections)
- **Monolith API (NestJS/Express)** — modules: Auth, Recipes, Interactions & Collections, Feed, Search, Admin/Moderation, Notifications (WS/SSE)
- **PostgreSQL** — main relational store (normalized)
  lightweight queue for notifications
- **S3/R2** — image storage via presigned uploads
- **CDN (optional)** — edge caching for static and images

## Requirements Coverage (Checklist)

- ✅ **User registration & login** (Auth module)
- ✅ **Role-based access** (RBAC: `admin`, `user`)
- ✅ **Post recipes** — title, ingredients, steps, optional images (presigned S3 upload)
- ✅ **Draft by default** — recipes are `draft` until **publish** toggled
- ✅ **Like, Comment, Save** — users can like/comment and **save to personal collections**
- ✅ **Feed** — **Trending** (score-based) and **Recent** (published_at desc)
- ✅ **Search & Filter** — by **ingredients**, **categories**, **cooking time**
- ✅ **Admin moderation** — edit/delete recipes, **ban/unban** users
- ✅ **Notifications** — users get alerts on **likes** and **comments** (WebSocket/SSE)

## Minimal Data Flow

1. **Create Recipe (draft)** → API saves draft; image uploaded directly to S3 via **presigned URL**.
2. **Publish** → API flips `status` to `published`, sets `published_at`.
3. **Interactions** (like/comment/save) → API writes rows, updates counters.
4. **Notifications** → create notification row; push via WebSocket/SSE.
5. **Feed** → Recent by `published_at`, Trending by a **simple score** (cached for 30s in Redis).
6. **Search** → Postgres full-text search + filters: `ingredients @> ARRAY[...]`, `EXISTS recipe_categories`, `cooking_time_minutes <= ?`.

## Minimal Indexes

- `recipes(status, published_at DESC)` — feed/visibility
- `recipes USING GIN (search_tsv)` — title & ingredients FTS
- `recipe_categories(category_id)`, `recipe_ingredients(ingredient_id)` — filters
- `recipes(cooking_time_minutes)` — time filter
- `comments(recipe_id, created_at DESC)`, `likes(recipe_id, created_at DESC)` — fast interaction reads
- `notifications(recipient_id, read_at, created_at DESC)` — inbox

## API (Sketch)

- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`
- `GET /recipes?status=published&category=vegan&ingredients=garlic,tomato&time_lte=30&cursor=...`
- `POST /recipes` (draft), `POST /recipes/:id/publish`, `PATCH /recipes/:id`
- `POST /recipes/:id/like`, `DELETE /recipes/:id/like`
- `POST /recipes/:id/save`, `DELETE /recipes/:id/save`
- `GET /recipes/:id/comments`, `POST /recipes/:id/comments`
- `GET /feed?type=trending|recent&cursor=...`
- `GET /notifications?unread=true`, `POST /notifications/:id/read`
- Admin: `PATCH /users/:id/ban`, `PATCH /users/:id/unban`, `DELETE /recipes/:id`

## Scaling Later

- Add **read replicas** for Postgres, managed Redis, and a worker for notification delivery/feed warmup.
- Consider **Meilisearch, OpenSearch or Elastisearch** if search volume grows.
- Introduce **CDN** for images & static assets.

## Scalability Plan

**1) Scale the stateless app layer**

- Containerize FE and API; run behind a load balancer; enable autoscaling on CPU/RPS/latency.
- Keep API stateless (auth via httpOnly cookies/JWT). No sticky sessions required; WebSockets use Redis Pub/Sub adapter.

**2) Database growth (PostgreSQL)**

- Start: single primary with **PgBouncer** for pooling.
- Next: add **read replicas**; route read-heavy endpoints (feed/search) to replicas.
- Partition or cluster hottest tables later (e.g., `comments`, `likes`) by `recipe_id` or time; archive old notifications.
- Enforce **covering indexes** on `(status,published_at)`, `(recipe_id, created_at)` and tune autovacuum.

**3) Caching & queues**

- Redis for: feed pages (TTL 30–60s), trending IDs (sorted sets), notification counts, rate limiting.
- Background jobs: recompute trending sets, send notifications, index search docs, image post-processing.
- If job volume grows → move to managed queue with multiple workers.

**4) Search evolution**

- MVP: Postgres FTS on `title + ingredients`.
- Growth: introduce **Meilisearch/OpenSearch** for typo-tolerance and facet counts; sync via outbox pattern.

**5) Media & CDN**

- S3/R2 for originals; serve **responsive Media Files** via Next Image.
- Add CDN (CloudFront/Vercel) for images/static; aggressive cache with versioned URLs.

**6) Realtime notifications**

- Single WS node + Redis adapter → horizontal WS scaling.
- For very large scale, switch to managed pub/sub or push (e.g., FCM/OneSignal for mobile).

**7) Reliability & ops**

- Rate limit per IP/user; WAF on auth & write endpoints.
- Observability: SLOs, tracing metrics logs, errors logs (Sentry).
- CI/CD with blue/green or rolling deploys; run load tests before scale events.

---

## Performance Optimization (Fast Feed for All Networks)

**Backend & data**

- **Keyset pagination** on `(published_at, id)`; avoid OFFSET.
- **Trending precompute** every 1–5 min, store IDs in Redis ZSET; cache first N pages.
- Store **compact recipe cards** in Redis (id, title, author, hero_url, counters, published_at) to serve feed without DB hits.
- Maintain denormalized counters (`likes_count`, etc.); nightly reconciliation job.

**Caching & delivery**

- HTTP caching: `ETag`/`If-None-Match` for feed endpoints; CDN `s-maxage=30`, `stale-while-revalidate=60`.
- Compress responses.

**Frontend**

- First page via SSR/RSC; subsequent pages fetch on scroll with **cursor**.
- **Skeleton UIs** + prefetch next page when idle; cancel in-flight requests on route change.
- **Data Saver mode**: fewer items per page, smaller images, delay loading comments.
- **Images**: Next Image with responsive sizes, placeholders, lazy-load below the fold.
- **Bundle**: code-split routes, tree-shake, avoid heavy libs; HTTP/2/3 multiplexing.

**Network resilience**

- Retry with exponential backoff on transient errors; debounce user actions.
- Service Worker caches the **last feed page** for offline/poor connectivity.
- Detect connection via Network Information API to adapt (smaller page size, no autoplay).
