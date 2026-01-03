import { IFGame, CommandResult, GameState } from '@if-gym/core';

/**
 * Base class for game interpreters
 */
export abstract class BaseInterpreter implements IFGame {
  protected state: GameState = {
    turnNumber: 0,
    history: [],
    isEnded: false,
  };

  abstract load(gameFile: string | Buffer): Promise<void>;
  abstract start(): Promise<string>;
  abstract executeCommand(command: string): Promise<CommandResult>;

  getState(): GameState {
    return { ...this.state };
  }

  async reset(): Promise<void> {
    this.state = {
      turnNumber: 0,
      history: [],
      isEnded: false,
    };
  }

  abstract save(): Promise<Buffer>;
  abstract restore(saveData: Buffer): Promise<void>;

  async dispose(): Promise<void> {
    // Override in subclasses if cleanup needed
  }
}
