from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langchain_core.runnables.graph import NodeStyles

class CaseState(TypedDict, total=False):
    case_id: str; user: dict; proposed: dict; decision: str; fresh: bool

def stub(s): return {}
plan = gate = approval = revalidate = execute = escalate = stub

g = StateGraph(CaseState)
for name, fn in [("plan", plan), ("gate", gate), ("approval", approval),
                 ("revalidate", revalidate), ("execute", execute), ("escalate", escalate)]:
    g.add_node(name, fn)
g.add_edge(START, "plan"); g.add_edge("plan", "gate")
g.add_conditional_edges("gate", lambda s: s["decision"],
    {"allow": "execute", "approve": "approval", "deny": END, "unhandled": "escalate"})
g.add_conditional_edges("approval", lambda s: s["decision"], {"allow": "revalidate", "deny": END})
g.add_conditional_edges("revalidate", lambda s: "fresh" if s["fresh"] else "stale", {"fresh": "execute", "stale": "plan"})
g.add_edge("execute", END); g.add_edge("escalate", END)
graph = g.compile()

print(graph.get_graph().draw_mermaid(
    node_colors=NodeStyles(default="fill:#faf9f5,stroke:#cfcabb,color:#141413",
                           first="fill:#f0eee6,stroke:#cfcabb,color:#6f6b5e",
                           last="fill:#f0eee6,stroke:#cfcabb,color:#6f6b5e")))
