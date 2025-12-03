# 🚀 k6 Enterprise Framework v2.0 Roadmap

This roadmap outlines the strategic vision for the next major version of the framework, focusing on **Agentic AI Integration** and **Model Context Protocol (MCP)** adoption to transform load testing from a manual activity into an intelligent, autonomous process.

## 🎯 Core Vision
To evolve the framework from a "Test Runner" into an "Intelligent Quality Platform" where AI agents collaborate to plan, build, execute, and analyze performance tests.

---

## 🏗 Phase 1: The AI Interface Layer (MCP)

The foundation of v2.0 is enabling AI models to interact directly with the framework tools.

### 1.1 MCP Server Implementation
Implement a **Model Context Protocol (MCP)** server that exposes framework capabilities as tools for LLMs.

- **Resource Exposure**:
  - `read_config(client, env)`: Allow agents to read current configurations.
  - `list_scenarios(client)`: List available test scenarios.
  - `get_metrics(test_id)`: Retrieve performance metrics from past runs.
- **Tool Exposure**:
  - `run_test(client, test, params)`: Trigger test executions programmatically.
  - `validate_schema(file)`: Check configuration validity.
  - `generate_scaffold(name)`: Create new client/test directory structures.

**Goal**: Enable any MCP-compliant client (Claude Desktop, IDEs, Custom Agents) to control the framework.

---

## 🤖 Phase 2: The Agentic Ecosystem

We will introduce four specialized AI agents that work in a pipeline.

### 2.1 🧠 The Planner Agent (Test Planning)
*Role: Architect & Strategist*

- **Input**: Feature requirements, API specs (OpenAPI/Swagger), or user descriptions (e.g., "We are launching a Black Friday flash sale").
- **Capabilities**:
  - Analyzes application architecture (via RAG on `docs/`).
  - Determines necessary test types (Load, Stress, Spike, Soak).
  - Defines traffic models (e.g., "Ramping arrival rate from 100 to 5k req/s").
  - **Output**: A structured `TestPlan` artifact and configuration JSON.

### 2.2 👷 The Builder Agent (Test Construction)
*Role: Developer & Implementer*

- **Input**: `TestPlan` from the Planner Agent.
- **Capabilities**:
  - Generates TypeScript k6 scripts.
  - **Strictly enforces framework patterns**:
    - Uses `RequestHelper` for calls.
    - Uses `HeaderHelper` for context.
    - Uses `StructuredLogger` for observability.
  - Validates code against `contracts/` and `schemas/`.
- **Output**: Executable `.ts` test files and data CSVs.

### 2.3 🕵️ The Analyst Agent (Result Analysis)
*Role: Investigator & Data Scientist*

- **Input**: Raw execution data (JSON output), Logs, and Monitoring metrics (Prometheus/Tempo).
- **Capabilities**:
  - **Anomaly Detection**: Identifies deviations from baselines not caught by simple thresholds.
  - **Root Cause Correlation**: Correlates latency spikes with specific log errors or trace bottlenecks.
  - **Regression Hunter**: Compares current run vs. historical bests (using the `comparison-*.md` logic but deeper).
- **Output**: An `AnalysisReport` highlighting bottlenecks, potential memory leaks, and specific slow endpoints.

### 2.4 📢 The Reporter Agent (Communication)
*Role: Communicator*

- **Input**: `AnalysisReport` and raw metrics.
- **Capabilities**:
  - Generates stakeholder-specific summaries (Executive vs. Technical).
  - Posts rich summaries to Slack/Teams (enhancing our current `slack-notify.js`).
  - Updates documentation automatically.
- **Output**: Final HTML reports, Slack alerts, and Jira tickets for found bugs.

---

## 🛠 Phase 3: Framework Core Enhancements

To support the agents, the core framework needs upgrades.

### 3.1 Semantic Knowledge Base
- Create a vector database index of:
  - All existing test scripts (as few-shot examples).
  - Framework documentation (`docs/`).
  - Helper utility source code.
- **Purpose**: Allow the Builder Agent to write idiomatic code by "reading" the codebase.

### 3.2 Adaptive Execution Engine
- **Self-Healing Tests**: If an API schema changes (e.g., field renamed), the Builder Agent can attempt to fix the script automatically based on the error log.
- **Auto-Scaling**: If the Analyst Agent detects the SUT (System Under Test) is healthy at max load, it can instruct the runner to dynamically increase VUs to find the breaking point.

### 3.3 Deep Observability Links
- Tighter integration with **Tempo** and **Pyroscope**.
- Agents should be able to query: "Show me the CPU profile of the auth service during the latency spike at 10:05 AM".

---

## 📅 Proposed Timeline

| Milestone      | Deliverable                         | Estimated Impact           |
| -------------- | ----------------------------------- | -------------------------- |
| **v2.0-alpha** | MCP Server Basic Implementation     | AI can run tests           |
| **v2.0-beta1** | Builder Agent (Script Generation)   | 50% faster script creation |
| **v2.0-beta2** | Analyst Agent (Log/Metric Analysis) | Automated root cause hints |
| **v2.0-GA**    | Full Agentic Pipeline & Planner     | Autonomous Load Testing    |

---

## 📝 Next Steps
1. **Prototype MCP Server**: Build a simple server exposing `run-test.sh`.
2. **Define Agent Prompts**: Create system prompts for the Builder Agent to ensure it uses `RequestHelper`.
3. **Vectorize Docs**: Prepare the RAG knowledge base.
