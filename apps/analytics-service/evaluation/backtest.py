from decimal import Decimal
from typing import List, Dict, Tuple
from schemas.domain import FinancialSnapshot, Transaction
from domain.forecast import calculate_7_day_baseline
from datetime import timedelta

class BacktestResult:
    def __init__(self, target_currency: str):
        self.target_currency = target_currency
        self.errors = []
        self.valid_windows = 0
        self.missing_data_windows = 0
        
    def add_error(self, actual: Decimal, predicted: Decimal):
        self.errors.append(abs(actual - predicted))
        self.valid_windows += 1

    def report(self) -> Dict:
        if not self.valid_windows:
            return {
                "currency": self.target_currency,
                "valid_windows": 0,
                "missing_data_windows": self.missing_data_windows,
                "mae": None
            }
        
        mae = sum(self.errors) / len(self.errors)
        return {
             "currency": self.target_currency,
             "valid_windows": self.valid_windows,
             "missing_data_windows": self.missing_data_windows,
             "mae": mae.quantize(Decimal('0.0000'))
        }

def evaluate_7_day_baseline(snapshot: FinancialSnapshot, lookback_days: int = 28) -> Dict[str, dict]:
    """
    Chronological backtesting of the 7-day baseline forecast.
    Evaluates rolling 7-day windows against the subsequent 7 days of actuals.
    """
    results: Dict[str, BacktestResult] = {
        snapshot.base_currency: BacktestResult(snapshot.base_currency)
    }
    
    # Sort transactions chronologically
    txs = sorted(snapshot.transactions, key=lambda x: x.date)
    if not txs:
        return {k: v.report() for k, v in results.items()}
        
    oldest_date = txs[0].date
    newest_date = txs[-1].date
    
    # We need at least lookback_days + 7 days of history to test one window
    total_required_days = lookback_days + 7
    if (newest_date - oldest_date).days < total_required_days:
        results[snapshot.base_currency].missing_data_windows += 1
        return {k: v.report() for k, v in results.items()}

    # Slide a window across the history
    # Step by 7 days for each evaluation window
    current_cutoff = oldest_date + timedelta(days=lookback_days)
    
    while current_cutoff + timedelta(days=7) <= newest_date:
        # 1. Create a partial snapshot (simulate state at current_cutoff)
        # strict cutoff: < current_cutoff
        historical_txs = [tx for tx in txs if tx.date < current_cutoff]
        partial_snapshot = snapshot.model_copy(update={'transactions': historical_txs, 'as_of': current_cutoff})
        
        # 2. Predict
        forecast = calculate_7_day_baseline(partial_snapshot, lookback_days=lookback_days)
        
        if forecast.data_quality_warning:
             results[snapshot.base_currency].missing_data_windows += 1
        else:
             # 3. Calculate Actuals for the next 7 days
             target_end = current_cutoff + timedelta(days=7)
             actual_txs = [tx for tx in txs if current_cutoff <= tx.date < target_end and tx.currency == snapshot.base_currency]
             
             from domain.rules import AccountingRules
             eligible_actuals = AccountingRules.filter_eligible_expenses(actual_txs)
             actual_spent = AccountingRules.sum_transactions(eligible_actuals, snapshot.base_currency)
             
             # 4. Record error
             results[snapshot.base_currency].add_error(actual_spent, forecast.forecast_amount)
             
        current_cutoff += timedelta(days=7)
        
    return {k: v.report() for k, v in results.items()}
