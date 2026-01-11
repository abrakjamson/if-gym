# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**IF Gym** is an AI agent framework for playing interactive fiction (text adventure) games. It provides a standardized environment for training, testing, and comparing LLM agents on complex reasoning tasks.

**Key Principle**: We USE existing interpreters (ifvms.js via glkote-term) and focus on agent implementations, memory strategies, and evaluation.

## Architecture

### Monorepo Structure

- **`packages/core/`**: Core abstractions (Agent, Game, Model, Session, Logger)
- **`packages/interpreters/`**: Adapters for game engines (IFVMSAdapter for Z-machine)
- **`packages/models/`**: LLM provider adapters (OpenAIModel with Responses API support)
- **`packages/agents/`**: Agent strategies (PromptCacheAgent, GoalsAgent)
- **`packages/evaluators/`**: Metrics and analysis tools
- **`packages/cli/`**: CLI for running games (`pnpm play`)

### Layered Execution Model

We separate the **Agent** (strategy) from the **Model** (provider):
1. **Agent**: Decides what to send to the model and how to process the results (e.g., maintaining a `goals.md` file).
2. **Model**: Handles the raw API communication (e.g., OpenAI Responses API, tool-calling loops).

### Package Dependencies

```
@if-gym/cli → depends on → all packages
@if-gym/agents → depends on → @if-gym/core, @if-gym/models
@if-gym/models → depends on → @if-gym/core
@if-gym/interpreters → depends on → @if-gym/core
```

## Development Commands

### Project-wide Commands

```bash
pnpm install   # Install all dependencies
pnpm build     # Build all packages
pnpm play --game games/zork1.z3 --agent goals --model openai --log  # Run a session
```

## Implementation Strategy

### Agent Patterns

1. **PromptCacheAgent**: Sends `Game Start` + `Recent History` (full command/response pairs) to the model every turn. Optimized for prompt caching.
2. **GoalsAgent**: Maintains a persistent `goals.md` document (Tasks, Inventory, Clues). Uses OpenAI's native `apply_patch` tool to update memory instead of sending full history.

### Model Implementation

- **OpenAIModel**: Uses the `Responses` API. Implements an internal tool-calling loop using `previous_response_id` to handle multi-turn interactions (like patching memory before issuing a game command).
- Models should return a standard `AgentAction` with reasoning and a text command.

### Interpreter Implementation

- **IFVMSAdapter**: Wraps `ifvms.js` and `glkote-term`.
- Supports both `line` (standard input) and `char` (one-key) input modes.
- Captures status bar (grid) and buffer window content.

## Code Style & Standards

- **Strict mode**: All packages use `"strict": true`.
- **Imports**: Use `.js` extensions in imports for ESM compatibility (e.g., `import { Foo } from './foo.js'`).
- **Tools**: Prefer native model tools (like `apply_patch`) for agent memory management.

## Debugging in VS Code

- Use the **"Play: OpenAI Agent"** launch configuration.
- It automatically runs the `pnpm:build` task before launching.
- Source maps are enabled; set breakpoints directly in `.ts` files in `packages/agents` or `packages/models`.
- Environment variables are loaded from `packages/cli/.env`.

---

**Remember**: The goal is to study how AI agents reason and plan. The `goals.md` pattern is preferred for complex games to manage context window efficiency.