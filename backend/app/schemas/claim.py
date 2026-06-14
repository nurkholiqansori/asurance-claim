from datetime import datetime
from pydantic import BaseModel
from app.models.claim import ClaimStatus

class ClaimCreate(BaseModel):
    title: str
    description: str
    amount: float

class ClaimOut(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    amount: float
    status: ClaimStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class ClaimTransition(BaseModel):
    note: str | None = None

class ClaimLogOut(BaseModel):
    id: int
    from_status: str | None
    to_status: str
    note: str | None
    created_at: datetime
    actor_name: str | None = None

    model_config = {"from_attributes": True}
