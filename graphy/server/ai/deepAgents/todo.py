import os
import sys
from pathlib import Path

# Add graphy root (parent of server/) to path before importing server modules
_graphy_root = Path(__file__).parent.parent.parent.parent
if str(_graphy_root) not in sys.path:
    sys.path.insert(0, str(_graphy_root))

# Tools
from server.ai.tools.tools import tools_compiler

# DeepAgents
from langchain.agents import create_agent
from langchain.agents.middleware import TodoListMiddleware

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL")


def analyze_codeflow(target_path: str):
    """Analyze codeflow at the given path and generate a todo list."""
    target_path_obj = Path(target_path).resolve()
    
    if not target_path_obj.exists():
        raise ValueError(f"Path does not exist: {target_path}")
    
    # Create path-bound tools
    tools = tools_compiler(target_path_obj)
    
    # System prompt focused on codeflow analysis
    codeflow_prompt = """You are an expert code analyst. Your task is to analyze the codeflow of the codebase at the given path and create a comprehensive todo list.

Focus on:
1. Entry points and main execution flows
2. Function and method call chains
3. Data flow through the codebase
4. Key architectural patterns and components
5. Dependencies between modules
6. Control flow and decision points

Use the available tools to explore the codebase systematically:
- Use search_code to find relevant functions and classes
- Use search_pattern to find specific code patterns
- Use find_files to locate important files
- Use read_code_file to examine file contents
- Use list_code_directories to understand the structure

Create a detailed todo list using the write_todos tool that breaks down the codeflow analysis into actionable steps."""
    
    # Create agent with TodoListMiddleware
    agent = create_agent(
        model=OPENAI_MODEL,
        tools=tools,
        middleware=[
            TodoListMiddleware(
                system_prompt=codeflow_prompt
            ),
        ],
    )
    
    # User query focused on codeflow
    user_query = f"""Analyze the codeflow of the codebase at {target_path_obj} and create a comprehensive todo list that breaks down:
1. How the code executes from entry points
2. Key function call chains and data flows
3. Architectural patterns and component interactions
4. Dependencies and module relationships
5. Control flow paths and decision points

Use the tools to explore the codebase and create a detailed todo list using write_todos."""
    
    result = agent.invoke({"messages": [{"role": "user", "content": user_query}]})
    return result['messages'][-1].content


def main():
    path = "graphy/server/ai/docs"
    
    result = analyze_codeflow(path)
    print(result)

if __name__ == "__main__":
    main()