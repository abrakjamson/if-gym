import { IFModel, AgentAction } from '@if-gym/core';

export class RandomModel implements IFModel {
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

  constructor(id: string = 'random-model', name: string = 'Random Model') {
    this.id = id;
    this.name = name;
  }

  async generateAction(_instructions: string, _input: string, _tools?: any[], _onToolCall?: (toolCall: any) => Promise<any>): Promise<AgentAction> {
    const command =
      this.commonCommands[Math.floor(Math.random() * this.commonCommands.length)];

    return {
      command,
      reasoning: {
        thoughts: 'Randomly selected command from heuristics',
        confidence: 0.1,
      },
    };
  }
}
