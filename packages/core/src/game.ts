import { CommandResult, GameState } from './types.js';

/**
 * Interface for interactive fiction game engines
 *
 * Adapters for different IF engines (ifvms, frotz, etc.) implement this interface
 */
export interface IFGame {
  /**
   * Load a game file
   * @param gameFile - Path to the game file or buffer
   */
  load(gameFile: string | Buffer): Promise<void>;

  /**
   * Start a new game session
   * @returns Initial game output
   */
  start(): Promise<string>;

  /**
   * Execute a command in the game
   * @param command - The text command to execute
   * @returns Result of the command
   */
  executeCommand(command: string): Promise<CommandResult>;

  /**
   * Get the current game state
   */
  getState(): GameState;

  /**
   * Reset the game to initial state
   */
  reset(): Promise<void>;

  /**
   * Save the current game state
   * @returns Serialized game state
   */
  save(): Promise<Buffer>;

  /**
   * Restore a saved game state
   * @param saveData - Previously saved game state
   */
  restore(saveData: Buffer): Promise<void>;

  /**
   * Clean up resources
   */
  dispose(): Promise<void>;
}

/**
 * Configuration for creating a game instance
 */
export interface GameConfig {
  /** Path to the game file */
  gamePath: string;
  /** Maximum number of turns before timeout */
  maxTurns?: number;
  /** Enable verbose logging */
  verbose?: boolean;
}
