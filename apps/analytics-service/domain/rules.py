from decimal import Decimal
from typing import List
from schemas.domain import Transaction, TransactionType, TransactionStatus

class AccountingRules:
    @staticmethod
    def is_eligible_expense(tx: Transaction) -> bool:
        """
        Check if a transaction is a valid expense for insights.
        - Must be posted
        - Must be an expense (not a transfer or loan payment)
        - Must not be fully refunded
        """
        if tx.status != TransactionStatus.POSTED:
            return False
            
        if tx.type != TransactionType.EXPENSE:
            return False
            
        if tx.is_refunded:
            return False
            
        return True

    @staticmethod
    def filter_eligible_expenses(transactions: List[Transaction]) -> List[Transaction]:
        return [tx for tx in transactions if AccountingRules.is_eligible_expense(tx)]

    @staticmethod
    def sum_transactions(transactions: List[Transaction], currency: str) -> Decimal:
        """
        Sum transactions, ensuring exact decimal arithmetic and currency match.
        Different currencies are not directly added.
        """
        total = Decimal('0.0000')
        for tx in transactions:
            if tx.currency == currency:
                total += tx.amount
        return total
