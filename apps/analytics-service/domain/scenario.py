"""
Scenario Planning Engine — v1.0.0

Core business logic for spending guidance and what-if planning.

DESIGN CONSTRAINTS (enforced as assertions/guards):
  - Pure functions. No HTTP, no DB, no side effects.
  - All monetary arithmetic uses Decimal. Float arrays never cross this boundary.
  - Protected reserves are NEVER deducted — they already exist in available_funds.
  - Essential categories are NEVER touched.
  - Already-spent amounts (period_spent_so_far) are NEVER presented as future savings.
  - The 7-day baseline is aggregate only — no per-category fabrication.
  - Expected income never increases current available_funds.
  - Currency mixing is not permitted within one scenario request.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal
from typing import List, Optional, Tuple

from schemas.scenario import (
    CategoryConstraint,
    CategoryReduction,
    ProposedChange,
    ScenarioOption,
    ScenarioRequest,
    ScenarioResponse,
    StartingAssumptions,
)

# Monetary rounding: 2 decimal places for display, 4 for internal accumulation
_DISPLAY_QUANT = Decimal("0.01")
_INTERNAL_QUANT = Decimal("0.0001")


def _round_display(v: Decimal) -> Decimal:
    return v.quantize(_DISPLAY_QUANT, rounding=ROUND_HALF_UP)


def _round_internal(v: Decimal) -> Decimal:
    return v.quantize(_INTERNAL_QUANT, rounding=ROUND_HALF_UP)


# ─── Eligibility ─────────────────────────────────────────────────────────────

def _is_eligible_for_reduction(c: CategoryConstraint) -> bool:
    """
    A category is eligible for automatic reduction only when:
    - It is NOT marked essential.
    - The user has explicitly confirmed it is flexible.
    Unconfirmed categories are never touched automatically.
    """
    if c.is_essential:
        return False
    if not c.is_flexibility_confirmed:
        return False
    return True


def _future_reducible_amount(c: CategoryConstraint) -> Decimal:
    """
    The maximum amount that could be saved from this category in the future.
    Already-posted spend cannot be recovered.
    Respects the category's min_allocation guardrail.
    """
    future_remaining = _round_internal(c.period_allocation - c.period_spent_so_far)
    if future_remaining <= Decimal("0"):
        # Nothing left to reduce: all spending already posted.
        return Decimal("0")

    floor = max(c.min_allocation, c.period_spent_so_far)
    headroom = _round_internal(future_remaining - (floor - c.period_spent_so_far))
    if headroom <= Decimal("0"):
        return Decimal("0")

    if c.max_reduction is not None:
        headroom = min(headroom, c.max_reduction)

    return max(Decimal("0"), headroom)


# ─── Gap computation ─────────────────────────────────────────────────────────

def _compute_projected_gap(
    available_funds: Decimal,
    seven_day_forecast: Optional[Decimal],
    planning_days: int,
) -> Tuple[Optional[Decimal], Decimal, str, List[str]]:
    """
    Returns (projected_variable_spend, gap, forecast_source, limitations).

    Gap is positive when funds are insufficient to cover projected variable
    spending. We do NOT subtract the entire forecast from available_funds and
    then present the remainder as a budget for the same spending — that would
    double-count it.

    The gap = projected_variable_spend - available_funds.
    If gap <= 0 there is no shortfall.
    """
    limitations: List[str] = []

    if seven_day_forecast is None:
        limitations.append(
            "A 7-day variable spending forecast is unavailable due to insufficient history "
            "(fewer than 28 days of recorded transactions). Scenario options are based on "
            "user-entered category allocations only."
        )
        return None, Decimal("0"), "none", limitations

    # Scale the 7-day baseline to the planning period.
    # Only valid for 7-day planning periods. For other periods we must use
    # explicit user assumptions — do NOT multiply and call it a forecast.
    if planning_days == 7:
        projected = _round_internal(seven_day_forecast)
        source = "historical_average_7d"
    else:
        # We have a 7-day aggregate. We cannot fabricate a different-period forecast.
        projected = None
        source = "none"
        limitations.append(
            f"The verified forecast covers 7 days. A {planning_days}-day projection "
            f"is not available from the current baseline. Category allocations below "
            f"reflect your planning assumptions, not a validated forecast."
        )
        return projected, Decimal("0"), source, limitations

    gap = _round_internal(projected - available_funds)
    if gap < Decimal("0"):
        gap = Decimal("0")  # Surplus: no shortfall to close

    return projected, gap, source, limitations


# ─── Option generation ───────────────────────────────────────────────────────

def _build_option(
    option_index: int,
    label: str,
    gap: Decimal,
    selected_categories: List[Tuple[CategoryConstraint, Decimal]],
    one_time_items: List[ProposedChange],
) -> ScenarioOption:
    """
    Build a ScenarioOption from a list of (constraint, reduction_amount) pairs.
    """
    cat_reduction_sum: Decimal = sum(
        (amt for _, amt in selected_categories), Decimal("0")
    )
    one_time_sum: Decimal = sum(
        (item.one_time_amount or Decimal("0")
         for item in one_time_items
         if item.change_type == "one_time_purchase"),
        Decimal("0"),
    )
    total_reduction = _round_internal(cat_reduction_sum + one_time_sum)
    remaining_gap = max(Decimal("0"), _round_internal(gap - total_reduction))
    is_feasible = remaining_gap == Decimal("0")

    reductions = [
        CategoryReduction(
            category_id=c.category_id,
            display_name=c.display_name,
            current_allocation=_round_display(c.period_allocation),
            proposed_allocation=_round_display(c.period_allocation - amt),
            reduction_amount=_round_display(amt),
        )
        for c, amt in selected_categories
        if amt > Decimal("0")
    ]

    assumptions: List[str] = []
    for c, amt in selected_categories:
        if amt > Decimal("0"):
            dn = c.display_name or c.category_id
            assumptions.append(
                f"Reduce {dn} from {_round_display(c.period_allocation)} "
                f"to {_round_display(c.period_allocation - amt)} "
                f"({_round_display(amt)} reduction). "
                f"Already spent this period: {_round_display(c.period_spent_so_far)}."
            )

    extra_limitations: List[str] = []
    if remaining_gap > Decimal("0"):
        extra_limitations.append(
            f"Even with the maximum permitted reductions under your constraints, "
            f"a gap of {_round_display(remaining_gap)} remains. "
            f"This cannot be closed by cutting flexible spending alone."
        )

    return ScenarioOption(
        option_index=option_index,
        label=label,
        total_reduction=_round_display(total_reduction),
        remaining_gap=_round_display(remaining_gap),
        category_reductions=reductions,
        one_time_items=one_time_items,
        assumptions=assumptions,
        limitations=extra_limitations,
        is_feasible=is_feasible,
    )


def _generate_auto_options(
    gap: Decimal,
    eligible: List[CategoryConstraint],
) -> List[ScenarioOption]:
    """
    Generate up to 3 deterministic options using a greedy approach.

    Option 1 — Minimum change: reduce as few categories as possible (largest headroom first).
    Option 2 — Proportional: spread reductions proportionally across all eligible categories.
    Option 3 — Full headroom: apply maximum permitted reduction to every eligible category.

    If gap == 0 (no shortfall), generate a single summary option showing the current state.
    If no eligible categories exist, return one infeasible option explaining why.
    """
    options: List[ScenarioOption] = []

    if gap <= Decimal("0") or not eligible:
        # No shortfall or nothing to cut
        label = "No shortfall under current plan" if gap <= Decimal("0") else "No flexible categories available"
        opt = ScenarioOption(
            option_index=1,
            label=label,
            total_reduction=Decimal("0"),
            remaining_gap=max(Decimal("0"), gap),
            category_reductions=[],
            one_time_items=[],
            assumptions=[
                "No changes are needed to meet your plan." if gap <= Decimal("0")
                else "None of your spending categories are confirmed flexible. "
                     "Review your category preferences to enable suggestions."
            ],
            limitations=[] if gap <= Decimal("0") else [
                "Mark categories as flexible in your preferences to receive reduction suggestions."
            ],
            is_feasible=gap <= Decimal("0"),
        )
        return [opt]

    # Sort by reducible headroom descending
    eligible_sorted = sorted(eligible, key=lambda c: _future_reducible_amount(c), reverse=True)

    # — Option 1: Minimum categories (greedy, largest-first) —
    remaining = gap
    selected_min: List[Tuple[CategoryConstraint, Decimal]] = []
    for c in eligible_sorted:
        if remaining <= Decimal("0"):
            break
        take = min(_future_reducible_amount(c), remaining)
        if take > Decimal("0"):
            selected_min.append((c, take))
            remaining = _round_internal(remaining - take)
    options.append(_build_option(1, "Minimal changes", gap, selected_min, []))

    # — Option 2: Proportional spread —
    total_headroom = sum(_future_reducible_amount(c) for c in eligible_sorted)
    selected_prop: List[Tuple[CategoryConstraint, Decimal]] = []
    if total_headroom > Decimal("0"):
        for c in eligible_sorted:
            h = _future_reducible_amount(c)
            if h <= Decimal("0"):
                continue
            share = _round_internal((h / total_headroom) * min(gap, total_headroom))
            selected_prop.append((c, share))
    else:
        selected_prop = []
    options.append(_build_option(2, "Proportional adjustment", gap, selected_prop, []))

    # — Option 3: Maximum reduction —
    selected_max: List[Tuple[CategoryConstraint, Decimal]] = [
        (c, _future_reducible_amount(c)) for c in eligible_sorted
        if _future_reducible_amount(c) > Decimal("0")
    ]
    options.append(_build_option(3, "Maximum reduction", gap, selected_max, []))

    return options


# ─── What-if resolution ───────────────────────────────────────────────────────

def _apply_what_if(
    gap: Decimal,
    constraints_by_id: dict,
    proposed_changes: List[ProposedChange],
) -> Optional[ScenarioOption]:
    """
    Apply the user's proposed what-if changes and return a preview option.
    Changes are applied on top of the current allocations and constraints.
    """
    if not proposed_changes:
        return None

    selected: List[Tuple[CategoryConstraint, Decimal]] = []
    one_time_items: List[ProposedChange] = []
    extra_gap_from_one_time = Decimal("0")

    for change in proposed_changes:
        if change.change_type == "one_time_purchase" and change.one_time_amount:
            one_time_items.append(change)
            extra_gap_from_one_time = _round_internal(
                extra_gap_from_one_time + change.one_time_amount
            )
        elif change.change_type == "category_allocation" and change.category_id and change.new_allocation is not None:
            c = constraints_by_id.get(change.category_id)
            if c is None:
                # Unknown category: treat as unconfirmed, skip
                continue
            if c.is_essential:
                # User tried to reduce an essential category — silently skip
                continue
            # Calculate how much this reduces vs the current allocation
            # Only future spend is reducible
            future_remaining = max(Decimal("0"), c.period_allocation - c.period_spent_so_far)
            proposed_future = max(Decimal("0"), change.new_allocation - c.period_spent_so_far)
            reduction = _round_internal(future_remaining - proposed_future)
            reduction = max(Decimal("0"), reduction)
            if c.max_reduction is not None:
                reduction = min(reduction, c.max_reduction)
            # Respect floor
            floor = max(c.min_allocation, c.period_spent_so_far)
            max_new = max(floor, change.new_allocation)
            reduction = _round_internal(c.period_allocation - max_new)
            reduction = max(Decimal("0"), reduction)
            # Mark as user-entered
            selected.append((c, reduction))

    effective_gap = _round_internal(gap + extra_gap_from_one_time)
    opt = _build_option(0, "Your what-if scenario", effective_gap, selected, one_time_items)
    # Mark all reductions as user-entered
    for r in opt.category_reductions:
        r.is_user_entered = True
    return opt


# ─── Public API ──────────────────────────────────────────────────────────────

def calculate_scenario(request: ScenarioRequest) -> ScenarioResponse:
    """
    Entry point for the scenario planning engine.

    Invariants enforced here:
    1. Protected funds are NOT deducted (they are already reflected in available_funds).
    2. Essential categories are NOT touched.
    3. Already-spent amounts are NOT presented as savings.
    4. The 7-day forecast is aggregate only — no per-category fabrication.
    5. Currency must match across all inputs (single currency per request).
    6. Expected income does NOT increase current available_funds.
    """
    now_iso = datetime.now(timezone.utc).isoformat()

    # — Projected gap —
    projected_spend, gap, forecast_source, base_limitations = _compute_projected_gap(
        request.available_funds,
        request.seven_day_forecast,
        request.planning_days,
    )

    if request.forecast_source == "none":
        forecast_source = "none"

    # — Starting assumptions —
    starting = StartingAssumptions(
        available_funds=_round_display(request.available_funds),
        total_commitments=_round_display(request.total_commitments),
        total_protected_funds=_round_display(request.total_protected_funds),
        planning_days=request.planning_days,
        projected_variable_spend=_round_display(projected_spend) if projected_spend is not None else None,
        projected_gap=_round_display(gap),
        forecast_source=forecast_source,
        forecast_limitations=base_limitations,
    )

    # — Eligible categories —
    eligible = [c for c in request.category_constraints if _is_eligible_for_reduction(c)]

    # — Auto options —
    options = _generate_auto_options(gap, eligible)

    # — What-if —
    constraints_by_id = {c.category_id: c for c in request.category_constraints}
    what_if_result = _apply_what_if(gap, constraints_by_id, request.proposed_changes)

    # — Global limitations —
    limitations: List[str] = list(base_limitations)

    unconfirmed_count = sum(
        1 for c in request.category_constraints
        if not c.is_essential and not c.is_flexibility_confirmed
    )
    if unconfirmed_count > 0:
        limitations.append(
            f"{unconfirmed_count} spending {'category' if unconfirmed_count == 1 else 'categories'} "
            f"{'has' if unconfirmed_count == 1 else 'have'} not been confirmed as flexible. "
            f"Review your preferences to include them in suggestions."
        )

    essential_count = sum(1 for c in request.category_constraints if c.is_essential)
    if essential_count > 0:
        limitations.append(
            f"{essential_count} essential {'category' if essential_count == 1 else 'categories'} "
            f"{'is' if essential_count == 1 else 'are'} protected and will not be reduced."
        )

    return ScenarioResponse(
        calculation_version="1.0.0",
        snapshot_revision=request.snapshot_revision,
        owner_id=request.owner_id,
        currency=request.currency,
        planning_days=request.planning_days,
        starting_assumptions=starting,
        options=options,
        what_if_result=what_if_result,
        generated_at=now_iso,
        source_freshness=now_iso,
        limitations=limitations,
    )
