from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.repositories.claim_repo import ClaimRepository
from app.models.claim import Claim, ClaimStatus
from app.models.user import UserRole
from app.schemas.claim import ClaimCreate, ClaimOut, ClaimLogOut

TRANSITIONS = {
    UserRole.user:     (ClaimStatus.draft,      ClaimStatus.submitted),
    UserRole.verifier: (ClaimStatus.submitted,   ClaimStatus.reviewed),
    UserRole.approver: (ClaimStatus.reviewed,    None),
}

class ClaimService:
    def __init__(self, db: Session):
        self.repo = ClaimRepository(db)

    def create(self, user_id: int, data: ClaimCreate) -> ClaimOut:
        claim = self.repo.create(user_id, data)
        return ClaimOut.model_validate(claim)

    def list_by_user(self, user_id: int) -> list[ClaimOut]:
        return [ClaimOut.model_validate(c) for c in self.repo.get_by_user(user_id)]

    def list_by_status(self, status: ClaimStatus) -> list[ClaimOut]:
        return [ClaimOut.model_validate(c) for c in self.repo.get_by_status(status)]

    def transition(self, claim_id: int, actor_id: int, actor_role: UserRole, to_status: ClaimStatus, note: str | None) -> ClaimOut:
        claim = self.repo.get_by_id_for_update(claim_id)
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")

        expected_from, expected_to = TRANSITIONS[actor_role]
        if claim.status != expected_from:
            raise HTTPException(status_code=400, detail=f"Claim must be in '{expected_from}' status")

        if actor_role == UserRole.approver:
            if to_status not in (ClaimStatus.approved, ClaimStatus.rejected):
                raise HTTPException(status_code=400, detail="Must be approved or rejected")
        else:
            to_status = expected_to

        updated = self.repo.transition(claim, to_status, actor_id, note)
        return ClaimOut.model_validate(updated)

    def get_logs(self, claim_id: int) -> list[ClaimLogOut]:
        logs = self.repo.get_logs(claim_id)
        result = []
        for log in logs:
            out = ClaimLogOut.model_validate(log)
            out.actor_name = log.actor.name if log.actor else None
            result.append(out)
        return result
