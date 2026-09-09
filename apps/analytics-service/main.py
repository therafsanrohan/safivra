from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from datetime import date
from decimal import Decimal
import os

from schemas.domain import FinancialSnapshot
from schemas.api import InsightsResponse, BudgetPosition
from schemas.scenario import ScenarioRequest, ScenarioResponse
from domain.insights import calculate_comparable_period_spending
from domain.forecast import calculate_7_day_baseline
from domain.rules import AccountingRules
from domain.scenario import calculate_scenario

app = FastAPI(title="Safivra Analytics Service", version="1.0.0")

# Security
API_KEY = os.getenv("INTERNAL_API_KEY", "dev-secret-key")
api_key_header = APIKeyHeader(name="X-Internal-API-Key", auto_error=True)

async def verify_api_key(api_key_header: str = Security(api_key_header)):
    if api_key_header != API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")
    return api_key_header

# Optional: strictly lock down CORS if running on a separate port/host, 
# though this should only be called server-to-server.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to internal VPC IP / local loopback
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "analytics"}

@app.get("/v1/scenario/health")
def scenario_health():
    return {"status": "ok", "service": "scenario", "version": "1.0.0"}

@app.post("/v1/scenario/calculate", response_model=ScenarioResponse)
def calculate_spending_scenario(
    request: ScenarioRequest,
    api_key: str = Depends(verify_api_key),
):
    """
    Generate spending guidance options and a what-if preview.

    The engine is read-only: it performs no database writes and does not
    post transactions, modify balances, or alter any financial records.

    Security: caller must supply a valid internal API key. The owner_id in
    the request body must be pre-validated by the NestJS proxy (which
    extracts it from the authenticated JWT) before forwarding here.
    """
    return calculate_scenario(request)

@app.post("/v1/insights", response_model=InsightsResponse)
def generate_insights(snapshot: FinancialSnapshot, api_key: str = Depends(verify_api_key)):
    """
    Generate deterministic insights and baseline forecast from a bounded financial snapshot.
    """
    
    # 1. Comparable period spending (e.g. Month to date vs Last Month to date)
    # For a real implementation, the period dates would be provided in the request or calculated based on the user's timezone.
    # Here we do a generic 30-day vs previous 30-day based on the as_of date.
    current_end = snapshot.as_of.date()
    import datetime
    current_start = current_end - datetime.timedelta(days=30)
    prior_end = current_start - datetime.timedelta(days=1)
    prior_start = prior_end - datetime.timedelta(days=30)
    
    spending_comparison = calculate_comparable_period_spending(
        snapshot, current_start, current_end, prior_start, prior_end
    )
    
    # 2. Budget Position
    # Simplistic budget calculation: sum expenses for current month.
    # In a full implementation, the budget definition comes from the snapshot.
    budget_positions = []
    eligible_expenses = AccountingRules.filter_eligible_expenses(snapshot.transactions)
    current_month_txs = [tx for tx in eligible_expenses if tx.date.year == current_end.year and tx.date.month == current_end.month]
    total_spent = AccountingRules.sum_transactions(current_month_txs, snapshot.base_currency)
    
    # Mock budget limit for demonstration
    budget_limit = Decimal('50000.0000') 
    
    budget_positions.append(
        BudgetPosition(
            budget_id="default-monthly",
            total_budget=budget_limit,
            spent_amount=total_spent,
            remaining_amount=max(Decimal('0'), budget_limit - total_spent),
            is_overspent=total_spent > budget_limit,
            currency=snapshot.base_currency
        )
    )
    
    # 3. 7-Day Baseline Forecast
    forecast = calculate_7_day_baseline(snapshot)
    
    limitations = []
    if forecast and forecast.data_quality_warning:
        limitations.append(forecast.data_quality_warning)
        
    return InsightsResponse(
        snapshot_id=snapshot.snapshot_id,
        as_of=snapshot.as_of.isoformat(),
        spending_comparison=spending_comparison,
        budget_positions=budget_positions,
        seven_day_baseline=forecast,
        limitations=limitations
    )
