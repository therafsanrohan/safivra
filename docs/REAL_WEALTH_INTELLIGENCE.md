# Safivra Real Wealth Intelligence

## Overview

The Real Wealth Intelligence module is Safivra's flagship analytical feature, designed to help users understand their true financial position through the lens of inflation, purchasing power, and future projections.

This module provides a unified view of:
- **Historical Purchasing Power:** How past money compares to today's value.
- **Current Asset Value:** Nominal and inflation-adjusted valuation of current holdings.
- **Future Projections:** Scenario-based projections over a 5-30 year horizon.

## Architecture

The system is built as a hybrid architecture consisting of:

1. **Supabase Database (Storage & RLS):**
   - `economic_series` & `economic_observations`: Centralized storage for macroeconomic indicators (CPI, GDP Growth, Policy Rates).
   - `asset_valuation_snapshots`: Periodic snapshots of user asset valuations.
   - `asset_projection_profiles`: User preferences for projections (e.g., target retirement age, risk tolerance).
   - `saved_asset_projections`: Saved "what-if" scenarios for future reference.

2. **NestJS API (`apps/api`):**
   - Serves as the secure gateway.
   - Proxies complex Monte Carlo simulations and heavy mathematical modeling to the internal Python Analytics microservice using the `X-Internal-API-Key`.
   - Uses `class` based DTOs for strict input validation to ensure production safety and build compatibility.

3. **React Frontend (`apps/member-web`):**
   - `RealWealthDashboard.tsx`: The main entry point.
   - `ScenarioEngine.tsx`: The interactive UI for scenario modeling, leveraging `recharts` for visual representations of Nominal vs. Real wealth divergence.

4. **Python Analytics Service (Internal):**
   - Handles the actual number-crunching for advanced projections (Asset Time Machine, inflation drag modeling).

## Security & Rollout Strategy

- **Zero-Downtime Rollout:** The module uses an internal "Email-based allowlist" strategy in `Navigation.tsx` and `MorePage.tsx` to safely gate the feature in production. Only specific administrative emails (e.g., `admin@safivra.com`) can access the module during the initial phase.
- **Row Level Security (RLS):** All user-specific tables (`asset_valuation_snapshots`, `saved_asset_projections`, etc.) enforce strict RLS policies (`auth.uid() = user_id`), ensuring data isolation.
- **Idempotent Migrations:** Migration scripts use `IF NOT EXISTS` and `DROP POLICY IF EXISTS` to prevent deployment conflicts in live environments.

## Future Enhancements
- Integration with live external API feeds for automated `economic_observations` updates.
- Expansion of the email allowlist to beta-testers, followed by a 100% public rollout.
