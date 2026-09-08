from decimal import Decimal
from datetime import date, datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class TransactionType(str, Enum):
    EXPENSE = "expense"
    INCOME = "income"
    TRANSFER = "transfer"
    LOAN_PAYMENT = "loan_payment"
    CREDIT_CARD_PAYMENT = "credit_card_payment"


class TransactionStatus(str, Enum):
    POSTED = "posted"
    PENDING = "pending"


class Transaction(BaseModel):
    model_config = ConfigDict(strict=True)

    id: str
    date: date
    amount: Decimal = Field(..., description="Exact monetary amount")
    currency: str = Field(..., min_length=3, max_length=3)
    type: TransactionType
    status: TransactionStatus
    
    # Optional metadata
    category_id: Optional[str] = None
    account_id: Optional[str] = None
    destination_account_id: Optional[str] = None
    
    # Internal linkage
    refund_transaction_id: Optional[str] = None
    is_refunded: bool = False


class FinancialSnapshot(BaseModel):
    """
    A bounded analytical snapshot submitted securely from the backend.
    No PII (names, emails) should be included.
    """
    model_config = ConfigDict(strict=True)

    owner_id: str = Field(..., description="Authorized owner scope")
    snapshot_id: str
    as_of: datetime
    timezone: str
    
    transactions: List[Transaction]
    base_currency: str = "BDT"
