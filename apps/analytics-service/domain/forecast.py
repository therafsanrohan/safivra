from decimal import Decimal
from typing import List, Optional
from schemas.domain import FinancialSnapshot, Transaction
from schemas.api import BaselineForecast
from domain.rules import AccountingRules
from datetime import timedelta

def calculate_7_day_baseline(snapshot: FinancialSnapshot, lookback_days: int = 28) -> Optional[BaselineForecast]:
    """
    Calculate a simple 7-day variable-spending baseline.
    Requires at least `lookback_days` of history.
    """
    eligible_transactions = AccountingRules.filter_eligible_expenses(snapshot.transactions)
    
    cutoff_date = snapshot.as_of.date()
    start_date = cutoff_date - timedelta(days=lookback_days)
    
    # Check data coverage (naive check: are there transactions spanning the period?)
    # In a real app, this would check missing dates/sync gaps.
    if not eligible_transactions:
        return BaselineForecast(
            forecast_amount=Decimal('0'),
            currency=snapshot.base_currency,
            lookback_days=lookback_days,
            data_quality_warning="Insufficient history: No transactions found."
        )
        
    oldest_tx_date = min(tx.date for tx in eligible_transactions)
    if oldest_tx_date > start_date:
         return BaselineForecast(
            forecast_amount=Decimal('0'),
            currency=snapshot.base_currency,
            lookback_days=lookback_days,
            data_quality_warning="Insufficient history: Transactions do not cover the full lookback period."
        )

    # Filter txs in the lookback window
    window_txs = [tx for tx in eligible_transactions if start_date <= tx.date < cutoff_date]
    total_spent = AccountingRules.sum_transactions(window_txs, snapshot.base_currency)
    
    # Weekly average = (Total spent / lookback_days) * 7
    daily_average = total_spent / Decimal(lookback_days)
    seven_day_forecast = daily_average * Decimal(7)
    
    return BaselineForecast(
        forecast_amount=seven_day_forecast.quantize(Decimal('0.0000')),
        currency=snapshot.base_currency,
        lookback_days=lookback_days
    )
