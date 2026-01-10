import { BaseAgent, AgentConfig, AgentAction, GameState } from '@if-gym/core';
import OpenAI from 'openai';

export class OpenAIAgent extends BaseAgent {
  readonly id: string;
  readonly name: string;
  private client: OpenAI;
  private model: string;
  private systemPrompt: string;
  private gameStartOutput: string = "";

  constructor(config: AgentConfig) {
    super();
    this.id = config.id || 'openai-agent';
    this.name = config.name || 'OpenAI Agent';
    this.model = config.model || 'gpt-5.2';
    
    if (!config.apiKey && !process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
    });

    this.systemPrompt = `You are an expert player of interactive fiction (text adventure) games.
Your goal is to explore the world, solve puzzles, and complete the game.

# General Tips for Solving Interactive Fiction

### 1. Read the scene description with intent
- Slow down and treat every noun, verb, and detail as potentially meaningful.
- IF authors often hide clues in plain sight—adjectives, unusual phrasing, or environmental cues.

### 2. Take stock of your tools
- Check your inventory regularly and examine each item; many puzzles hinge on subtle item properties.
- Also note environmental “objects” that aren’t in your inventory but can be interacted with.

### 3. Think in small, testable actions
- Instead of planning a grand solution, break your next step into simple verbs: open, push, climb, examine, use, talk.
- Parser IF especially rewards incremental progress.

### 4. When stuck, widen the search radius
- Revisit earlier rooms, re-examine objects, and try basic commands like *look*, *examine*, *search*, *listen*, or *smell*.
- Many puzzles unlock only after noticing a detail you missed the first time.

### 5. Don't brute-force the parser
- If a command fails once or twice, rethink your approach rather than hammering synonyms.
- Reframe the problem: What am I actually trying to accomplish? What would make sense in-world?

### 6. Map your world—mentally or literally
- Even simple IF benefits from a rough map of rooms, exits, and key objects.
- This prevents wandering in circles and helps you spot overlooked connections.

### 7. Pay attention to feedback
- IF authors usually signal when you're on the right track with partial success messages, new descriptions, or subtle shifts in tone.
- Treat these as breadcrumbs.

# Response Format
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
    this.gameStartOutput = initialOutput;
  }

  async act(state: GameState): Promise<AgentAction> {
    // Construct context from history
    //const historyLimit = 10; // Sliding window
    //const recentTurns = state.history.slice(-historyLimit);
    const recentTurns = state.history
    
    let historyText = "";
    
    for (const turn of recentTurns) {
      historyText += `${turn.response}\n\n`;
    }
    
    try {
      const prompt = `Game Start:
${this.gameStartOutput}

${historyText ? `Recent History:
${historyText}` : ''}
What is your next command?`;

      const response = await (this.client as any).responses.create({
        model: this.model,
        instructions: this.systemPrompt,
        input: prompt,
        text: {
          format: {
            type: 'json_schema',
            name: 'agent_action',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                thoughts: { type: 'string' },
                command: { type: 'string' },
                confidence: { type: 'number' }
              },
              required: ['thoughts', 'command', 'confidence'],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.output_text;
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
}