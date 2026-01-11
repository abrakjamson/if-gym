# IF Gym 🏋️

> AI Agent Framework for Playing Interactive Fiction Games

IF Gym is an experimental framework for training and evaluating AI agents on interactive fiction (text adventure) games. It provides a standardized environment for testing LLM reasoning, planning, and long-term memory capabilities.

## Key Features

- ✅ **Z-Machine Support**: Robust `ifvms.js` adapter for playing classic games (Zork, Lost Pig, etc.).
- ✅ **Advanced Agents**: 
  - `prompt-cache`: Full-history context for standard play.
  - `goals`: Long-term memory agent that maintains a `goals.md` document using OpenAI's native `apply_patch` tool.
- ✅ **Modern API Support**: Integration with OpenAI's `Responses` API (including `gpt-5.2`).
- ✅ **Comprehensive Logging**: Automated session logging to files with metadata, reasoning traces, and metrics.
- ✅ **Clean Architecture**: Separated Agent (strategy) and Model (provider) layers.

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

# Play with a random baseline agent
pnpm play --game games/zdungeon.z5 --agent random
```

## CLI Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `-g, --game <path>` | Path to the `.z3`, `.z5`, etc. file | (Required) |
| `-a, --agent <type>` | `prompt-cache`, `goals`, or `random` | `prompt-cache` |
| `-m, --model <type>` | `openai` or `random` | `openai` |
| `--model-name <name>`| Specific LLM (e.g., `gpt-5.2`, `gpt-4o`) | `gpt-5.2` |
| `--turns <number>` | Maximum turns per session | `100` |
| `--log` | Enable full gameplay output to console | `false` |
| `--log-file <path>` | Custom path for session log file | `./logs/session-*.log` |
| `--no-console` | Disable terminal output (logging still works) | `false` |

## Agent Strategies

### Goals Agent (`--agent goals`)
The Goals Agent is designed for complex games where the context window might get crowded. Instead of sending the full history every turn, it:
1. Maintains a `goals.md` file with `# Tasks`, `# Inventory`, and `# Clues`.
2. Uses the OpenAI `apply_patch` tool to perform incremental updates to its memory.
3. Only passes the current situation and the updated memory to the model, drastically reducing token usage and focusing the agent's attention.

## Architecture

```
if-gym/
├── packages/
│   ├── core/          # Interfaces (IFGame, IFModel, IFAgent), Logger
│   ├── interpreters/  # IFVMSAdapter (Z-machine)
│   ├── agents/        # PromptCacheAgent, GoalsAgent, RandomAgent
│   ├── models/        # OpenAIModel (Responses API), RandomModel
│   └── cli/           # CLI implementation
├── games/             # Place your game files here
└── logs/              # Session logs are saved here
```

## Development

### Debugging
VS Code launch configurations are provided. Press **F5** to start the "Play: OpenAI Agent" task, which builds the project and attaches the debugger to the CLI. Breakpoints in TypeScript source files will work as expected.

## Related Work

- **[Jericho](https://github.com/microsoft/jericho)** - Reinforcement learning for IF (Python)
- **[ifvms.js](https://github.com/curiousdannii/ifvms.js)** - The TypeScript interpreter used by this framework.

## License

MIT