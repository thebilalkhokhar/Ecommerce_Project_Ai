"""Request-scoped context for the chatbot (e.g. authenticated user id for tools)."""

from contextvars import ContextVar

chat_authenticated_user_id: ContextVar[int | None] = ContextVar(
    "chat_authenticated_user_id",
    default=None,
)
