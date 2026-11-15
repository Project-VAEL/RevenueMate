from fastapi import APIRouter

router = APIRouter()


@router.get("/events")
def list_events(lead_id: str | None = None, order_id: str | None = None):
    return []
