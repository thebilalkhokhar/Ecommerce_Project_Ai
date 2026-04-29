from typing import Annotated, Literal

from langchain_core.messages import AIMessage, AnyMessage, BaseMessage
from langchain_groq import ChatGroq
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from typing_extensions import TypedDict

from app.agents.tools import search_store_inventory
from app.core.config import settings

tools = [search_store_inventory]

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    api_key=settings.GROQ_API_KEY,
)
llm_with_tools = llm.bind_tools(tools)
tool_node = ToolNode(tools=tools)


class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]


def chatbot_node(state: AgentState) -> dict[str, list[BaseMessage]]:
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}


def route_after_chatbot(state: AgentState) -> Literal["tools", "__end__"]:
    last = state["messages"][-1]
    if isinstance(last, AIMessage) and last.tool_calls:
        return "tools"
    return "__end__"


graph = StateGraph(AgentState)
graph.add_node("chatbot", chatbot_node)
graph.add_node("tools", tool_node)

graph.add_edge(START, "chatbot")
graph.add_conditional_edges(
    "chatbot",
    route_after_chatbot,
    {"tools": "tools", "__end__": END},
)
graph.add_edge("tools", "chatbot")

memory = MemorySaver()
app_graph = graph.compile(checkpointer=memory)
