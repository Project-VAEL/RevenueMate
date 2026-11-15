# Requires: pydantic>=2
from pydantic import BaseModel, ConfigDict, Field


class SourceEvidence(BaseModel):
    source_id: str
    publisher: str | None = None
    url: str | None = None
    retrieved_on: str | None = None
    scope: str | None = None


class CandidateProduct(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    product_id: str
    brand: str
    product_name: str
    model_code: str
    facts: dict
    unknown_fields: list[str] = Field(default_factory=list)
    source_ids: list[str] = Field(default_factory=list)
    evidence: list[SourceEvidence] = Field(default_factory=list)
    recommendation_eligible: bool
    fit_reasons: list[str] = Field(default_factory=list)
    trade_offs: list[str] = Field(default_factory=list)


class RecommendationResult(BaseModel):
    candidates: list[CandidateProduct] = Field(default_factory=list)
    merchant_offer_status: str = "not_checked"
    # Values: active|not_listed|not_confirmed|simulated|not_checked
    transaction_allowed: bool = False
    reference_only: bool = True
    warnings: list[str] = Field(default_factory=list)


class ConversationReply(BaseModel):
    reply_text: str
    intent: str = "product_discovery"
    needs_clarification: bool = False
    follow_up_question: str | None = None
    candidates: list[CandidateProduct] = Field(default_factory=list)
    candidate_ids: list[str] = Field(default_factory=list)
    evidence_ids: list[str] = Field(default_factory=list)
    evidence: list[SourceEvidence] = Field(default_factory=list)
    merchant_offer_status: str = "not_checked"
    transaction_allowed: bool = False
    recommended_action: str = "show_comparison"
    # Values: ask_clarification|show_comparison|request_merchant_approval|offer_reservation
    warnings: list[str] = Field(default_factory=list)
