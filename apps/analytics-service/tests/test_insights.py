"""
Accounting rules and insights sanity tests.

Run from the analytics-service directory:
    python -m pytest tests/test_insights.py -v
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from decimal import Decimal
from datetime import date, datetime
import pytest

from schemas.domain import FinancialSnapshot, Transaction, TransactionType, TransactionStatus
from domain.rules import AccountingRules
from domain.forecast import calculate_7_day_baseline


def _tx(id: str, amount: str, tx_type: TransactionType = TransactionType.EXPENSE,
        status: TransactionStatus = TransactionStatus.POSTED, days_ago: int = 1,
        is_refunded: bool = False, currency: str = "BDT") -> Transaction:
    from datetime import timedelta
    return Transaction(
        id=id,
        date=date.today() - timedelta(days=days_ago),
        amount=Decimal(amount),
        currency=currency,
        type=tx_type,
        status=status,
        is_refunded=is_refunded,
    )


def _snapshot(transactions: list) -> FinancialSnapshot:
    return FinancialSnapshot(
        owner_id="test-user",
        snapshot_id="snap-test",
        as_of=datetime.now(),
        timezone="Asia/Dhaka",
        transactions=transactions,
        base_currency="BDT",
    )


class TestAccountingRules:
    def test_expense_is_eligible(self):
        tx = _tx("1", "500")
        assert AccountingRules.is_eligible_expense(tx)

    def test_transfer_not_eligible(self):
        tx = _tx("2", "500", tx_type=TransactionType.TRANSFER)
        assert not AccountingRules.is_eligible_expense(tx)

    def test_income_not_eligible(self):
        tx = _tx("3", "1000", tx_type=TransactionType.INCOME)
        assert not AccountingRules.is_eligible_expense(tx)

    def test_loan_payment_not_eligible(self):
        tx = _tx("4", "1000", tx_type=TransactionType.LOAN_PAYMENT)
        assert not AccountingRules.is_eligible_expense(tx)

    def test_credit_card_payment_not_eligible(self):
        tx = _tx("5", "1000", tx_type=TransactionType.CREDIT_CARD_PAYMENT)
        assert not AccountingRules.is_eligible_expense(tx)

    def test_pending_not_eligible(self):
        tx = _tx("6", "500", status=TransactionStatus.PENDING)
        assert not AccountingRules.is_eligible_expense(tx)

    def test_refunded_not_eligible(self):
        tx = _tx("7", "500", is_refunded=True)
        assert not AccountingRules.is_eligible_expense(tx)

    def test_sum_transactions_same_currency(self):
        txs = [_tx("a", "100"), _tx("b", "200"), _tx("c", "300")]
        total = AccountingRules.sum_transactions(txs, "BDT")
        assert total == Decimal("600")

    def test_sum_transactions_excludes_different_currency(self):
        txs = [_tx("a", "100", currency="BDT"), _tx("b", "50", currency="USD")]
        total = AccountingRules.sum_transactions(txs, "BDT")
        assert total == Decimal("100")

    def test_filter_returns_only_eligible(self):
        txs = [
            _tx("1", "100"),  # eligible
            _tx("2", "200", tx_type=TransactionType.TRANSFER),
            _tx("3", "300", is_refunded=True),
        ]
        eligible = AccountingRules.filter_eligible_expenses(txs)
        assert len(eligible) == 1
        assert eligible[0].id == "1"


class TestForecastBaseline:
    def _make_28d_snapshot(self, daily_amount: str = "100") -> FinancialSnapshot:
        """Create a snapshot with 28+ days of history."""
        from datetime import timedelta
        txs = [
            _tx(str(i), daily_amount, days_ago=i)
            for i in range(1, 32)
        ]
        return _snapshot(txs)

    def test_7_day_baseline_calculated(self):
        snap = self._make_28d_snapshot("100")
        result = calculate_7_day_baseline(snap, lookback_days=28)
        assert result is not None
        assert result.data_quality_warning is None
        # Average daily spend = 100, 7-day forecast = 700
        assert result.forecast_amount > Decimal("0")

    def test_insufficient_history_returns_warning(self):
        txs = [_tx("1", "100", days_ago=3)]  # only 3 days of history
        snap = _snapshot(txs)
        result = calculate_7_day_baseline(snap, lookback_days=28)
        assert result.data_quality_warning is not None

    def test_no_transactions_returns_warning(self):
        snap = _snapshot([])
        result = calculate_7_day_baseline(snap, lookback_days=28)
        assert result.data_quality_warning is not None

    def test_currency_preserved_in_forecast(self):
        snap = self._make_28d_snapshot("500")
        result = calculate_7_day_baseline(snap, lookback_days=28)
        assert result.currency == "BDT"
