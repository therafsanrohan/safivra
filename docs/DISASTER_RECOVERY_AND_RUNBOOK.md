# Safivra Disaster Recovery Runbook & Backup Protocol

## Objectives
- **Recovery Point Objective (RPO)**: < 1 minute (Supabase Point-In-Time Recovery)
- **Recovery Time Objective (RTO)**: < 15 minutes for DB, < 5 minutes for API/App

---

## 1. Backup Verification Protocol
1. **PostgreSQL PITR**: Verified active in Supabase Dashboard -> Settings -> Database -> Backups.
2. **Supabase Storage Backup**: Storage objects (receipts, avatars, exports) backed up to AWS S3 / Cloudflare R2 bucket.
3. **Database Schema Verification**: Run `SELECT public.check_financial_integrity();` after any restore.

---

## 2. Emergency Rollback Procedures

### Application / Frontend Rollback
If a Vercel deployment introduces a frontend regression:
```bash
# Instant Vercel Rollback to previous deployment SHA
vercel rollback <previous-deployment-id>
```

### Database Migration Rollback
If a migration fails or must be reverted:
1. All migrations are **ADDITIVE** (expand-and-contract).
2. Existing columns and functions remain backward compatible.
3. If an emergency DB rollback is required, restore via Supabase PITR to a timestamp 1 minute prior to migration execution.

---

## 3. Financial Integrity Audit Runbook
Run in Supabase SQL Editor:
```sql
SELECT public.check_financial_integrity();
```
Expected Output:
```json
{
  "status": "healthy",
  "checks": {
    "orphaned_transactions": 0,
    "unbalanced_transactions": 0,
    "cross_user_entry_violations": 0,
    "nonzero_opening_balance_accts": 0,
    "invalid_void_state_txns": 0
  }
}
```
