from decimal import Decimal
from typing import List, Optional, Dict
from pydantic import BaseModel, ConfigDict
from .domain import FinancialSnapshot


class PeriodComparison(BaseModel):
    model_config = ConfigDict(strict=True)
    
    current_period_amount: Decimal
    prior_period_amount: Decimal
    absolute_change: Decimal
    percentage_change: Optional[Decimal] = None
    currency: str


class CategoryChange(BaseModel):
    model_config = ConfigDict(strict=True)
    
    category_id: str
    absolute_change: Decimal
    is_significant: bool


class BudgetPosition(BaseModel):
    model_config = ConfigDict(strict=True)
    
    budget_id: str
    total_budget: Decimal
    spent_amount: Decimal
    remaining_amount: Decimal
    is_overspent: bool
    currency: str


class BaselineForecast(BaseModel):
    model_config = ConfigDict(strict=True)
    
    forecast_amount: Decimal
    currency: str
    lookback_days: int
    data_quality_warning: Optional[str] = None


class InsightsResponse(BaseModel):
    """
    Versioned analytical response.
    """
    model_config = ConfigDict(strict=True)

    calculation_version: str = "1.0.0"
    snapshot_id: str
    as_of: str
    
    # Insights
    spending_comparison: Optional[PeriodComparison] = None
    budget_positions: List[BudgetPosition] = []
    
    # ML Baseline Forecast
    seven_day_baseline: Optional[BaselineForecast] = None
    
    # Quality / Info
    limitations: List[str] = []
