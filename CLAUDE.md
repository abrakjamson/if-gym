# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**IF Gym** is an AI agent framework for playing interactive fiction (text adventure) games. It provides a standardized environment for training, testing, and comparing LLM agents on complex reasoning tasks.

**Key Principle**: We USE existing interpreters (ifvms.js via glkote-term) and focus on agent implementations, memory strategies, and evaluation.

## Architecture

### Monorepo Structure

- **`packages/core/`**: Core abstractions (Agent, Game, Model, Session, Logger)
- **`packages/interpreters/`**: Adapters for game engines (IFVMSAdapter for Z-machine)
- **`packages/models/`**: LLM provider adapters:
  - `OpenAIModel`: For the modern `Responses` API (supports native `apply_patch`).
  - `ChatModel`: For standard `chat/completions` API (Ollama, LM Studio, etc.).
- **`packages/agents/`**: Agent strategies:
  - `PromptCacheAgent`: Full-history context.
  - `GoalsAgent`: Persistent markdown-based memory (`goals.md`).
- **`packages/cli/`**: CLI for running games (`pnpm play`).

### Layered Execution & Interoperability

Both `openai` and `chat` models implement a **multi-turn tool loop**:
1. If the model emits a tool call (like a patch), the model layer executes it via a callback and re-invokes the model with the result.
2. This continues until the model returns a final text command.
3. The `ChatModel` automatically maps specialized tools like `apply_patch` to standard functions if not natively supported.

## Development Commands

### Project-wide Commands

```bash
pnpm install   # Install all dependencies
pnpm build     # Build all packages
pnpm play --game games/zork1.z3 --agent goals --model chat --base-url http://localhost:1234/v1 --log
```

## Implementation Strategy

### Agent Patterns

1. **GoalsAgent**: 
   - Mandatory tool-calling workflow: Memory Patch -> Game Command.
   - Resilient patching: Uses a custom line-based patcher to handle imprecise model diffs.
   - Persistence: Writes `logs/goals-live.md` for real-time monitoring.

### Model Implementation

- **JSON Extraction**: Both models use an aggressive `extractJson` helper to find JSON buried in conversational text or markdown blocks.
- **Strict Schema**: `json_schema` is enforced for the final game command response.

## Code Style & Standards

- **Strict mode**: All packages use `"strict": true`.
- **Imports**: Use `.js` extensions in imports for ESM compatibility.
- **Dependencies**: New models go in `packages/models`, new strategies in `packages/agents`.

---

**Remember**: The architecture is built for interoperability. Agents should define tools in a model-agnostic way, and model providers are responsible for normalizing the handshake.
