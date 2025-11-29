# IF Gym 🏋️

> AI Agent Framework for Playing Interactive Fiction Games

IF Gym is an experimental framework for training and evaluating AI agents on interactive fiction (text adventure) games. Inspired by OpenAI Gym, it provides a standardized environment for testing LLM reasoning, planning, and problem-solving capabilities.

## Why Interactive Fiction?

Text adventures offer a perfect testbed for AI agents:

- **Complex reasoning required** - Puzzles demand multi-step planning
- **Natural language interface** - Direct test of language understanding
- **Rich state space** - Thousands of possible game states
- **Clear objectives** - Measurable success criteria
- **Resource constrained** - Can test local/smaller models
- **Diverse challenges** - Different games test different capabilities

## Project Status

🚧 **Active Development** - Core framework in place, first agents coming soon

### Current Features

- ✅ Core agent/game abstractions
- ✅ Monorepo structure
- ✅ TypeScript with strict typing
- 🚧 ifvms.js adapter (coming soon)
- 🚧 OpenAI agent (GPT-4, GPT-3.5)
- 🚧 Anthropic agent (Claude 3.5 Sonnet)
- 🚧 Local model agent (Ollama/llama.cpp)

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run an agent on a game (coming soon)
pnpm play --game games/zork1.z3 --agent gpt-4

# Run benchmark suite (coming soon)
pnpm benchmark --suite zork-opening
```

## Architecture

```
if-gym/
├── packages/
│   ├── core/          # Agent/game interfaces, session management
│   ├── interpreters/  # Game engine adapters (ifvms, frotz)
│   ├── agents/        # LLM implementations (OpenAI, Anthropic, local)
│   ├── evaluators/    # Metrics, scoring, analysis
│   └── cli/           # Command-line interface
├── games/             # IF game files (.z3, .z5, .z8)
├── benchmarks/        # Benchmark definitions
└── experiments/       # Results and analysis
```

## Novel Research Directions

### 1. Multi-Model Comparison
Compare reasoning strategies across different LLMs:
- GPT-4 vs Claude 3.5 Sonnet vs Llama 70B
- How do different models approach puzzles?
- Which architectures excel at planning?

### 2. Resource-Constrained Agents
Test smaller, local models:
- Can 8B parameter models compete?
- Efficiency vs capability trade-offs
- Running agents on limited hardware

### 3. Reasoning Trace Analysis
Capture and study agent thinking:
- How do successful agents plan?
- Common failure patterns
- Transfer learning across games

### 4. Agent Evaluation Metrics
Novel performance measures:
- Commands per puzzle solved
- Exploration efficiency
- Backtracking frequency
- Novel command creativity

## Example Usage (Planned)

```typescript
import { GameSession } from '@if-gym/core';
import { IFVMSAdapter } from '@if-gym/interpreters';
import { GPT4Agent } from '@if-gym/agents';

// Create game instance
const game = new IFVMSAdapter({
  gamePath: 'games/zork1.z3'
});

// Create agent
const agent = new GPT4Agent({
  model: 'gpt-4',
  apiKey: process.env.OPENAI_API_KEY,
  captureReasoning: true
});

// Run session
const session = new GameSession(game, agent, {
  maxTurns: 100,
  verbose: true
});

const result = await session.run();

console.log(`Completed in ${result.turns} turns`);
console.log(`Success: ${result.metrics.success}`);
```

## Games

IF Gym works with any Z-machine game:

- **Zork I, II, III** - Classic cave adventures
- **Hitchhiker's Guide** - Douglas Adams' comedy masterpiece
- **Planetfall** - Sci-fi adventure
- **Trinity** - Nuclear war drama
- **Photopia** - Experimental narrative

And hundreds more from the [IF Archive](https://ifarchive.org).

## Development Roadmap

### Phase 1: Core Framework (In Progress)
- [x] Project scaffolding
- [x] Core abstractions (Agent, Game, Session)
- [ ] ifvms.js adapter
- [ ] Basic CLI

### Phase 2: First Agents
- [ ] Random baseline agent
- [ ] GPT-4 agent with CoT prompting
- [ ] Claude 3.5 Sonnet agent
- [ ] Evaluation metrics

### Phase 3: Experimentation
- [ ] Zork I benchmark suite
- [ ] Multi-agent comparison
- [ ] Reasoning trace analysis
- [ ] Results visualization

### Phase 4: Local Models
- [ ] Ollama integration
- [ ] llama.cpp support
- [ ] Efficiency comparisons
- [ ] Resource usage metrics

### Phase 5: Advanced Features
- [ ] Multi-game transfer learning
- [ ] Agent memory/learning
- [ ] Collaborative agents
- [ ] Visual game representation

## Contributing

IF Gym is an experimental research project. Contributions welcome!

Areas of interest:
- New agent implementations
- Interpreter adapters
- Evaluation metrics
- Benchmark suites
- Analysis tools

## Related Work

- **[Jericho](https://github.com/microsoft/jericho)** - Reinforcement learning for IF (Python)
- **[TextWorld](https://github.com/microsoft/TextWorld)** - Procedural IF generation (Python)
- **[ifvms.js](https://github.com/curiousdannii/ifvms.js)** - Modern Z-machine interpreter (TypeScript)

IF Gym differs by focusing on LLM agents and comparing different models' reasoning strategies.

## License

MIT

## Acknowledgments

- Infocom for creating the Z-machine and classic games
- Graham Nelson for the Z-Machine Standards Document
- The IF community for preserving gaming history
- ifvms.js for the excellent TypeScript interpreter

---

**IF Gym** - Where AI agents learn to explore, puzzle-solve, and adventure 🎮🤖
