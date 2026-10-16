---
title: "Building an AI agent a bank can audit: from laptop toy to regulated platform"
date: 2026-10-15
updated: 2026-10-16
summary: "A staged plan for putting an agent into regulated finance: a toy reconciliation agent on a laptop, a read-only shadow pilot, human-in-the-loop production, and finally a platform that produces its own SOC 2, ISO 27001 and EU AI Act evidence."
tags: [Agentic AI, LangGraph, Compliance, Architecture]
---

## TL;DR

This is a staged plan for building an AI agent that can work safely inside a regulated bank. You start with a toy reconciliation agent on a laptop, prove it on real data in read-only shadow mode, move it to production with human approvals, and finally scale it into a platform clients can audit.

Every stage keeps the same six layers: identity, a fixed LangGraph workflow, tools, a policy gateway, an immutable audit trail, and a loop that turns failures into the next feature. Only the implementation behind each layer grows up.

## Introduction

**Where this comes from.** I have spent time automating financial reconciliation for a large bank. The hard parts were rarely the model. They were access rights, audit expectations, procedures that only existed in analysts' heads, and software that could only be operated by clicking. Around the same time I was comparing two kinds of companies in this space: those that build agents for regulated industries, and those that test, monitor and govern other people's agents. This post is my answer to one question that comparison raised: what would a vendor that fully meets the main compliance standards actually build?

**The problem.** A bank will not let an agent touch financial data unless every action is authorized, logged, reviewable and reproducible. Pilots also die for practical reasons:

- Standard operating procedures (SOPs) live in analysts' heads, not in a form an agent can use.
- Legacy software often has no API; people just click through it.
- Sponsors have small budgets and need a visible win within weeks, not months.

**The three standards, in one line each.**

| Standard | What it is | What it proves |
| --- | --- | --- |
| [SOC 2 Type 2](https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2) | US audit by an accounting firm over a 3 to 12 month window | Security controls actually worked over time. A new company cannot have it on day one. |
| [ISO/IEC 27001](https://www.iso.org/standard/27001) | International certification by an accredited body | The company runs a proper information security management system. |
| [EU AI Act](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) | EU law (Regulation 2024/1689) that classifies AI systems by risk level | High-risk uses meet binding duties on human oversight, logging, robustness and documentation. |

**Running example.** Bank reconciliation: matching ledger entries against bank statement lines. It is rule-heavy, easy to audit, and safe to start with, which makes it a typical first pilot.

**How to read this.** The Overview gives the six layers and the roadmap. Stages 0 to 3 are build steps, each ending with a "done when" gate. The last sections cover how edge cases become features and how each component maps to the three standards. Every product and term is explained where it first appears, and the Glossary at the end collects them all with links.

## Overview

The same six layers exist from day one; each stage swaps a toy implementation for a production one without changing the interfaces between them.

![Roadmap of four stages, each separated by a gate](/posts/regulated-agent-platform/roadmap.svg)

You only move to the next stage once its gate is met, so a stalled pilot fails cheaply in Stage 1 rather than after a production build.

The agent's workflow is built with [LangGraph](https://docs.langchain.com/oss/python/langgraph/overview), an open-source Python library from the LangChain team. In LangGraph you describe a workflow as a graph: each step is a *node* (a Python function), and *edges* say which node runs next, either always or depending on the current state. That structure is what makes the first design rule below possible.

Three design rules hold at every stage:

- **The graph is code, not runtime state.** The agent chooses which existing edge to take; it never adds nodes or edges. New capability is a reviewed, versioned deploy.
- **The compliance decision is deterministic.** LLMs may plan and classify, but the allow, approve or deny decision is a rule lookup you can replay and explain to an auditor.
- **Not knowing is a valid outcome.** A case with no confident path exits to a human with a structured fingerprint, never a crash or a guess.

| Layer | Job | Toy (Stage 0) | Production (Stage 3) |
| --- | --- | --- | --- |
| Identity | Who is asking, with which role | Hardcoded user dict | Microsoft Entra ID single sign-on, OIDC tokens, on-behalf-of calls |
| Orchestration | Fixed graph, one instance per case | LangGraph + SQLite checkpointer | LangGraph on a PostgreSQL checkpointer, or Temporal for long waits |
| Tools | The only way the agent touches systems | Python functions over SQLite and CSV | Typed tool services over APIs, RPA bridges where no API exists |
| Policy gateway | Allow, require approval, or deny each tool call | Python rules table | Open Policy Agent (OPA) as a service, rules in git |
| Audit trail | Immutable record of every decision | Hash-chained JSONL file | Append-only Delta table in the client's Databricks workspace, governed by Unity Catalog |
| Learning loop | Turn failures into roadmap | A list of fingerprint records | Embedding clustering, ranked backlog, replay harness |

Each production technology in this table is introduced, with a link, in the stage where it first becomes necessary.

Across all layers sits [MLflow 3 tracing](https://mlflow.org/docs/latest/genai/tracing/). MLflow is an open-source platform for tracking machine learning work; its tracing feature records every agent run as a *trace* and every step or tool call inside it as a *span*. Tagging each trace with the case ID and graph version makes any decision easy to find and replay later.

## Stage 0: Toy system on your laptop

Goal: prove all six layers work end to end on fake data, in about a week, with nothing but Python and local files.

**Scope.** Two CSVs (ledger, bank statement), one [SQLite](https://sqlite.org/) database (a single-file database built into Python) as the system of record, and one task: match entries and mark matched pairs as reconciled.

**Stack.**

- **Python and LangGraph**, with the `langgraph-checkpoint-sqlite` package. A *checkpointer* saves each case's state after every step, so a case can pause for hours and resume exactly where it stopped.
- **A model.** Either [Azure OpenAI](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/overview), which serves OpenAI models from inside Microsoft Azure so data stays in your Azure account, or a local open-weight model run with [Ollama](https://ollama.com/), which needs no cloud at all.
- **MLflow 3** with `mlflow.langchain.autolog()`, one line that turns on tracing for every LangGraph step.
- **[Streamlit](https://streamlit.io/)** (a Python library for quick web interfaces) or a plain command line for the approval screen.
- **[FastAPI](https://fastapi.tiangolo.com/)** (a Python web framework) to fake a legacy system the agent has to query.

**Tools, each tagged with an action type and data sensitivity:**

| Tool | Action | Sensitivity | Policy |
| --- | --- | --- | --- |
| `read_ledger` | read | internal | allow |
| `match_entries` | compute | internal | allow |
| `mark_reconciled` | write | financial_write | require approval |
| `update_counterparty` | write | pii_write | deny |
| `lookup_legacy_ui` | read via Playwright | internal | allow |

**Graph skeleton.** The topology is fixed in code; the LLM only fills `proposed` from an allow-listed tool menu. Three pieces of LangGraph do the heavy lifting here:

- `StateGraph` builds the graph. `add_edge` is a fixed transition; `add_conditional_edges` calls a small routing function and follows the edge matching its return value.
- [`interrupt`](https://docs.langchain.com/oss/python/langgraph/interrupts) pauses one case and hands a question to a human. `Command(resume=...)` later continues that case with the human's answer.
- `thread_id` names one case. The checkpointer stores state per thread, so cases never see each other's data.

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
g.add_conditional_edges("revalidate", lambda s: "fresh" if s["fresh"] else "stale",
    {"fresh": "execute", "stale": "plan"})
g.add_edge("execute", END); g.add_edge("escalate", END)
graph = g.compile(checkpointer=SqliteSaver(sqlite3.connect("ckpt.db", check_same_thread=False)))

cfg = {"configurable": {"thread_id": "case-0042"}}   # one thread per case = isolation
graph.invoke({"case_id": "case-0042", "user": {"id": "kerem", "role": "analyst"}}, cfg)
# hours later, from the approval UI:
graph.invoke(Command(resume={"approved": True, "approver": "maria"}), cfg)
```

Here is that exact graph, drawn by LangGraph itself:

![LangGraph topology: start to plan to gate; gate routes allow to execute, approve to approval, unhandled to escalate and deny to end; approval routes allow to revalidate and deny to end; revalidate routes fresh to execute and stale back to plan](/posts/regulated-agent-platform/langgraph-topology.svg)

The picture is generated, not hand-drawn. Any compiled LangGraph graph can describe itself: `graph.get_graph().draw_mermaid()` returns the topology as [Mermaid](https://mermaid.js.org/) text (a plain-text diagram format), and `draw_mermaid_png()` returns an image. Both methods are documented on LangChain's [`Graph` reference page](https://reference.langchain.com/python/langchain-core/runnables/graph/Graph). Solid arrows are fixed edges. Dotted arrows are conditional edges, labelled with the value the routing function returns. Because the diagram comes from the compiled graph, it cannot drift from the code, so it doubles as review material: a pull request that adds an edge also changes this picture.

Reading it top to bottom: every case plans, then hits the gate. Only two paths end in `execute`: an allow straight from the gate, or an approval whose context is still fresh. Everything else ends at a human (`escalate`), at a logged denial, or back at `plan`.

You write `plan`, `revalidate`, `execute` and `escalate`. `revalidate` re-reads the record and compares its version to the one seen at planning time; if it changed while the case waited for approval, the case routes back to `plan` instead of firing an old decision.

The `audit` function makes the log *hash-chained*: every line stores a SHA-256 fingerprint of the line before it. Editing or deleting any past line breaks every fingerprint after it, so tampering is detectable even in a plain file.

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
- You translate their answers into a decision table: condition, action, exception, owner. That table becomes the system prompt, the tool menu and the golden test set (the reference answers you score the agent against).
- Show them the agent's reasoning on real cases early. Correcting a wrong answer is easy for them; writing rules from scratch is not.

**2. Bridge missing data access with RPA, behind a tool interface.**

Robotic process automation (RPA) means a script operates an application's screen the way a person would: clicking, typing and reading what appears. It is the fallback when a system has no API.

- Check first: browser tab or native window? A web app means [Playwright](https://playwright.dev/python/), a browser automation library you can drive from Python. A native desktop app means an RPA product such as [Power Automate Desktop](https://learn.microsoft.com/en-us/power-automate/desktop-flows/introduction) or [UiPath](https://www.uipath.com/).
- Automate the smallest slice: log in, search one reference, read the result.
- Wrap it as a normal tool, `lookup_transaction(ref)`, so the agent never knows a UI sits underneath.
- Route it through the same gateway and audit log as any API. Log timeouts and missing elements as distinct failure types.
- Label it technical debt in writing, with a plan to swap in a real API.

**3. Harden policy and audit.**

- Move rules from a Python dict to [Open Policy Agent](https://www.openpolicyagent.org/) (OPA). OPA is an open-source policy engine: you write rules in its language, [Rego](https://www.openpolicyagent.org/docs/policy-language), and any service can ask it "is this action allowed for this user?" and get a deterministic, explainable answer. Keep the rule files in git, with a unit test per rule.
- Move the audit log into the client's [Databricks](https://www.databricks.com/) workspace, the data platform many banks already run. Store it as a [Delta Lake](https://delta.io/) table, an open table format, with the [`delta.appendOnly = true`](https://docs.delta.io/table-properties/) property so rows can be added but never changed or deleted. Govern it with [Unity Catalog](https://docs.databricks.com/aws/en/data-governance/unity-catalog/), Databricks' layer for access control and data lineage, so the log never leaves the client's perimeter.
- Stamp every record with graph version, policy version and model version.

**4. Measure and sell the result.**

- Replay each historical case and compare the agent's proposal to what the human actually did.
- Report agreement per case category, not one global number. Categories above your threshold are candidates for Stage 2 autonomy.
- Use [MLflow's evaluation tools](https://mlflow.org/docs/latest/genai/eval-monitor/) with *LLM judges*, a second model that scores the quality of the agent's reasoning. Judges grade reasoning only; the compliance gate itself never uses an LLM.
- Deliverable for the sponsor: a dashboard of N real cases, agent versus human, with every disagreement explained. It costs little and is screenshot-ready for their supervisor.

**Done when:** agreement is measured per category on at least a few hundred cases, and the sponsor approves a scoped paid pilot.

## Stage 2: Human-in-the-loop production

Goal: the agent executes low-risk, well-covered categories on its own and routes everything else to a named human, with one linked audit trail per case.

![Request path: authenticate, plan, policy gateway, then allow, approve, deny or escalate](/posts/regulated-agent-platform/request-path.svg)

**Request path, per tool call:**

1. **Authenticate** through the client's [Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/fundamentals/whatis) (formerly Azure Active Directory), the identity service most banks already use for single sign-on. Login uses [OpenID Connect](https://openid.net/developers/how-connect-works/) (OIDC), the standard behind "sign in with" buttons. The resulting token carries user ID, roles and scope, so there is no separate user database.
2. **Plan** in LangGraph. One graph instance per case, `thread_id = case_id`.
3. **Gate** every tool call, not just the first: the orchestrator asks the OPA service, passing action type, data sensitivity and the user's live roles. Deny by default.
4. **Allow** executes immediately. Where the target system supports it, the call uses Entra's [on-behalf-of flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-on-behalf-of-flow): the agent acts with the requesting user's permissions, never broader service rights. The audit write is asynchronous so it never slows the work.
5. **Require approval** writes a row to an approval queue (proposed action, agent reasoning, context snapshot hash, assigned approver role) and pauses that case only.
6. **Approve or reject** happens in a review UI (a small [React](https://react.dev/) app works well). The approver's identity and timestamp append to the same audit chain. *Four-eyes* rules, where a second person must confirm, apply where the policy says so.
7. **Revalidate on resume.** If the context hash changed while waiting, the case loops back to the requester with a clarifying question instead of executing a stale plan.

**Concurrency and memory isolation.**

- One shared, versioned graph definition; many isolated runtime instances. A paused case never blocks the other 999.
- Working memory is scoped to the thread and keyed by case ID. No memory is shared across cases, so case A's data cannot influence case B.
- Source data is fetched fresh per step and never copied into long-term agent memory. Only derived reasoning state is checkpointed.
- The checkpointer moves from SQLite to [PostgreSQL](https://www.postgresql.org/), a production database. If approvals routinely wait days or need timers and retries, run each case as a workflow in [Temporal](https://temporal.io/), a *durable execution* engine that keeps long-running processes alive through crashes and restarts, with LangGraph inside it.

**Gradual autonomy.** Each category starts in approve-everything mode. It moves to auto-execute only when its measured agreement from Stage 1 and live approvals stays above an agreed threshold, and that promotion is itself a versioned policy change.

**Done when:** one category runs autonomously in production, every action is traceable from request to approver, and the unhandled queue feeds the learning loop.

## Stage 3: Full regulated platform

Goal: one product you can deploy into any regulated client, on their infrastructure, with compliance evidence produced as a side effect of normal operation.

**Hybrid deployment.**

- Ship the whole stack (orchestrator, gateway, tool services, approval UI, vector store) as signed container images, packaged as [Helm](https://helm.sh/) charts, the standard install format for Kubernetes.
- Run single-tenant inside the client's own Azure account on [Azure Kubernetes Service](https://learn.microsoft.com/en-us/azure/aks/what-is-aks) (AKS), or in their data center. Their data, logs and audit tables stay in their perimeter.
- A model gateway makes the LLM swappable: Azure OpenAI for clients already in that boundary, open-weight models served with [vLLM](https://docs.vllm.ai/), a fast open-source inference server, for clients that cannot send data out at all.

**Graph governance.**

- Topology lives in git. Adding a node or edge is a pull request with code review, a new version number and a changelog entry. The generated graph diagram from Stage 0 shows the change visually in the same review.
- Before promotion, the new version replays a set of historical cases in staging and must not regress any category.
- Every audit record carries graph, policy, prompt and model versions, so any past decision can be reproduced.

**Security and red teaming.**

- Treat tool outputs (emails, PDFs, UI text read by RPA) as untrusted input. [Prompt injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/), text hidden in content that tries to give the model new instructions, must never change the tool menu or bypass the gateway.
- *Red teaming* means attacking your own system on purpose to find weaknesses first. Run adversarial test suites per release and continuously in production, and re-run them when the model, data or threats change. AI governance and red-teaming tools are a product category of their own, so this is a real build-or-buy decision.
- Keep secrets in [Azure Key Vault](https://learn.microsoft.com/en-us/azure/key-vault/general/overview), Azure's managed secret store, give services managed identities instead of passwords, and allow no standing human access to production data.

**Operations.** MLflow 3 traces plus metrics on latency, cost per case, approval wait time, escalation rate and agreement per category, with alerts on drift (a slow change in inputs or behaviour that erodes accuracy).

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
2. **Stage 1 to 2:** cluster them weekly. Turn each fingerprint's text into an *embedding* (a vector of numbers where similar text lands close together), group nearby vectors with a clustering algorithm such as [HDBSCAN](https://hdbscan.readthedocs.io/en/latest/how_hdbscan_works.html), and also group exactly on the structured fields. Two cases ending in the same state but needing node A versus node B separate on "missing precondition" and "tool expected".
3. Rank clusters by frequency times business impact. The top cluster becomes the next pull request: a new node, edge or tool.
4. Replay the cluster's cases against the new graph version in staging before promotion.
5. Track escalation rate per category. A falling rate is your evidence of progress for the sponsor and the auditor.

## Compliance mapping

Each control is a by-product of a component above, so evidence accumulates automatically instead of being assembled before an audit. Article numbers refer to the [EU AI Act](https://eur-lex.europa.eu/eli/reg/2024/1689/oj); Annex A is the list of security controls in ISO/IEC 27001.

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

**Concepts**

| Term | Meaning here |
| --- | --- |
| Agent | An LLM that plans steps and calls tools to finish a task |
| Audit trail | Append-only record of every decision; rows can be added, never edited |
| Checkpointer | LangGraph storage that saves each case's state so it can pause and resume |
| Drift | A gradual change in inputs or model behaviour that erodes accuracy over time |
| Durable execution | Running a long process so it survives crashes and restarts without losing its place |
| Embedding | A vector of numbers representing text, where similar meanings sit close together |
| Fingerprint | Structured record of why a case had no path, used to cluster failures |
| Four-eyes rule | A sensitive action needs confirmation from a second person |
| Golden set | Reference cases with known correct answers, used to score the agent |
| Hash chain | Each log line stores a hash of the previous one, so any edit to history is detectable |
| Interrupt | LangGraph call that pauses one case until a human answers ([docs](https://docs.langchain.com/oss/python/langgraph/interrupts)) |
| LLM judge | A second model used to score another model's output |
| On-behalf-of flow | The agent calls a system with the requesting user's permissions ([Microsoft docs](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-on-behalf-of-flow)) |
| Policy gateway | Service that decides allow, require approval or deny for every tool call |
| Prompt injection | Text hidden in content that tries to give the model new instructions ([OWASP](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)) |
| Red teaming | Attacking your own system on purpose to find weaknesses before others do |
| RPA | Robotic process automation: scripts that operate a legacy UI when no API exists |
| Shadow mode | Agent proposes decisions on real cases but never executes; compared against humans |
| SOP | Standard operating procedure: how a team does a recurring task |

**Tools and services**

| Name | What it is |
| --- | --- |
| [Azure Key Vault](https://learn.microsoft.com/en-us/azure/key-vault/general/overview) | Azure's managed store for secrets, keys and certificates |
| [Azure Kubernetes Service (AKS)](https://learn.microsoft.com/en-us/azure/aks/what-is-aks) | Microsoft's managed Kubernetes for running containers |
| [Azure OpenAI](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/overview) | OpenAI models served from inside Microsoft Azure, now part of Microsoft Foundry |
| [Databricks](https://www.databricks.com/) | Data and AI platform many banks run their analytics on |
| [Delta Lake](https://delta.io/) | Open table format with transactions; supports append-only tables |
| [FastAPI](https://fastapi.tiangolo.com/) | Python framework for building web APIs |
| [Helm](https://helm.sh/) | Package format and installer for Kubernetes applications |
| [HDBSCAN](https://hdbscan.readthedocs.io/en/latest/how_hdbscan_works.html) | Clustering algorithm that finds groups without being told how many to expect |
| [LangGraph](https://docs.langchain.com/oss/python/langgraph/overview) | Python library for building agent workflows as graphs of nodes and edges |
| [Mermaid](https://mermaid.js.org/) | Plain-text diagram language; LangGraph exports graphs in it |
| [Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/fundamentals/whatis) | Microsoft's identity and single sign-on service, formerly Azure Active Directory |
| [MLflow](https://mlflow.org/docs/latest/genai/tracing/) | Open-source platform for tracking ML work, including agent tracing and evaluation |
| [Ollama](https://ollama.com/) | Runs open-weight language models on your own machine |
| [Open Policy Agent (OPA)](https://www.openpolicyagent.org/) | Open-source policy engine; rules are written in [Rego](https://www.openpolicyagent.org/docs/policy-language) |
| [OpenID Connect (OIDC)](https://openid.net/developers/how-connect-works/) | Standard protocol for signing in and passing identity tokens |
| [Playwright](https://playwright.dev/python/) | Browser automation library, usable from Python |
| [PostgreSQL](https://www.postgresql.org/) | Open-source production database |
| [Power Automate Desktop](https://learn.microsoft.com/en-us/power-automate/desktop-flows/introduction) | Microsoft's RPA tool for automating desktop applications |
| [SQLite](https://sqlite.org/) | Single-file database, built into Python |
| [Streamlit](https://streamlit.io/) | Python library for quick web interfaces |
| [Temporal](https://temporal.io/) | Durable execution engine for long-running workflows |
| [UiPath](https://www.uipath.com/) | Commercial RPA platform |
| [Unity Catalog](https://docs.databricks.com/aws/en/data-governance/unity-catalog/) | Databricks' layer for access control and data lineage |
| [vLLM](https://docs.vllm.ai/) | Open-source, high-throughput server for running language models |
