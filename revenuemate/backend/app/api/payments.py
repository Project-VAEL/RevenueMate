from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/payments/{payment_id}")
def get_payment(payment_id: str):
    raise HTTPException(status_code=404, detail="Payment not found")


@router.post("/payments/{payment_id}/verify")
def verify_payment(payment_id: str):
    raise HTTPException(status_code=404, detail="Payment not found")
