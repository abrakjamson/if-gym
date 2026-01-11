import { AgentAction } from './types.js';

/**
 * Interface for Model providers (LLMs, Heuristics, etc.)
 */
export interface IFModel {
  readonly id: string;
  readonly name: string;

  /**
   * Generate an action based on instructions and input
   * @param instructions - System level instructions/prompt
   * @param input - The current context/turn input
   * @param tools - Optional tools the model can use
   * @param onToolCall - Optional callback to handle tool calls and continue generation
   */
  generateAction(
    instructions: string, 
    input: string, 
    tools?: any[], 
    onToolCall?: (toolCall: any) => Promise<any>
  ): Promise<AgentAction>;
}
