/**
 * Core types for the IF Gym framework
 */

/**
 * Represents a turn in an interactive fiction game
 */
export interface GameTurn {
  /** The turn number (starts at 1) */
  turnNumber: number;
  /** The command executed by the agent */
  command: string;
  /** The game's response to the command */
  response: string;
  /** Timestamp when the turn was executed */
  timestamp: Date;
}

/**
 * Represents the state of a game session
 */
export interface GameState {
  /** Current turn number */
  turnNumber: number;
  /** Complete history of turns */
  history: GameTurn[];
  /** Whether the game has ended (won, lost, or quit) */
  isEnded: boolean;
  /** Game-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Result of executing a command in the game
 */
export interface CommandResult {
  /** The output text from the game */
  output: string;
  /** Whether the game has ended */
  gameEnded: boolean;
  /** Optional score (if game supports scoring) */
  score?: number;
  /** Optional move count */
  moves?: number;
}

/**
 * Agent's reasoning about what action to take
 */
export interface AgentReasoning {
  /** Internal thoughts/reasoning process */
  thoughts: string;
  /** Confidence level in the chosen action (0-1) */
  confidence?: number;
  /** Alternative actions considered */
  alternatives?: string[];
}

/**
 * Result from an agent deciding on an action
 */
export interface AgentAction {
  /** The command to execute */
  command: string;
  /** Optional reasoning trace */
  reasoning?: AgentReasoning;
}

/**
 * Metrics for evaluating agent performance
 */
export interface PerformanceMetrics {
  /** Total number of turns */
  totalTurns: number;
  /** Whether the agent completed the objective */
  success: boolean;
  /** Final score (if applicable) */
  finalScore?: number;
  /** Number of unique commands tried */
  uniqueCommands: number;
  /** Commands per minute (efficiency) */
  commandsPerMinute?: number;
  /** Custom metrics */
  custom?: Record<string, number>;
}
