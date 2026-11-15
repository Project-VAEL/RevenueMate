# AI-layer schema re-exports — Task 0
# Do NOT import from message.py or common.py (P1-owned files)
from .conversation import HardConstraints, SoftPreferences, BuyerCriteria, ConversationContext
from .recommendation import SourceEvidence, CandidateProduct, RecommendationResult, ConversationReply
from .product_knowledge import ProductFact, ProductVariant, ComponentFact

__all__ = [
    # conversation
    "HardConstraints",
    "SoftPreferences",
    "BuyerCriteria",
    "ConversationContext",
    # recommendation
    "SourceEvidence",
    "CandidateProduct",
    "RecommendationResult",
    "ConversationReply",
    # product_knowledge
    "ProductFact",
    "ProductVariant",
    "ComponentFact",
]
