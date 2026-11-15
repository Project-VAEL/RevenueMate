# Requires: pydantic>=2
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class ProductFact(BaseModel):
    fact_path: str
    value: Any | None
    verification_status: str   # verified|component_reference|family_only|unknown
    source_ids: list[str] = Field(default_factory=list)


class ProductVariant(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    product_id: str
    family_id: str
    brand: str
    product_name: str
    model_code: str | None = None
    manufacturer_sku: str | None = None
    variant_precision: str
    region: str
    configuration_status: str
    source_ids: list[str] = Field(default_factory=list)
    segment_tags: list[str] = Field(default_factory=list)
    facts: dict
    unknown_fields: list[str] = Field(default_factory=list)
    recommendation_eligible: bool
    eligibility_reason: str | None = None


class ComponentFact(BaseModel):
    component_id: str
    component_type: str
    component_name: str
    facts: dict
    source_ids: list[str] = Field(default_factory=list)
