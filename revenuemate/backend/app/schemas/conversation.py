# Requires: pydantic>=2
from pydantic import BaseModel, Field


class HardConstraints(BaseModel):
    os: str | None = None
    min_ram_gb: int | None = None
    min_storage_gb: int | None = None
    discrete_gpu_required: bool = False
    max_weight_kg: float | None = None
    required_ports: list[str] = Field(default_factory=list)


class SoftPreferences(BaseModel):
    battery: str | None = None
    weight: str | None = None
    display: str | None = None
    keyboard: str | None = None
    portability: str | None = None


class BuyerCriteria(BaseModel):
    intent: str = "product_discovery"
    budget_max_paise: int | None = None   # ₹60,000 = 6_000_000; None if not stated
    workloads: list[str] = Field(default_factory=list)
    hard_constraints: HardConstraints = Field(default_factory=HardConstraints)
    soft_preferences: SoftPreferences = Field(default_factory=SoftPreferences)
    confirmed_fields: list[str] = Field(default_factory=list)
    missing_critical_fields: list[str] = Field(default_factory=list)
    needs_clarification: bool = False
    clarifying_question: str | None = None
    confidence: float = 0.0


class ConversationContext(BaseModel):
    conversation_id: str
    tenant_id: str
    stage: str = "discovery"   # discovery|comparison|selected|reservation-requested
    buyer_criteria: BuyerCriteria | None = None
    discussed_product_ids: list[str] = Field(default_factory=list)
    pending_clarification: str | None = None
    turn_count: int = 0
    history: list[dict] = Field(default_factory=list)   # list of {role, content} dicts
