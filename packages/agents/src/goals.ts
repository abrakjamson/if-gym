import { BaseAgent, AgentConfig, AgentAction, GameState, IFModel } from '@if-gym/core';

export interface GoalsAgentConfig extends Partial<AgentConfig> {
  modelInstance: IFModel;
}

export class GoalsAgent extends BaseAgent {
  readonly id: string;
  readonly name: string;
  private modelInstance: IFModel;
  private goalsMarkdown: string;
  private gameStartOutput: string = "";

  constructor(config: GoalsAgentConfig) {
    super();
    this.id = config.id || `goals-${config.modelInstance.id}`;
    this.name = config.name || `Goals Agent (${config.modelInstance.name})`;
    this.modelInstance = config.modelInstance;
    
    this.goalsMarkdown = `# Tasks
- Explore the surroundings

# Inventory with notes
- None

# Clues
- None
`;
  }

  async initialize(initialOutput: string): Promise<void> {
    await this.reset();
    this.gameStartOutput = initialOutput;
  }

  private applyPatchResiliently(current: string, diffText: string): string {
    if (!diffText.includes('@@') && !diffText.includes('\n+') && !diffText.includes('\n-')) {
        return diffText;
    }

    const lines = current.split('\n');
    const diffLines = diffText.split('\n');
    const result: string[] = [];
    
    let i = 0;
    while (i < diffLines.length && (diffLines[i].startsWith('---') || diffLines[i].startsWith('+++') || diffLines[i].startsWith('Index:'))) {
        i++;
    }

    let currentOriginalLine = 0;
    for (; i < diffLines.length; i++) {
        const line = diffLines[i];
        if (line.startsWith('@@')) continue;
        
        if (line.startsWith('+')) {
            result.push(line.substring(1));
        } else if (line.startsWith('-')) {
            const toRemove = line.substring(1).trim();
            while (currentOriginalLine < lines.length && lines[currentOriginalLine].trim() !== toRemove) {
                result.push(lines[currentOriginalLine]);
                currentOriginalLine++;
            }
            if (currentOriginalLine < lines.length) {
                currentOriginalLine++;
            }
        } else {
            const context = line.startsWith(' ') ? line.substring(1).trim() : line.trim();
            if (context === '') {
                if (currentOriginalLine < lines.length && lines[currentOriginalLine].trim() === '') {
                    result.push(lines[currentOriginalLine]);
                    currentOriginalLine++;
                }
                continue;
            }
            
            while (currentOriginalLine < lines.length && lines[currentOriginalLine].trim() !== context) {
                result.push(lines[currentOriginalLine]);
                currentOriginalLine++;
            }
            if (currentOriginalLine < lines.length) {
                result.push(lines[currentOriginalLine]);
                currentOriginalLine++;
            }
        }
    }
    
    while (currentOriginalLine < lines.length) {
        result.push(lines[currentOriginalLine]);
        currentOriginalLine++;
    }

    return result.join('\n');
  }

  async act(state: GameState): Promise<AgentAction> {
    const lastTurn = state.history.length > 0 ? state.history[state.history.length - 1] : null;
    
    const prompt = `Game Start:
${this.gameStartOutput}

Current Goals (goals.md):
\`\`\`markdown
${this.goalsMarkdown}
\`\`\`

Current Situation:
${lastTurn ? lastTurn.response : "The game has just started."} 

Task:
1. Review the current situation and your goals.md.
2. If needed, update goals.md using the apply_patch tool.
3. Provide your next game command as a JSON object in your final response: {"thoughts": "...", "command": "...", "confidence": 0.9}`;

    const instructions = `You are an expert player of interactive fiction games.
You maintain a "goals.md" document to track tasks, inventory, and clues.

# goals.md Structure:
1. # Tasks
2. # Inventory with notes
3. # Clues

# Your Workflow:
1. Use the "apply_patch" tool to update goals.md. Use valid unified diff format.
2. ALWAYS provide your next game command in JSON format: {"thoughts": "...", "command": "...", "confidence": 0.9}

When using apply_patch:
- Use "goals.md" for the path.
- In the "diff" parameter, include hunk range information (@@ -1,10 +1,10 @@).`;

    const tools = [{ type: 'apply_patch' }];

    const handleToolCall = async (toolCall: any) => {
        if (toolCall.type === 'apply_patch_call' && toolCall.operation) {
            const op = toolCall.operation;
            if (op.path === 'goals.md') {
                try {
                    if (op.diff) {
                        this.goalsMarkdown = this.applyPatchResiliently(this.goalsMarkdown, op.diff);
                    } else if (op.content) {
                        this.goalsMarkdown = op.content;
                    }
                    return {
                        type: 'apply_patch_call_output',
                        call_id: toolCall.call_id,
                        status: 'completed',
                        output: 'Successfully updated goals.md'
                    };
                } catch (e: any) {
                    return {
                        type: 'apply_patch_call_output',
                        call_id: toolCall.call_id,
                        status: 'failed',
                        output: `Error applying patch: ${e.message}`
                    };
                }
            }
        }
        return null;
    };

    try {
      const action = await this.modelInstance.generateAction(instructions, prompt, tools, handleToolCall);
      
      if (action.reasoning) {
          action.reasoning.thoughts += `\n\n[goals.md state]\n${this.goalsMarkdown}`;
      }
      
      return action;
    } catch (error) {
      console.error('Error in GoalsAgent:', error);
      return {
        command: 'look',
        reasoning: {
          thoughts: 'Error occurred in model, falling back to look',
          confidence: 0
        }
      };
    }
  }

  async getMetrics() {
      const metrics = await super.getMetrics();
      return {
          ...metrics,
          goals_length: this.goalsMarkdown.length
      };
  }
}