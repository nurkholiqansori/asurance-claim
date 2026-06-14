from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.claim import ClaimStatus
from app.services.claim_service import ClaimService
from app.schemas.claim import ClaimCreate, ClaimOut, ClaimTransition, ClaimLogOut

router = APIRouter(prefix="/api/claims", tags=["Claims"])

@router.post("", response_model=ClaimOut, status_code=201)
def create_claim(data: ClaimCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(UserRole.user))):
    return ClaimService(db).create(current_user.id, data)

@router.get("/my", response_model=list[ClaimOut])
def my_claims(db: Session = Depends(get_db), current_user: User = Depends(require_role(UserRole.user))):
    return ClaimService(db).list_by_user(current_user.id)

@router.get("/submitted", response_model=list[ClaimOut])
def submitted_claims(db: Session = Depends(get_db), current_user: User = Depends(require_role(UserRole.verifier))):
    return ClaimService(db).list_by_status(ClaimStatus.submitted)

@router.get("/reviewed", response_model=list[ClaimOut])
def reviewed_claims(db: Session = Depends(get_db), current_user: User = Depends(require_role(UserRole.approver))):
    return ClaimService(db).list_by_status(ClaimStatus.reviewed)

@router.post("/{claim_id}/submit", response_model=ClaimOut)
def submit_claim(claim_id: int, body: ClaimTransition = ClaimTransition(), db: Session = Depends(get_db), current_user: User = Depends(require_role(UserRole.user))):
    return ClaimService(db).transition(claim_id, current_user.id, UserRole.user, ClaimStatus.submitted, body.note)

@router.post("/{claim_id}/review", response_model=ClaimOut)
def review_claim(claim_id: int, body: ClaimTransition = ClaimTransition(), db: Session = Depends(get_db), current_user: User = Depends(require_role(UserRole.verifier))):
    return ClaimService(db).transition(claim_id, current_user.id, UserRole.verifier, ClaimStatus.reviewed, body.note)

@router.post("/{claim_id}/approve", response_model=ClaimOut)
def approve_claim(claim_id: int, body: ClaimTransition = ClaimTransition(), db: Session = Depends(get_db), current_user: User = Depends(require_role(UserRole.approver))):
    return ClaimService(db).transition(claim_id, current_user.id, UserRole.approver, ClaimStatus.approved, body.note)

@router.post("/{claim_id}/reject", response_model=ClaimOut)
def reject_claim(claim_id: int, body: ClaimTransition = ClaimTransition(), db: Session = Depends(get_db), current_user: User = Depends(require_role(UserRole.approver))):
    return ClaimService(db).transition(claim_id, current_user.id, UserRole.approver, ClaimStatus.rejected, body.note)

@router.get("/{claim_id}/logs", response_model=list[ClaimLogOut])
def claim_logs(claim_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ClaimService(db).get_logs(claim_id)
