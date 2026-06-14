from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.claim import Claim, ClaimStatus
from app.models.claim_log import ClaimLog
from app.schemas.claim import ClaimCreate

class ClaimRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user_id: int, data: ClaimCreate) -> Claim:
        claim = Claim(user_id=user_id, **data.model_dump())
        self.db.add(claim)
        self.db.commit()
        self.db.refresh(claim)
        return claim

    def get_by_id(self, claim_id: int) -> Claim | None:
        return self.db.query(Claim).filter(Claim.id == claim_id).first()

    def get_by_id_for_update(self, claim_id: int) -> Claim | None:
        return (
            self.db.execute(
                select(Claim).where(Claim.id == claim_id).with_for_update()
            )
            .scalars()
            .first()
        )

    def get_by_user(self, user_id: int) -> list[Claim]:
        return self.db.query(Claim).filter(Claim.user_id == user_id).all()

    def get_by_status(self, status: ClaimStatus) -> list[Claim]:
        return self.db.query(Claim).filter(Claim.status == status).all()

    def transition(self, claim: Claim, to_status: ClaimStatus, actor_id: int, note: str | None) -> Claim:
        from_status = claim.status
        claim.status = to_status
        log = ClaimLog(
            claim_id=claim.id,
            user_id=actor_id,
            from_status=from_status,
            to_status=to_status,
            note=note,
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(claim)
        return claim

    def get_logs(self, claim_id: int) -> list[ClaimLog]:
        return self.db.query(ClaimLog).filter(ClaimLog.claim_id == claim_id).order_by(ClaimLog.created_at).all()
