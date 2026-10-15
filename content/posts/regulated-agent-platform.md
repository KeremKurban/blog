---
title: "Building an AI agent a bank can audit: from laptop toy to regulated platform"
date: 2026-10-15
summary: "A staged plan for putting an agent into regulated finance: a toy reconciliation agent on a laptop, a read-only shadow pilot, human-in-the-loop production, and finally a platform that produces its own SOC 2, ISO 27001 and EU AI Act evidence."
tags: [Agentic AI, LangGraph, Compliance, Architecture]
---

## TL;DR

This is a staged plan for building an AI agent that can work safely inside a regulated bank. You start with a toy reconciliation agent on a laptop, prove it on real data in read-only shadow mode, move it to production with human approvals, and finally scale it into a platform clients can audit.

Every stage keeps the same six layers: identity, a fixed LangGraph workflow, tools, a policy gateway, an immutable audit trail, and a loop that turns failures into the next feature. Only the implementation behind each layer grows up.

## Introduction

**Where this comes from.** I have spent time automating financial reconciliation for a large bank. The hard parts were rarely the model. They were access rights, audit expectations, procedures that only existed in analysts' heads, and software that could only be operated by clicking. Around the same time I was comparing two kinds of companies in this space: those that build agents for regulated industries, and those that test, monitor and govern other people's agents. This post is my answer to one question that comparison raised: what would a vendor that fully meets the main compliance standards actually build?

**The problem.** A bank will not let an agent touch financial data unless every action is authorized, logged, reviewable and reproducible. Pilots also die for practical reasons:

- Procedures (SOPs) live in analysts' heads, not in a form an agent can use.
- Legacy software often has no API; people just click through it.
- Sponsors have small budgets and need a visible win within weeks, not months.

**The three standards, in one line each.**

| Standard | What it is | What it proves |
| --- | --- | --- |
| SOC 2 Type 2 | US audit by an accounting firm over a 3 to 12 month window | Security controls actually worked over time. A new company cannot have it on day one. |
| ISO 27001 | International certification by an accredited body | The company runs a proper information security management system. |
| EU AI Act | EU law that classifies AI systems by risk level | High-risk uses meet binding duties on human oversight, logging, robustness and documentation. |

**Running example.** Bank reconciliation: matching ledger entries against bank statement lines. It is rule-heavy, easy to audit, and safe to start with, which makes it a typical first pilot.

**How to read this.** The Overview gives the six layers and the roadmap. Stages 0 to 3 are build steps, each ending with a "done when" gate. The last sections cover how edge cases become features and how each component maps to the three standards. Unfamiliar terms are in the Glossary at the end.

## Overview

The same six layers exist from day one; each stage swaps a toy implementation for a production one without changing the interfaces between them.

![Roadmap of four stages, each separated by a gate](/posts/regulated-agent-platform/roadmap.svg)

You only move to the next stage once its gate is met, so a stalled pilot fails cheaply in Stage 1 rather than after a production build.

Three design rules hold at every stage:

- **The graph is code, not runtime state.** The agent chooses which existing edge to take; it never adds nodes or edges. New capability is a reviewed, versioned deploy.
- **The compliance decision is deterministic.** LLMs may plan and classify, but the allow, approve or deny decision is a rule lookup you can replay and explain to an auditor.
- **Not knowing is a valid outcome.** A case with no confident path exits to a human with a structured fingerprint, never a crash or a guess.

| Layer | Job | Toy (Stage 0) | Production (Stage 3) |
| --- | --- | --- | --- |
| Identity | Who is asking, with which role | Hardcoded user dict | Entra ID SSO, OIDC tokens, on-behalf-of calls |
| Orchestration | Fixed graph, one instance per case | LangGraph + SQLite checkpointer | LangGraph on Postgres checkpointer, or Temporal for long waits |
| Tools | The only way the agent touches systems | Python functions over SQLite and CSV | Typed tool services over APIs, RPA bridges where no API exists |
| Policy gateway | Allow, require approval, or deny each tool call | Python rules table | Open Policy Agent (Rego) as a service, rules in git |
| Audit trail | Immutable record of every decision | Hash-chained JSONL or SQLite table | Append-only Delta table in the client workspace under Unity Catalog |
| Learning loop | Turn failures into roadmap | A list of fingerprint records | Embedding clustering, ranked backlog, replay harness |

MLflow 3 tracing sits across all layers as the observability spine: every run is a trace, every tool call a span, tagged with case ID and graph version.

## Stage 0: Toy system on your laptop

Goal: prove all six layers work end to end on fake data, in about a week, with nothing but Python and local files.

**Scope.** Two CSVs (ledger, bank statement), one SQLite database as the system of record, and one task: match entries and mark matched pairs as reconciled.

**Stack.** Python, LangGraph, `langgraph-checkpoint-sqlite`, Azure OpenAI or a local model through Ollama, MLflow 3 with `mlflow.langchain.autolog()` for traces, Streamlit or a CLI for approvals, FastAPI for a fake legacy app.

**Tools, each tagged with an action type and data sensitivity:**

| Tool | Action | Sensitivity | Policy |
| --- | --- | --- | --- |
| `read_ledger` | read | internal | allow |
| `match_entries` | compute | internal | allow |
| `mark_reconciled` | write | financial_write | require approval |
| `update_counterparty` | write | pii_write | deny |
| `lookup_legacy_ui` | read via Playwright | internal | allow |

**Graph skeleton.** The topology is fixed in code; the LLM only fills `proposed` from an allow-listed tool menu.

```python
from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.types import interrupt, Command
from langgraph.checkpoint.sqlite import SqliteSaver
import sqlite3, json, hashlib, time

POLICY = {("read_ledger", "internal"): "allow",
          ("match_entries", "internal"): "allow",
          ("mark_reconciled", "financial_write"): "approve"}
ROLES = {"analyst": {"read_ledger", "match_entries", "mark_reconciled"}}

class CaseState(TypedDict, total=False):
    case_id: str; user: dict; proposed: dict; decision: str; fresh: bool

def audit(event, path="audit.jsonl"):
    try: prev = open(path).read().splitlines()[-1]
    except (FileNotFoundError, IndexError): prev = "genesis"
    event = {**event, "ts": time.time(), "prev": hashlib.sha256(prev.encode()).hexdigest()}
    with open(path, "a") as f: f.write(json.dumps(event, sort_keys=True) + "\n")

def gate(s):
    p = s.get("proposed")
    if not p: decision = "unhandled"
    elif p["tool"] not in ROLES.get(s["user"]["role"], set()): decision = "deny"
    else: decision = POLICY.get((p["tool"], p["sensitivity"]), "deny")  # deny by default
    audit({"case": s["case_id"], "user": s["user"]["id"], "proposed": p, "decision": decision})
    return {"decision": decision}

def approval(s):
    answer = interrupt({"case": s["case_id"], "proposed": s["proposed"]})  # pauses this case only
    audit({"case": s["case_id"], "approver": answer["approver"], "approved": answer["approved"]})
    return {"decision": "allow" if answer["approved"] else "deny"}

g = StateGraph(CaseState)
for name, fn in [("plan", plan), ("gate", gate), ("approval", approval),
                 ("revalidate", revalidate), ("execute", execute), ("escalate", escalate)]:
    g.add_node(name, fn)
g.add_edge(START, "plan"); g.add_edge("plan", "gate")
g.add_conditional_edges("gate", lambda s: s["decision"],
    {"allow": "execute", "approve": "approval", "deny": END, "unhandled": "escalate"})
g.add_conditional_edges("approval", lambda s: s["decision"], {"allow": "revalidate", "deny": END})
g.add_conditional_edges("revalidate", lambda s: "execute" if s["fresh"] else "plan")
g.add_edge("execute", END); g.add_edge("escalate", END)
graph = g.compile(checkpointer=SqliteSaver(sqlite3.connect("ckpt.db", check_same_thread=False)))

cfg = {"configurable": {"thread_id": "case-0042"}}   # one thread per case = isolation
graph.invoke({"case_id": "case-0042", "user": {"id": "kerem", "role": "analyst"}}, cfg)
# hours later, from the approval UI:
graph.invoke(Command(resume={"approved": True, "approver": "maria"}), cfg)
```

You write `plan`, `revalidate`, `execute` and `escalate`. `revalidate` re-reads the record and compares its version to the one seen at planning time; stale means loop back to `plan` instead of firing an old decision.

**Four demo cases to script:**

1. Read and match: passes the gate instantly, logged, done.
2. Mark reconciled: pauses at `approval`, other cases keep running, resumes after sign-off.
3. Update counterparty: denied by default, logged with the reason.
4. Currency mismatch with no conversion tool: `plan` returns nothing, `escalate` writes a fingerprint record.

**Done when:** the audit file replays every decision, a paused case survives a process restart, and MLflow shows one trace per case tagged with the graph version.

## Stage 1: Shadow mode pilot

Goal: run the agent on real historical cases, read-only, and show a sponsor an agreement dashboard within 2 to 4 weeks. The agent proposes; it never executes.

**1. Capture the tribal SOP before building anything.**

- Screen-record 50 to 100 real cases with consent, then have the analyst narrate the ambiguous ones.
- Ask in their language: "What do you look at first? What makes you flag this one?" Never ask finance users for prompts or context documents.
- You translate their answers into a decision table: condition, action, exception, owner. That table becomes the system prompt, the tool menu and the golden test set.
- Show them the agent's reasoning on real cases early. Correcting a wrong answer is easy for them; writing rules from scratch is not.

**2. Bridge missing data access with RPA, behind a tool interface.**

- Check first: browser tab or native window? Web app means Playwright in Python; native desktop means Power Automate Desktop or UiPath.
- Automate the smallest slice: log in, search one reference, read the result.
- Wrap it as a normal tool, `lookup_transaction(ref)`, so the agent never knows a UI sits underneath.
- Route it through the same gateway and audit log as any API. Log timeouts and missing elements as distinct failure types.
- Label it technical debt in writing, with a plan to swap in a real API.

**3. Harden policy and audit.**

- Move rules from a Python dict to Open Policy Agent (Rego) files in git, with unit tests per rule.
- Move the audit log to a Delta table in the client's Databricks workspace with `delta.appendOnly = true`, governed by Unity Catalog, so it never leaves their perimeter.
- Stamp every record with graph version, policy version and model version.

**4. Measure and sell the result.**

- Replay each historical case and compare the agent's proposal to what the human actually did.
- Report agreement per case category, not one global number. Categories above your threshold are candidates for Stage 2 autonomy.
- Use MLflow 3 evaluation with LLM judges for reasoning quality only. The compliance gate itself never uses an LLM.
- Deliverable for the sponsor: a dashboard of N real cases, agent versus human, with every disagreement explained. It costs little and is screenshot-ready for their supervisor.

**Done when:** agreement is measured per category on at least a few hundred cases, and the sponsor approves a scoped paid pilot.

## Stage 2: Human-in-the-loop production

Goal: the agent executes low-risk, well-covered categories on its own and routes everything else to a named human, with one linked audit trail per case.

![Request path: authenticate, plan, policy gateway, then allow, approve, deny or escalate](/posts/regulated-agent-platform/request-path.svg)

**Request path, per tool call:**

1. **Authenticate** through the client's Entra ID. The session token carries user ID, roles and scope; no separate user database.
2. **Plan** in LangGraph. One graph instance per case, `thread_id = case_id`.
3. **Gate** every tool call, not just the first: the orchestrator calls the OPA service with action type, data sensitivity and the user's live roles. Deny by default.
4. **Allow** executes immediately, using the user's identity on-behalf-of where the target system supports it. The audit write is asynchronous so it never slows the work.
5. **Require approval** writes a row to an approval queue (proposed action, agent reasoning, context snapshot hash, assigned approver role) and pauses that case only.
6. **Approve or reject** happens in a review UI (React works well). The approver's identity and timestamp append to the same audit chain. Four-eyes rules apply where the policy says so.
7. **Revalidate on resume.** If the context hash changed while waiting, the case loops back to the requester with a clarifying question instead of executing a stale plan.

**Concurrency and memory isolation.**

- One shared, versioned graph definition; many isolated runtime instances. A paused case never blocks the other 999.
- Working memory is scoped to the thread and keyed by case ID. No memory is shared across cases, so case A's data cannot influence case B.
- Source data is fetched fresh per step and never copied into long-term agent memory. Only derived reasoning state is checkpointed.
- Checkpointer moves to Postgres. If approvals routinely wait days or need timers and retries, run the case as a Temporal workflow with LangGraph inside it.

**Gradual autonomy.** Each category starts in approve-everything mode. It moves to auto-execute only when its measured agreement from Stage 1 and live approvals stays above an agreed threshold, and that promotion is itself a versioned policy change.

**Done when:** one category runs autonomously in production, every action is traceable from request to approver, and the unhandled queue feeds the learning loop.

## Stage 3: Full regulated platform

Goal: one product you can deploy into any regulated client, on their infrastructure, with compliance evidence produced as a side effect of normal operation.

**Hybrid deployment.**

- Ship the whole stack (orchestrator, gateway, tool services, approval UI, vector store) as signed container images and Helm charts.
- Run single-tenant inside the client's Azure tenant on AKS, or in their data center. Their data, logs and audit tables stay in their perimeter.
- A model gateway makes the LLM swappable: Azure OpenAI for clients already in that boundary, open-weight models on vLLM for clients that cannot send data out.

**Graph governance.**

- Topology lives in git. Adding a node or edge is a pull request with code review, a new version number and a changelog entry.
- Before promotion, the new version replays a set of historical cases in staging and must not regress any category.
- Every audit record carries graph, policy, prompt and model versions, so any past decision can be reproduced.

**Security and red teaming.**

- Treat tool outputs (emails, PDFs, UI text read by RPA) as untrusted input. Prompt injection there must never change the tool menu or bypass the gateway.
- Run adversarial test suites per release and continuously in production, re-run when the model, data or threats change. AI governance and red-teaming tools are a product category of their own, so this is a real build-or-buy decision.
- Secrets in Key Vault, managed identities for services, no standing human access to production data.

**Operations.** MLflow 3 traces plus metrics on latency, cost per case, approval wait time, escalation rate and agreement per category, with alerts on drift.

## Edge-case capture loop

"Self-healing" here means the system knows what it does not know and turns that into a ranked backlog; a human-reviewed deploy does the healing.

**Fingerprint every unhandled case at the moment it fails**, so different root causes do not collapse into one generic state:

| Field | Example |
| --- | --- |
| Last node reached | `plan` after `match_entries` |
| Missing precondition | no FX rate for CHF to EUR |
| Tool or data expected | `convert_currency` (not in menu) |
| Plan depth reached | step 3 of 5 |
| Short reasoning trace | "amounts differ by 0.93 ratio, likely currency" |
| Versions | graph v12, policy v7, model id |

**Then, in order:**

1. **Stage 0:** append fingerprints to a list and read them by hand.
2. **Stage 1 to 2:** cluster weekly by embedding the fingerprint text and grouping (for example HDBSCAN), plus exact grouping on the structured fields. Two cases ending in the same state but needing node A versus node B separate on "missing precondition" and "tool expected".
3. Rank clusters by frequency times business impact. The top cluster becomes the next PR: a new node, edge or tool.
4. Replay the cluster's cases against the new graph version in staging before promotion.
5. Track escalation rate per category. A falling rate is your evidence of progress for the sponsor and the auditor.

## Compliance mapping

Each control is a by-product of a component above, so evidence accumulates automatically instead of being assembled before an audit.

| Component | SOC 2 Type 2 | ISO 27001 | EU AI Act (high-risk) |
| --- | --- | --- | --- |
| Entra ID, roles, on-behalf-of | Logical access controls | Access control (Annex A) | Human oversight by named, authorized people (Art. 14) |
| Policy gateway in OPA, rules in git | Change management, authorization | Secure development, change control | Risk management system (Art. 9) |
| Append-only audit table | Monitoring evidence over the 3 to 12 month window | Logging and monitoring | Record-keeping and automatic logs (Art. 12) |
| Approval queue and revalidation | Processing integrity | Operational controls | Human oversight, ability to intervene (Art. 14) |
| Graph and model versioning, replay harness | Change management | Configuration management | Technical documentation (Art. 11), accuracy and robustness (Art. 15) |
| Decision table from SOP capture, golden set | Processing integrity | Documented procedures | Data governance (Art. 10), transparency to users (Art. 13) |
| Red teaming, injection tests | Risk assessment, vulnerability management | Threat and vulnerability management | Cybersecurity (Art. 15) |

Two caveats:

- Internal reconciliation is probably not a high-risk use under the EU AI Act; credit scoring of individuals is. Classify per use case, but build to high-risk standards so expanding scope does not force a redesign.
- Enforcement dates for high-risk obligations have been under revision. Check the current timeline before quoting one.

## Glossary

| Term | Meaning here |
| --- | --- |
| Agent | An LLM that plans steps and calls tools to finish a task |
| LangGraph | Python framework where an agent's workflow is a fixed graph of nodes and edges |
| Checkpointer | LangGraph storage that saves each case's state so it can pause and resume |
| Interrupt | LangGraph call that pauses one case until a human answers |
| Policy gateway | Service that decides allow, require approval or deny for every tool call |
| OPA | Open Policy Agent, a rules engine whose rules (in Rego) are deterministic and versioned in git |
| Audit trail | Append-only record of every decision; rows can be added, never edited |
| Shadow mode | Agent proposes decisions on real cases but never executes; compared against humans |
| RPA | Robotic process automation: scripts that drive a legacy UI when no API exists |
| Fingerprint | Structured record of why a case had no path, used to cluster failures |
| Temporal | Workflow engine for processes that wait hours or days, with retries and timers |
| Unity Catalog | Databricks governance layer for access control and data lineage |
