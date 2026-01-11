import { IFGame } from './game.js';
import { IFAgent } from './agent.js';
import { GameTurn, PerformanceMetrics } from './types.js';
import { Logger } from './logger.js';

/**
 * Configuration for a game session
 */
export interface SessionConfig {
  /** Maximum number of turns before ending */
  maxTurns?: number;
  /** Timeout in milliseconds per turn */
  turnTimeout?: number;
  /** Save game state after each turn */
  saveHistory?: boolean;
  /** Verbose logging */
  verbose?: boolean;
  /** Logger instance */
  logger?: Logger;
}

/**
 * Result of running a game session
 */
export interface SessionResult {
  /** Whether the session completed successfully */
  success: boolean;
  /** Total number of turns executed */
  turns: number;
  /** Complete turn history */
  history: GameTurn[];
  /** Performance metrics */
  metrics: PerformanceMetrics;
  /** Error message if session failed */
  error?: string;
}

/**
 * Manages a game session between an agent and a game
 */
export class GameSession {
  private game: IFGame;
  private agent: IFAgent;
  private config: SessionConfig;
  private history: GameTurn[] = [];
  private logger: Logger;

  constructor(game: IFGame, agent: IFAgent, config: SessionConfig = {}) {
    this.game = game;
    this.agent = agent;
    this.config = {
      maxTurns: 1000,
      turnTimeout: 30000, // 30 seconds
      saveHistory: true,
      verbose: false,
      ...config,
    };
    this.logger = this.config.logger || new Logger({ logToConsole: this.config.verbose });
  }

  /**
   * Run the game session
   */
  async run(): Promise<SessionResult> {
    try {
      // Start the game
      const initialOutput = await this.game.start();
      if (this.config.verbose) {
        this.logger.log(`\n--- Initial Output ---\n${initialOutput}\n-----------------------\n`);
      }
      await this.agent.initialize(initialOutput);

      let turnNumber = 0;

      while (turnNumber < (this.config.maxTurns || 1000)) {
        const state = this.game.getState();
        if (state.isEnded) break;
        
        turnNumber++;

        // Agent decides on action
        const action = await this.agent.act(state);

        if (this.config.verbose) {
          this.logger.log(`Turn ${turnNumber}: ${action.command}`);
          if (action.reasoning) {
            this.logger.log(`Reasoning: ${action.reasoning.thoughts}`);
          }
        }

        // Execute command in game
        const result = await this.game.executeCommand(action.command);

        // Record turn
        const turn: GameTurn = {
          turnNumber,
          command: action.command,
          response: result.output,
          timestamp: new Date(),
        };

        this.history.push(turn);

        // Update agent
        await this.agent.observe(action.command, result.output);

        if (this.config.verbose) {
          this.logger.log(`Response: ${result.output}\n`);
        }

        // Check if game ended
        if (result.gameEnded) {
          break;
        }
      }

      // Get final metrics
      const metrics = await this.agent.getMetrics();

      return {
        success: true,
        turns: turnNumber,
        history: this.history,
        metrics,
      };
    } catch (error) {
      return {
        success: false,
        turns: this.history.length,
        history: this.history,
        metrics: await this.agent.getMetrics(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get the current turn history
   */
  getHistory(): GameTurn[] {
    return [...this.history];
  }
}
