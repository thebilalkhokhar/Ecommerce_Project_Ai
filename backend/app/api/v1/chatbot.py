from fastapi import APIRouter, Depends
from langchain_core.messages import HumanMessage
from pydantic import BaseModel, Field

from app.api.deps import get_current_user_optional
from app.models.user import User
from app.services.ai import chat_context
from app.services.ai.agent import app_graph

router = APIRouter()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    thread_id: str = Field(..., min_length=1)


@router.post("/chat")
def chat(
    request: ChatRequest,
    current_user: User | None = Depends(get_current_user_optional),
) -> dict[str, str]:
    token = chat_context.chat_authenticated_user_id.set(
        current_user.id if current_user else None,
    )
    try:
        config = {"configurable": {"thread_id": request.thread_id}}
        response = app_graph.invoke(
            {"messages": [HumanMessage(content=request.message)]},
            config,
        )
    finally:
        chat_context.chat_authenticated_user_id.reset(token)

    last = response["messages"][-1]
    content = last.content
    if isinstance(content, str):
        return {"response": content}
    return {"response": str(content)}
