from typing import Annotated, Literal

from langchain_core.messages import AIMessage, AnyMessage, BaseMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from typing_extensions import TypedDict

from app.core.config import settings
from app.services.ai.tools import check_order_status, search_store_inventory

SYSTEM_PROMPT = """You are the official AI Shopping Assistant for our e-commerce store. Be polite, helpful, and concise.

STORE POLICIES:

Shipping: Delivery usually takes 3-5 business days.

Payment: We strictly support Cash on Delivery (CoD).

Returns: We offer a 7-day return policy for unused items in original packaging.

YOUR CAPABILITIES:

Use the 'search_store_inventory' tool to find products.

Use the 'check_order_status' tool if a customer asks about their specific order number.

IMPORTANT: Only answer questions related to shopping, products, and store policies. If asked about coding, general knowledge, or unrelated topics, politely decline."""

tools = [search_store_inventory, check_order_status]

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
    messages_for_model: list[BaseMessage] = [
        SystemMessage(content=SYSTEM_PROMPT),
        *state["messages"],
    ]
    response = llm_with_tools.invoke(messages_for_model)
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
