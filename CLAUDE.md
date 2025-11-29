# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**IF Gym** is an AI agent framework for playing interactive fiction (text adventure) games. It provides a standardized environment for training, testing, and comparing LLM agents on complex reasoning tasks.

**Key Principle**: We're building an agent *framework*, not a game interpreter. We USE existing interpreters (ifvms.js, frotz) and focus on agent implementations and evaluation.

## Architecture

### Monorepo Structure

This is a pnpm workspace monorepo with five core packages:

- **`packages/core/`**: Core abstractions (Agent, Game, Session interfaces)
- **`packages/interpreters/`**: Adapters for game engines (ifvms, frotz, glulx)
- **`packages/agents/`**: LLM agent implementations (OpenAI, Anthropic, local models)
- **`packages/evaluators/`**: Metrics, scoring, analysis tools
- **`packages/cli/`**: Command-line interface for running experiments

**Critical**: The `core` package defines the contracts. All other packages implement these interfaces.

### Package Dependencies

```
@if-gym/cli → depends on → all packages
@if-gym/agents → depends on → @if-gym/core
@if-gym/interpreters → depends on → @if-gym/core
@if-gym/evaluators → depends on → @if-gym/core
```

Use `workspace:*` protocol in package.json for internal dependencies.

## Development Commands

### Project-wide Commands

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test

# Lint all TypeScript
pnpm lint

# Format all code
pnpm format

# Clean all build artifacts
pnpm clean
```

### Running Experiments

```bash
# Run an agent on a game
pnpm play --game games/zork1.z3 --agent gpt-4

# Run benchmark suite
pnpm benchmark --suite zork-opening

# Analyze results
pnpm --filter @if-gym/cli run analyze
```

## Implementation Strategy

### Primary Focus: Agent Quality

The value of this project is in **agent implementations** and **comparative analysis**, not in building interpreters. Always prefer:

1. **Use existing interpreters** - ifvms.js is production-ready (MIT license)
2. **Focus on agent prompting** - How to make LLMs good at IF
3. **Develop evaluation metrics** - What makes an agent successful?
4. **Analyze reasoning traces** - How do models think?
5. **Compare models** - GPT-4 vs Claude vs Llama

### When Implementing Agents

1. **Study the core interfaces** in `packages/core/src/agent.ts`
2. **Implement the IFAgent interface** with proper typing
3. **Enable reasoning capture** for analysis
4. **Test with simple games first** (Zork I opening)
5. **Measure performance metrics** (turns, success rate, efficiency)

### When Adding Interpreters

1. **Wrap existing interpreters** - Don't reimplement
2. **Implement the IFGame interface** from `packages/core/src/game.ts`
3. **Handle errors gracefully** - Games can crash or hang
4. **Support save/restore** for checkpointing
5. **Test with multiple games** - Different Z-machine versions

## Code Style & Standards

### TypeScript Configuration

- **Strict mode enabled**: All packages use `"strict": true`
- **Target**: ES2022 (modern JavaScript)
- **Module**: ESNext with bundler module resolution
- **Avoid `any`**: Use explicit types; `unknown` when type is truly unknown

### Naming Conventions

**Agents**: Use descriptive names reflecting the LLM
```typescript
// Good: Clear what model it uses
export class GPT4Agent extends BaseAgent { }
export class Claude35SonnetAgent extends BaseAgent { }

// Bad: Vague or unclear
export class SmartAgent extends BaseAgent { }
```

**Interpreters**: Use engine name + "Adapter"
```typescript
// Good: Clear which engine
export class IFVMSAdapter extends BaseInterpreter { }
export class FrotzAdapter extends BaseInterpreter { }

// Bad: Generic names
export class GameEngine implements IFGame { }
```

### Agent Prompting Best Practices

When implementing LLM agents:

```typescript
// Good: Structured prompt with clear instructions
const systemPrompt = `You are playing an interactive fiction game.
Your goal is to explore and solve puzzles.

Available commands: LOOK, INVENTORY, TAKE [item], GO [direction], etc.

Think step-by-step:
1. Analyze current situation
2. Consider available actions
3. Choose most promising action
4. Explain your reasoning

Respond in JSON:
{
  "thoughts": "your reasoning",
  "command": "your action",
  "confidence": 0.8
}`;

// Bad: Vague, unstructured
const systemPrompt = "Play the game and win";
```

### Testing Requirements

Every agent implementation should have:

1. **Unit tests** for agent initialization and basic behavior
2. **Integration tests** with a simple test game
3. **Reasoning validation** - Does it capture thoughts properly?
4. **Metrics validation** - Are performance stats accurate?

Example test structure:

```typescript
describe('GPT4Agent', () => {
  test('initializes with game context', async () => {
    const agent = new GPT4Agent({ apiKey: 'test' });
    await agent.initialize('You are in a room.');
    expect(agent).toBeDefined();
  });

  test('generates valid commands', async () => {
    const agent = new GPT4Agent({ apiKey: 'test' });
    const action = await agent.act(mockGameState);
    expect(action.command).toBeTruthy();
    expect(typeof action.command).toBe('string');
  });

  test('captures reasoning when enabled', async () => {
    const agent = new GPT4Agent({
      apiKey: 'test',
      captureReasoning: true
    });
    const action = await agent.act(mockGameState);
    expect(action.reasoning).toBeDefined();
    expect(action.reasoning?.thoughts).toBeTruthy();
  });
});
```

## Project Organization

### Directory Structure

```
if-gym/
├── packages/              # Implementation code
│   ├── core/             # Interfaces and base classes
│   ├── interpreters/     # Game engine adapters
│   ├── agents/           # LLM agent implementations
│   ├── evaluators/       # Metrics and analysis
│   └── cli/              # Command-line interface
├── games/                # Story files (.z3, .z5, .z8)
├── benchmarks/           # Benchmark definitions (JSON)
├── experiments/          # Results from runs
├── docs/                 # Documentation
└── README.md             # Project overview
```

### File Naming Conventions

- Agent implementations: `[model-name].ts` (e.g., `gpt4.ts`, `claude-sonnet.ts`)
- Adapters: `[engine]-adapter.ts` (e.g., `ifvms-adapter.ts`)
- Tests: `[name].test.ts` (co-located with source)
- Configs: `[name].config.ts` (e.g., `tsup.config.ts`)

## Common Pitfalls

### 1. Don't Rebuild Interpreters

```typescript
// Wrong: Implementing Z-machine from scratch
class MyZMachineInterpreter { /* ... */ }

// Right: Wrapping existing interpreter
import ifvms from 'ifvms';
class IFVMSAdapter extends BaseInterpreter {
  private engine = new ifvms.Engine();
  // Wrap the engine
}
```

### 2. Don't Hardcode API Keys

```typescript
// Wrong: Hardcoded secrets
const apiKey = 'sk-abc123...';

// Right: Environment variables
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error('OPENAI_API_KEY not set');
```

### 3. Don't Ignore Context Limits

```typescript
// Wrong: Sending entire game history
const context = state.history.map(t => t.response).join('\n');

// Right: Sliding window of recent turns
const recentTurns = state.history.slice(-10);
const context = recentTurns.map(t => `> ${t.command}\n${t.response}`).join('\n');
```

### 4. Don't Skip Error Handling

```typescript
// Wrong: Unhandled API failures
const response = await llm.complete(prompt);

// Right: Graceful degradation
try {
  const response = await llm.complete(prompt);
  return response;
} catch (error) {
  console.error('LLM API failed:', error);
  // Fallback to random/heuristic action
  return { command: 'look' };
}
```

## Experiment Methodology

### Running Experiments

1. **Define objective**: What are you testing?
2. **Choose games**: Which IF games to use?
3. **Configure agents**: Which models, what prompts?
4. **Run sessions**: Execute with consistent config
5. **Collect metrics**: Success rate, turns, reasoning quality
6. **Analyze results**: Compare models, identify patterns
7. **Document findings**: Save to `experiments/[date]-[name]/`

### Reproducibility

Always save:
- Agent configuration (model, prompt, params)
- Game file hash/version
- Complete turn history
- Reasoning traces
- Metrics and scores
- Environment info (Node version, package versions)

### Example Experiment Structure

```
experiments/
└── 2025-01-15-gpt4-vs-claude-zork1/
    ├── config.json           # Experiment configuration
    ├── results.json          # Aggregated results
    ├── traces/
    │   ├── gpt4-run1.json   # Full turn history
    │   ├── gpt4-run2.json
    │   ├── claude-run1.json
    │   └── claude-run2.json
    └── analysis.md           # Findings and insights
```

## Success Criteria

### Agent Quality Metrics

An effective IF agent should:
- **Explore efficiently** - Discover rooms/objects without excessive repetition
- **Solve puzzles logically** - Use tools correctly, understand cause/effect
- **Handle failure gracefully** - Try alternatives when stuck
- **Learn from context** - Use game feedback to inform decisions
- **Explain reasoning** - Provide interpretable thought processes

### Framework Quality Metrics

The framework should:
- **Make agent development easy** - Clear interfaces, good docs
- **Support diverse models** - Cloud and local LLMs
- **Enable fair comparison** - Consistent evaluation
- **Capture rich data** - Full reasoning traces
- **Be extensible** - Easy to add games, metrics, agents

## Git Workflow

### Commit Message Format

Use conventional commits:

```
feat(agents): implement GPT-4 agent with CoT prompting
fix(interpreters): handle ifvms save/restore errors
docs(readme): update quick start guide
test(agents): add Claude reasoning capture tests
exp(zork1): GPT-4 vs Claude comparison results
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `exp` (experiments)

## Project Philosophy

1. **Agent quality over interpreter complexity** - Use existing interpreters
2. **Comparative analysis is the goal** - How do models differ?
3. **Reasoning transparency matters** - Capture agent thoughts
4. **Resource efficiency is important** - Test local models too
5. **Reproducibility is essential** - Save everything
6. **IF is a perfect testbed** - Rich, diverse, challenging

## Questions & Support

- **Issues**: Use GitHub Issues for bugs/features
- **Experiments**: Share results in `experiments/` with PRs
- **Agent ideas**: Propose new agent strategies in Discussions

---

**Remember**: We're studying how AI agents reason, plan, and solve problems. The games are the environment; agent performance is the focus!
