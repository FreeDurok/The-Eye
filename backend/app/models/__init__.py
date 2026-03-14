# Import all models so that Base.metadata is fully populated for Alembic
from app.models.api_key import ApiKeyAudit  # noqa: F401
from app.models.case import Case  # noqa: F401
from app.models.export_profile import ExportProfile  # noqa: F401
from app.models.query import QueryRecord, QueryResult  # noqa: F401
