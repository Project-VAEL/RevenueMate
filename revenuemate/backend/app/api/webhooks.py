from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/webhooks/whatsapp")
async def whatsapp_verify(request: Request):
    params = dict(request.query_params)
    if params.get("hub.mode") == "subscribe":
        return int(params.get("hub.challenge", 0))
    return {"status": "ok"}


@router.post("/webhooks/whatsapp")
async def whatsapp_webhook(request: Request):
    return {"status": "received"}
