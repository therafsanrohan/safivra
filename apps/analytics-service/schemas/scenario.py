"""
Scenario Planning API schemas — v1.0.0

All monetary values use Decimal for exact arithmetic.
The scenario engine is read-only: it never posts transactions, modifies
balances, or writes to the ledger. Saving a scenario stores a hypothetical
plan only.
"""
from __future__ import annotations

from decimal import Decimal
from typing import List, Optional, Dict
from pydantic import BaseModel, ConfigDict, Field, field_validator


# ─── Inbound models ──────────────────────────────────────────────────────────

class CategoryConstraint(BaseModel):
    """
    User-confirmed flexibility rules for a single spending category.
    Unconfirmed categories (is_flexibility_confirmed=False) are treated as
    unavailable for automatic cuts.
    """
    model_config = ConfigDict(strict=True)

    category_id: str
    display_name: Optional[str] = None   # for explanation text only, never used in calculations

    # Flexibility
    is_essential: bool = False           # never reduce (housing, medicine, etc.)
    is_flexibility_confirmed: bool = False  # user explicitly marked as flexible

    # Guardrails (in the planning period's currency)
    min_allocation: Decimal = Decimal("0")   # floor: never cut below this
    max_reduction: Optional[Decimal] = None  # ceiling on how much can be removed

    # Historical spend data for the planning period (from snapshot)
    period_spent_so_far: Decimal = Decimal("0")   # already posted, cannot be savings
    period_allocation: Decimal = Decimal("0")     # current planned spend for period

    @field_validator("min_allocation", "period_spent_so_far", "period_allocation", mode="before")
    @classmethod
    def coerce_decimal(cls, v: object) -> Decimal:
        return Decimal(str(v))

    @field_validator("max_reduction", mode="before")
    @classmethod
    def coerce_optional_decimal(cls, v: object) -> Optional[Decimal]:
        return Decimal(str(v)) if v is not None else None


class ProposedChange(BaseModel):
    """A single what-if change proposed by the user."""
    model_config = ConfigDict(strict=True)

    change_type: str = Field(..., description="'category_allocation' | 'one_time_purchase' | 'savings_allocation'")
    category_id: Optional[str] = None
    label: Optional[str] = None           # for one-time items without a category
    new_allocation: Optional[Decimal] = None
    one_time_amount: Optional[Decimal] = None  # positive = extra outflow

    @field_validator("new_allocation", "one_time_amount", mode="before")
    @classmethod
    def coerce_optional_decimal(cls, v: object) -> Optional[Decimal]:
        return Decimal(str(v)) if v is not None else None


class ScenarioRequest(BaseModel):
    """
    Full inputs for one scenario calculation.
    The caller (NestJS API) is responsible for:
    - Authenticating the user (JWT)
    - Fetching and scoping data to owner_id
    - Computing available_funds and commitments via the finance engine
    - Stamping snapshot_revision so stale scenarios can be detected
    """
    model_config = ConfigDict(strict=True)

    # Identity / integrity
    owner_id: str
    snapshot_revision: str = Field(..., description="Opaque revision token (e.g. hash of data fetch timestamp)")
    currency: str = Field(..., min_length=3, max_length=3)
    calculation_version: str = "1.0.0"

    # Current financial state (computed by finance engine, already deducted)
    available_funds: Decimal = Field(..., description="Current Available to Spend after commitments and reserves")
    total_commitments: Decimal = Field(Decimal("0"), description="Total outstanding obligations (already deducted from available_funds)")
    total_protected_funds: Decimal = Field(Decimal("0"), description="Protected reserves (already deducted from available_funds, do NOT deduct again)")
    eligible_current_funds: Decimal = Field(Decimal("0"), description="Gross eligible account balances before deductions")

    # Planning horizon
    planning_days: int = Field(7, ge=1, le=90, description="Number of days in the planning period")

    # Forecast (Optional — only from verified baseline, never from unpromoteed ML)
    seven_day_forecast: Optional[Decimal] = Field(None, description="Verified 7-day historical-average baseline. None = insufficient history.")
    forecast_source: str = Field("none", description="'historical_average' | 'none'")
    forecast_lookback_days: Optional[int] = None

    # Category constraints (user-confirmed preferences)
    category_constraints: List[CategoryConstraint] = Field(default_factory=list)

    # What-if proposed changes from the user
    proposed_changes: List[ProposedChange] = Field(default_factory=list)

    @field_validator(
        "available_funds", "total_commitments", "total_protected_funds",
        "eligible_current_funds", "seven_day_forecast",
        mode="before",
    )
    @classmethod
    def coerce_optional_decimal(cls, v: object) -> Optional[Decimal]:
        return Decimal(str(v)) if v is not None else None


# ─── Outbound models ─────────────────────────────────────────────────────────

class StartingAssumptions(BaseModel):
    model_config = ConfigDict(strict=True)

    available_funds: Decimal
    total_commitments: Decimal
    total_protected_funds: Decimal
    planning_days: int
    projected_variable_spend: Optional[Decimal]   # from verified forecast
    projected_gap: Decimal                         # positive = shortfall
    forecast_source: str
    forecast_limitations: List[str] = Field(default_factory=list)


class CategoryReduction(BaseModel):
    model_config = ConfigDict(strict=True)

    category_id: str
    display_name: Optional[str]
    current_allocation: Decimal
    proposed_allocation: Decimal
    reduction_amount: Decimal
    is_user_entered: bool = False  # True when user manually changed this in what-if editor


class ScenarioOption(BaseModel):
    model_config = ConfigDict(strict=True)

    option_index: int                     # 1, 2, or 3
    label: str                            # plain-language label
    total_reduction: Decimal              # sum of all category reductions
    remaining_gap: Decimal                # gap after this option's reductions (0 = fully closed)
    category_reductions: List[CategoryReduction]
    one_time_items: List[ProposedChange]  # echoed back from user's what-if input
    assumptions: List[str]                # plain-language explanation of each step
    limitations: List[str]                # what this option cannot do
    is_feasible: bool                     # False if gap cannot be closed under constraints


class ScenarioResponse(BaseModel):
    model_config = ConfigDict(strict=True)

    calculation_version: str = "1.0.0"
    snapshot_revision: str
    owner_id: str
    currency: str
    planning_days: int

    starting_assumptions: StartingAssumptions
    options: List[ScenarioOption]         # 0–3 options
    what_if_result: Optional[ScenarioOption] = None  # result of user's custom what-if

    generated_at: str                     # ISO timestamp
    source_freshness: str
    limitations: List[str] = Field(default_factory=list)
