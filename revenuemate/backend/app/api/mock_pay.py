from fastapi import APIRouter

router = APIRouter()


@router.post("/mock-pay/{order_ref}/{outcome}")
def mock_pay(order_ref: str, outcome: str):
    return {"order_ref": order_ref, "outcome": outcome, "status": "simulated"}
