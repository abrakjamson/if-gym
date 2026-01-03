import { AgentAction, GameState, PerformanceMetrics } from './types.js';

/**
 * Interface for AI agents that play interactive fiction games
 */
export interface IFAgent {
  /**
   * Agent's unique identifier
   */
  readonly id: string;

  /**
   * Human-readable name for the agent
   */
  readonly name: string;

  /**
   * Initialize the agent for a new game session
   * @param initialOutput - The opening text from the game
   */
  initialize(initialOutput: string): Promise<void>;

  /**
   * Decide on the next action given the current game state
   * @param state - Current state of the game
   * @returns The action to take
   */
  act(state: GameState): Promise<AgentAction>;

  /**
   * Update the agent with the result of its last action
   * @param command - The command that was executed
   * @param result - The output from the game
   */
  observe(command: string, result: string): Promise<void>;

  /**
   * Reset the agent's internal state
   */
  reset(): Promise<void>;

  /**
   * Get performance metrics for the current session
   */
  getMetrics(): Promise<PerformanceMetrics>;
}

/**
 * Configuration for creating an agent instance
 */
export interface AgentConfig {
  /** Agent's unique identifier */
  id: string;
  /** Agent's display name */
  name: string;
  /** API key for LLM service (if applicable) */
  apiKey?: string;
  /** Model name (e.g., "gpt-4", "claude-3.5-sonnet") */
  model?: string;
  /** Maximum context length */
  maxContextLength?: number;
  /** Enable reasoning traces */
  captureReasoning?: boolean;
  /** Custom configuration */
  custom?: Record<string, unknown>;
}

/**
 * Base class for implementing IF agents
 */
export abstract class BaseAgent implements IFAgent {
  abstract readonly id: string;
  abstract readonly name: string;

  protected turnCount: number = 0;
  protected commandHistory: string[] = [];

  abstract initialize(initialOutput: string): Promise<void>;
  abstract act(state: GameState): Promise<AgentAction>;

  async observe(command: string, _result: string): Promise<void> {
    this.turnCount++;
    this.commandHistory.push(command);
  }

  async reset(): Promise<void> {
    this.turnCount = 0;
    this.commandHistory = [];
  }

  async getMetrics(): Promise<PerformanceMetrics> {
    return {
      totalTurns: this.turnCount,
      success: false, // Subclasses should override
      uniqueCommands: new Set(this.commandHistory).size,
    };
  }
}
