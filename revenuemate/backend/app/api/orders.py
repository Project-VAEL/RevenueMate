from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/orders")
def list_orders():
    return []


@router.get("/orders/{order_id}")
def get_order(order_id: str):
    raise HTTPException(status_code=404, detail="Order not found")


@router.post("/orders", status_code=201)
def create_order(body: dict):
    raise HTTPException(status_code=501, detail="Order creation not yet implemented")


@router.post("/orders/{order_id}/request-reservation")
def request_reservation(order_id: str):
    raise HTTPException(status_code=404, detail="Order not found")


@router.post("/orders/{order_id}/approve-reservation")
def approve_reservation(order_id: str):
    raise HTTPException(status_code=404, detail="Order not found")


@router.post("/orders/{order_id}/reject-reservation")
def reject_reservation(order_id: str):
    raise HTTPException(status_code=404, detail="Order not found")


@router.post("/orders/{order_id}/payment-link")
def create_payment_link(order_id: str, body: dict = {}):
    raise HTTPException(status_code=404, detail="Order not found")
