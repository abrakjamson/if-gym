import { BaseAgent, AgentConfig, AgentAction, GameState } from '@if-gym/core';
import { RandomModel } from '@if-gym/models';

/**
 * Simple random agent for testing
 * Tries random common IF commands via RandomModel
 */
export class RandomAgent extends BaseAgent {
  readonly id: string;
  readonly name: string;
  private model: RandomModel;

  constructor(config: Partial<AgentConfig> = {}) {
    super();
    this.id = config.id || 'random-agent';
    this.name = config.name || 'Random Agent';
    this.model = new RandomModel();
  }

  async initialize(_initialOutput: string): Promise<void> {
    await this.reset();
  }

  async act(_state: GameState): Promise<AgentAction> {
    return this.model.generateAction('', '');
  }
}
