from fastapi import APIRouter
from langchain_core.messages import HumanMessage
from pydantic import BaseModel, Field

from app.agents.graph import app_graph

router = APIRouter()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    thread_id: str = Field(..., min_length=1)


@router.post("/chat")
def chat(request: ChatRequest) -> dict[str, str]:
    config = {"configurable": {"thread_id": request.thread_id}}
    response = app_graph.invoke(
        {"messages": [HumanMessage(content=request.message)]},
        config,
    )
    last = response["messages"][-1]
    content = last.content
    if isinstance(content, str):
        return {"response": content}
    return {"response": str(content)}
