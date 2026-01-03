import { BaseAgent, AgentConfig, AgentAction, GameState } from '@if-gym/core';
import OpenAI from 'openai';

export class OpenAIAgent extends BaseAgent {
  readonly id: string;
  readonly name: string;
  private client: OpenAI;
  private model: string;
  private systemPrompt: string;
  private lastOutput: string = "";

  constructor(config: AgentConfig) {
    super();
    this.id = config.id || 'openai-agent';
    this.name = config.name || 'OpenAI Agent';
    this.model = config.model || 'gpt-4';
    
    if (!config.apiKey && !process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
    });

    this.systemPrompt = `You are an expert player of interactive fiction (text adventure) games.
Your goal is to explore the world, solve puzzles, and complete the game.

Follow these rules:
1. Analyze the current situation description carefully.
2. Check your inventory and available objects.
3. Plan your next move to advance the game state.
4. If you are stuck, try to explore new directions or examine objects more closely.
5. Avoid repeating unsuccessful commands.

You must respond with a JSON object containing:
- "thoughts": Your reasoning process, including analysis of the situation and why you chose the command.
- "command": The exact text command to send to the game (e.g., "go north", "take lamp", "examine box").
- "confidence": A number between 0 and 1 indicating how confident you are that this action is useful.

Example response:
{
  "thoughts": "I am in a dark room. I have a lamp. I should turn it on to see.",
  "command": "turn on lamp",
  "confidence": 0.9
}
`;
  }

  async initialize(initialOutput: string): Promise<void> {
    await this.reset();
    this.lastOutput = initialOutput;
  }

  async act(state: GameState): Promise<AgentAction> {
    // Construct context from history
    const historyLimit = 10; // Sliding window
    const recentTurns = state.history.slice(-historyLimit);
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: this.systemPrompt }
    ];

    let historyText = "";
    
    for (const turn of recentTurns) {
      historyText += `> ${turn.command}\n${turn.response}\n\n`;
    }
    
    if (historyText) {
        messages.push({ role: 'user', content: `Game History:\n${historyText}\n\nCurrent Situation:\n(Based on last response above)\n\nWhat is your next command?` });
    } else {
        // First turn
        messages.push({ role: 'user', content: `Game Start:\n${this.lastOutput}\n\nWhat is your next command?` });
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(content);
      
      return {
        command: parsed.command,
        reasoning: {
          thoughts: parsed.thoughts,
          confidence: parsed.confidence,
        }
      };

    } catch (error) {
      console.error('Error in OpenAI agent:', error);
      // Fallback
      return {
        command: 'look',
        reasoning: {
          thoughts: 'Error occurred, falling back to look',
          confidence: 0
        }
      };
    }
  }
  
  async observe(command: string, result: string): Promise<void> {
      await super.observe(command, result);
      this.lastOutput = result;
  }
}