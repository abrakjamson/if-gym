import { IFModel, AgentAction } from '@if-gym/core';
import OpenAI from 'openai';

export interface OpenAIModelConfig {
  id?: string;
  name?: string;
  model?: string;
  apiKey?: string;
}

export class OpenAIModel implements IFModel {
  readonly id: string;
  readonly name: string;
  private client: OpenAI;
  private model: string;

  constructor(config: OpenAIModelConfig = {}) {
    this.id = config.id || 'openai-model';
    this.name = config.name || 'OpenAI Model';
    this.model = config.model || 'gpt-5.2';

    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is required for OpenAIModel');
    }

    this.client = new OpenAI({ apiKey });
  }

  private extractJson(text: string): any {
    try {
      return JSON.parse(text);
    } catch {
      // Try to find JSON block
      const match = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/{[\s\S]*}/);
      if (match) {
        try {
          return JSON.parse(match[1] || match[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  async generateAction(
    instructions: string, 
    input: string, 
    tools?: any[], 
    onToolCall?: (toolCall: any) => Promise<any>
  ): Promise<AgentAction> {
    try {
      let body: any = {
        model: this.model,
        instructions: instructions,
        input: input,
      };

      if (tools && tools.length > 0) {
        body.tools = tools;
      } else {
        body.text = {
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
        };
      }

      let response = await (this.client as any).responses.create(body);

      // Loop to handle tool calls if model provides them and we have a handler
      const maxToolLoops = 5;
      let loops = 0;

      while (
        loops < maxToolLoops && 
        response.status === 'completed' && 
        response.output && 
        response.output.some((item: any) => item.type.endsWith('_call')) &&
        onToolCall
      ) {
        loops++;
        const toolOutputs = [];

        for (const item of response.output) {
          if (item.type.endsWith('_call')) {
            const toolResult = await onToolCall(item);
            if (toolResult) {
              toolOutputs.push(toolResult);
            }
          }
        }

        if (toolOutputs.length > 0) {
          // Continue the conversation with tool outputs
          response = await (this.client as any).responses.create({
            model: this.model,
            previous_response_id: response.id,
            input: toolOutputs
          });
        } else {
          break;
        }
      }

      // Final response processing
      let command = '';
      let thoughts = '';
      
      if (response.output_text) {
          const parsed = this.extractJson(response.output_text);
          if (parsed) {
              command = parsed.command || '';
              thoughts = parsed.thoughts || '';
          } else {
              command = response.output_text.trim();
          }
      }

      // If we still have tool calls in the final response (e.g. function calls)
      const functionCall = response.output?.find((item: any) => item.type === 'function_call');
      if (functionCall && functionCall.arguments) {
          const parsed = this.extractJson(functionCall.arguments);
          if (parsed) {
            command = parsed.command || command;
            thoughts = parsed.thoughts || thoughts;
          }
      }

      return {
        command: command,
        reasoning: {
          thoughts: thoughts,
          confidence: 1.0
        },
        metadata: {
          output: response.output,
          output_text: response.output_text,
          response_id: response.id
        }
      };
    } catch (error) {
      console.error('Error in OpenAI model:', error);
      throw error;
    }
  }
}
