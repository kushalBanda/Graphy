import os
from typing import Literal
from deepagents import create_deep_agent
from langchain.agents import create_agent
from langchain.agents.middleware import TodoListMiddleware
from langchain.chat_models import init_chat_model

from dotenv import load_dotenv
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

deep_agent = create_deep_agent()

# TodoListMiddleware is included by default in create_deep_agent
# You can customize it if building a custom agent
agent = create_agent(
    model="gpt-4o-mini",
    # Custom planning instructions can be added via middleware
    middleware=[
        TodoListMiddleware(
            system_prompt="Use the write_todos list for what user asks" 
        ),
    ],
)


result = agent.invoke({"messages": [{"role": "user", "content": "I have to built a chatbot, what all should I do?"}]})
print(result['messages'][-1].content)