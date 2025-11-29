# IF Gym Architecture

## Overview

IF Gym is a modular framework for training and evaluating AI agents on interactive fiction games. The architecture separates concerns into distinct packages with clear interfaces.

## Core Concepts

### 1. Game Abstraction (`IFGame`)

The `IFGame` interface abstracts different game engines (ifvms, frotz, glulx):

```typescript
interface IFGame {
  load(gameFile: string | Buffer): Promise<void>;
  start(): Promise<string>;
  executeCommand(command: string): Promise<CommandResult>;
  getState(): GameState;
  save(): Promise<Buffer>;
  restore(saveData: Buffer): Promise<void>;
}
```

**Key Design Decisions:**
- Async by nature (games may be remote/sandboxed)
- Save/restore for checkpointing experiments
- State is immutable snapshot

### 2. Agent Abstraction (`IFAgent`)

The `IFAgent` interface defines AI agents that play games:

```typescript
interface IFAgent {
  readonly id: string;
  readonly name: string;
  initialize(initialOutput: string): Promise<void>;
  act(state: GameState): Promise<AgentAction>;
  observe(command: string, result: string): Promise<void>;
  reset(): Promise<void>;
  getMetrics(): Promise<PerformanceMetrics>;
}
```

**Key Design Decisions:**
- Stateful (agents maintain context)
- Separation of action selection (`act`) and learning (`observe`)
- Metrics built-in for evaluation
- Optional reasoning capture via `AgentAction.reasoning`

### 3. Session Management (`GameSession`)

The `GameSession` orchestrates interaction between agent and game:

```typescript
class GameSession {
  constructor(game: IFGame, agent: IFAgent, config: SessionConfig);
  run(): Promise<SessionResult>;
}
```

**Responsibilities:**
- Turn-by-turn execution
- Timeout handling
- History tracking
- Error recovery

**Flow:**
```
1. game.start() → initialOutput
2. agent.initialize(initialOutput)
3. Loop until game ends or max turns:
   a. action = agent.act(state)
   b. result = game.executeCommand(action.command)
   c. agent.observe(action.command, result.output)
   d. Record turn
4. Return SessionResult with metrics
```

## Package Architecture

### `@if-gym/core`

**Purpose:** Shared types and interfaces

**Exports:**
- `IFGame` - Game engine interface
- `IFAgent` - Agent interface
- `GameSession` - Session orchestration
- `GameState`, `CommandResult`, `AgentAction` - Core types

**Dependencies:** None (pure abstractions)

### `@if-gym/interpreters`

**Purpose:** Adapters for game engines

**Structure:**
```
interpreters/
├── base.ts              # BaseInterpreter class
├── ifvms-adapter.ts     # ifvms.js wrapper
├── frotz-adapter.ts     # Frotz wrapper (future)
└── glulx-adapter.ts     # Glulx wrapper (future)
```

**Key Adapter: IFVMSAdapter**

Wraps ifvms.js to implement `IFGame`:

```typescript
class IFVMSAdapter extends BaseInterpreter {
  private engine: ifvms.Engine;

  async load(gameFile: string | Buffer) {
    this.engine = new ifvms.Engine();
    await this.engine.loadStory(gameFile);
  }

  async executeCommand(command: string) {
    const output = await this.engine.sendLine(command);
    return {
      output,
      gameEnded: this.engine.hasEnded(),
      score: this.engine.getScore(),
      moves: this.engine.getMoves()
    };
  }
}
```

**Dependencies:** `@if-gym/core`, ifvms (external)

### `@if-gym/agents`

**Purpose:** LLM agent implementations

**Structure:**
```
agents/
├── base.ts              # BaseAgent class
├── random.ts            # Random baseline
├── openai/
│   ├── gpt4.ts         # GPT-4 agent
│   └── gpt3-5.ts       # GPT-3.5 agent
├── anthropic/
│   ├── claude-sonnet.ts  # Claude 3.5 Sonnet
│   └── claude-opus.ts    # Claude 3 Opus
└── local/
    ├── ollama.ts       # Ollama models
    └── llama-cpp.ts    # llama.cpp integration
```

**Agent Prompting Strategy:**

```typescript
class GPT4Agent extends BaseAgent {
  private buildPrompt(state: GameState): string {
    return `You are playing an interactive fiction game.

Current situation:
${this.getRecentContext(state)}

Think through:
1. What do I know about the current situation?
2. What are my available actions?
3. What action makes the most progress?

Respond in JSON:
{
  "thoughts": "your reasoning",
  "command": "your action",
  "confidence": 0.8
}`;
  }

  async act(state: GameState): Promise<AgentAction> {
    const prompt = this.buildPrompt(state);
    const response = await this.llm.complete(prompt);
    const parsed = JSON.parse(response);

    return {
      command: parsed.command,
      reasoning: {
        thoughts: parsed.thoughts,
        confidence: parsed.confidence
      }
    };
  }
}
```

**Dependencies:** `@if-gym/core`, LLM SDKs (openai, @anthropic-ai/sdk, etc.)

### `@if-gym/evaluators`

**Purpose:** Metrics and analysis tools

**Structure:**
```
evaluators/
├── metrics.ts           # Metric calculators
├── comparator.ts        # Multi-agent comparison
├── analyzer.ts          # Reasoning trace analysis
└── reporter.ts          # Results visualization
```

**Key Metrics:**

```typescript
interface PerformanceMetrics {
  totalTurns: number;
  success: boolean;
  finalScore?: number;
  uniqueCommands: number;
  commandsPerMinute?: number;

  // Advanced metrics
  explorationEfficiency?: number;   // Unique rooms / total moves
  backtrackingRate?: number;        // Repeated commands / total
  puzzleSolveTime?: number;         // Turns to first major progress
  reasoningQuality?: number;        // Coherence score
}
```

**Dependencies:** `@if-gym/core`

### `@if-gym/cli`

**Purpose:** Command-line interface

**Commands:**
- `if-gym play` - Run agent on game
- `if-gym benchmark` - Run benchmark suite
- `if-gym analyze` - Analyze results
- `if-gym compare` - Compare agents

**Example:**
```bash
# Run GPT-4 on Zork I
if-gym play --game games/zork1.z3 --agent gpt-4 --max-turns 100

# Benchmark multiple agents
if-gym benchmark \
  --suite zork-opening \
  --agents gpt-4,claude-sonnet,llama-70b \
  --runs 5

# Compare reasoning strategies
if-gym analyze experiments/2025-01-15-comparison/ --focus reasoning
```

**Dependencies:** All packages, commander (CLI framework)

## Data Flow

### Typical Experiment Flow

```
1. CLI parses command
   ↓
2. Load game file (IFVMSAdapter)
   ↓
3. Initialize agent (GPT4Agent)
   ↓
4. Create GameSession
   ↓
5. Run session loop:
   - Agent reasons about state
   - Generates command
   - Game executes command
   - Agent observes result
   ↓
6. Collect metrics (Evaluators)
   ↓
7. Save results (experiments/)
   ↓
8. Optionally compare with other agents
```

### Data Persistence

```
experiments/
└── 2025-01-15-gpt4-vs-claude/
    ├── config.json           # Agent configs, game info
    ├── results.json          # Aggregated metrics
    ├── traces/
    │   ├── gpt4-run1.json   # Full session history
    │   └── claude-run1.json
    └── analysis/
        ├── reasoning.md      # Reasoning analysis
        └── metrics.csv       # Tabular metrics
```

## Extension Points

### Adding New Agents

1. Extend `BaseAgent` from `@if-gym/core`
2. Implement `act()` with LLM API calls
3. Implement `initialize()` to set context
4. Optionally override `observe()` for learning
5. Add to `packages/agents/src/index.ts`

### Adding New Interpreters

1. Extend `BaseInterpreter` from `@if-gym/interpreters`
2. Wrap existing engine (frotz, glulx, etc.)
3. Implement all `IFGame` methods
4. Handle engine-specific quirks
5. Add to `packages/interpreters/src/index.ts`

### Adding New Metrics

1. Define metric interface in `@if-gym/evaluators`
2. Implement calculator function
3. Integrate into `PerformanceMetrics`
4. Update reporters to display metric

## Design Principles

1. **Separation of Concerns** - Game engines, agents, evaluation are independent
2. **Interface-Driven** - Clear contracts enable swappable implementations
3. **Async by Default** - All I/O operations are async
4. **Type Safety** - Strict TypeScript throughout
5. **Reproducibility** - Full session traces for experiment replay
6. **Extensibility** - Easy to add agents, engines, metrics

## Performance Considerations

### Agent Context Management

```typescript
// Sliding window to prevent context overflow
private getRecentContext(state: GameState, windowSize: number = 10): string {
  const recentTurns = state.history.slice(-windowSize);
  return recentTurns.map(t => `> ${t.command}\n${t.response}`).join('\n\n');
}
```

### Parallel Experimentation

```typescript
// Run multiple agents in parallel
const agents = [gpt4Agent, claudeAgent, llamaAgent];
const results = await Promise.all(
  agents.map(agent => new GameSession(game, agent).run())
);
```

### Caching Game States

```typescript
// Save checkpoints for repeated experiments
const checkpoint = await game.save();
// Later: restore to this point
await game.restore(checkpoint);
```

## Future Architecture Considerations

### Distributed Execution

For large-scale experiments:
- Queue system for experiment jobs
- Workers running on separate machines
- Central results aggregation

### Real-time Visualization

Web UI showing:
- Live agent reasoning
- Game state visualization
- Comparative metrics dashboard

### Agent Learning/Memory

Persistent agent state:
- Cross-game knowledge transfer
- Strategy refinement over time
- Learned heuristics

---

This architecture balances **simplicity** (easy to understand), **flexibility** (easy to extend), and **power** (enables complex experiments).
