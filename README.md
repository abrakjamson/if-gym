# IF Gym 🏋️

> AI Agent Framework for Playing Interactive Fiction Games

IF Gym is an experimental framework for training and evaluating AI agents on interactive fiction (text adventure) games. It provides a standardized environment for testing LLM reasoning, planning, and long-term memory capabilities.

## Key Features

- ✅ **Z-Machine Support**: Robust `ifvms.js` adapter for playing classic games (Zork, Lost Pig, etc.).
- ✅ **Advanced Agents**: 
  - `prompt-cache`: Full-history context for standard play.
  - `goals`: Long-term memory agent that maintains a `goals.md` document using persistent state.
- ✅ **Interoperable Model Providers**:
  - `openai`: Integration with OpenAI's cutting-edge `Responses` API (including `gpt-5.2`).
  - `chat`: Support for standard Chat Completions API, compatible with local hosts like **LM Studio**, **Ollama**, and **vLLM**.
- ✅ **Tool-Calling Loops**: Automatic multi-turn handshake for memory updates (using native `apply_patch` on OpenAI or mapped functions on local models).
- ✅ **Live Memory Visualization**: Watch the agent's thoughts evolve in real-time via `logs/goals-live.md`.
- ✅ **Comprehensive Logging**: Automated session logging to files with metadata, reasoning traces, and metrics.

## Quick Start

### 1. Install Dependencies
```bash
pnpm install
pnpm build
```

### 2. Configuration
Create a `.env` file in `packages/cli/.env`:
```env
OPENAI_API_KEY=your_key_here
```

### 3. Run a Session
```bash
# Play Zork with the Goals agent and OpenAI gpt-5.2
pnpm play --game games/zork1.z3 --agent goals --model openai --log

# Play Lost Pig with a local model via LM Studio
pnpm play --game games/lostpig.z8 --agent goals --model chat --base-url http://localhost:1234/v1 --model-name your-model-here --log
```

## CLI Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `-g, --game <path>` | Path to the `.z3`, `.z5`, etc. file | (Required) |
| `-a, --agent <type>` | `prompt-cache`, `goals`, or `random` | `prompt-cache` |
| `-m, --model <type>` | `openai` (Responses API), `chat` (standard API), or `random` | `openai` |
| `--model-name <name>`| Specific LLM identifier | `gpt-5.2` |
| `--base-url <url>` | Custom API endpoint (for local hosts like LM Studio) | (Optional) |
| `--turns <number>` | Maximum turns per session | `100` |
| `--log` | Enable full gameplay output to console | `false` |
| `--log-file <path>` | Custom path for session log file | `./logs/session-*.log` |
| `--no-console` | Disable terminal output (logging still works) | `false` |

## Agent Strategies

### Goals Agent (`--agent goals`)
The Goals Agent manages a persistent `goals.md` document to handle complex games efficiently:
1. **Memory**: Tracks `# Tasks`, `# Inventory`, and `# Clues`.
2. **Persistence**: Updates a live file at `logs/goals-live.md` every turn.
3. **Handshake**: Performs an internal tool-calling loop to patch its memory *before* issuing the game command.
4. **Interoperability**: Uses OpenAI's native `apply_patch` tool on the `openai` provider, and automatically maps it to a standard `function` call on the `chat` provider.

## Architecture

```
if-gym/
├── packages/
│   ├── core/          # Interfaces (IFGame, IFModel, IFAgent), Logger
│   ├── interpreters/  # IFVMSAdapter (Z-machine)
│   ├── agents/        # PromptCacheAgent, GoalsAgent, RandomAgent
│   ├── models/        # OpenAIModel (Responses), ChatModel (Standard), RandomModel
│   └── cli/           # CLI implementation
├── games/             # Place your game files here
└── logs/              # Session logs and live memory files
```

## License

MIT
