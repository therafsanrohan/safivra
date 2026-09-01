# Safivra Global Edge & CDN Architecture (1.2M RPS Readiness)

## Architectural Principle
The target architecture assumes **95%+ of incoming traffic (1.2 Million RPS)** is absorbed at the Global Edge before reaching PostgreSQL.

```
Incoming Request (1,200,000 RPS)
       │
       ▼
┌─────────────────────────────────────────┐
│ Cloudflare WAF / Bot Management / DDoS  │  (Blocks malicious & bot traffic)
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ Cloudflare Global Edge Cache            │  (Caches static assets & public API)
└────────────────────┬────────────────────┘
                     │ (~5% dynamic traffic)
                     ▼
┌─────────────────────────────────────────┐
│ Vercel API Gateway & Rate Limiters      │  (Sliding window 100 req/min/IP)
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ Upstash Redis / Read Model Layer        │  (Serves cached dashboard & reports)
└────────────────────┬────────────────────┘
                     │ (<0.5% write traffic)
                     ▼
┌─────────────────────────────────────────┐
│ PostgreSQL Financial Ledger (Supabase)  │  (Authoritative Financial Source)
└─────────────────────────────────────────┘
```

---

## Edge Cache Rules Matrix

| Endpoint Pattern | Cache Level | Cache-Control Header | Edge Behavior |
|------------------|-------------|----------------------|---------------|
| `/assets/*`, `/*.js`, `/*.css` | `PUBLIC` | `public, max-age=31536000, immutable` | Cached at 300+ Edge locations globally |
| `/api/v1/health` | `PUBLIC` | `public, max-age=60, s-maxage=300` | Cached at Edge |
| `/api/v1/flags` | `PUBLIC` | `public, max-age=60, s-maxage=300` | Cached at Edge |
| `/api/v1/dashboard` | `PRIVATE / USER` | `private, max-age=60, stale-while-revalidate=300` | Never cached publicly; Redis cached per user |
| `/api/v1/analytics/reports` | `PRIVATE / USER` | `private, max-age=60, stale-while-revalidate=300` | Never cached publicly; Redis cached per user |
| `/api/v1/transactions` | `NO-STORE` | `no-store, no-cache, must-revalidate` | Bypasses all cache; passes directly to API |

---

## Security & WAF Configuration
1. **DDoS Protection**: Rate limit 100 HTTP requests per minute per IP on `/api/v1/*`.
2. **Bot Filtering**: Challenge requests missing standard browser `User-Agent` or TLS fingerprints on non-public routes.
3. **Idempotency Protection**: Header `X-Idempotency-Key` required on financial POST requests.
