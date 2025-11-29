import { BaseAgent, AgentAction, GameState, AgentConfig } from '@if-gym/core';

/**
 * Simple random agent for testing
 * Tries random common IF commands
 */
export class RandomAgent extends BaseAgent {
  readonly id: string;
  readonly name: string;

  private commonCommands = [
    'look',
    'inventory',
    'north',
    'south',
    'east',
    'west',
    'up',
    'down',
    'take lamp',
    'open door',
    'examine room',
  ];

  constructor(config: Partial<AgentConfig> = {}) {
    super();
    this.id = config.id || 'random-agent';
    this.name = config.name || 'Random Agent';
  }

  async initialize(initialOutput: string): Promise<void> {
    await this.reset();
  }

  async act(state: GameState): Promise<AgentAction> {
    const command =
      this.commonCommands[Math.floor(Math.random() * this.commonCommands.length)];

    return {
      command,
      reasoning: {
        thoughts: 'Randomly selected command',
        confidence: 0.1,
      },
    };
  }
}
