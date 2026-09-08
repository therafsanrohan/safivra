from decimal import Decimal
from typing import List, Optional
from schemas.domain import FinancialSnapshot, Transaction
from schemas.api import PeriodComparison
from domain.rules import AccountingRules
from datetime import date, timedelta


def calculate_comparable_period_spending(
    snapshot: FinancialSnapshot,
    current_start: date,
    current_end: date,
    prior_start: date,
    prior_end: date
) -> Optional[PeriodComparison]:
    """
    Compare spending between two periods.
    """
    eligible_transactions = AccountingRules.filter_eligible_expenses(snapshot.transactions)
    
    current_txs = [tx for tx in eligible_transactions if current_start <= tx.date <= current_end]
    prior_txs = [tx for tx in eligible_transactions if prior_start <= tx.date <= prior_end]
    
    current_total = AccountingRules.sum_transactions(current_txs, snapshot.base_currency)
    prior_total = AccountingRules.sum_transactions(prior_txs, snapshot.base_currency)
    
    if current_total == Decimal('0') and prior_total == Decimal('0'):
        return None
        
    abs_change = current_total - prior_total
    
    pct_change = None
    if prior_total > Decimal('0'):
        pct_change = (abs_change / prior_total) * Decimal('100')
        
    return PeriodComparison(
        current_period_amount=current_total,
        prior_period_amount=prior_total,
        absolute_change=abs_change,
        percentage_change=pct_change,
        currency=snapshot.base_currency
    )
