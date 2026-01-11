import { IFModel, AgentAction } from '@if-gym/core';
import OpenAI from 'openai';

export interface ChatModelConfig {
  id?: string;
  name?: string;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Model provider for standard OpenAI Chat Completions API.
 * Compatible with local hosts like LM Studio, Ollama, etc.
 */
export class ChatModel implements IFModel {
  readonly id: string;
  readonly name: string;
  private client: OpenAI;
  private model: string;

  constructor(config: ChatModelConfig = {}) {
    this.id = config.id || 'chat-model';
    this.name = config.name || 'Chat Model';
    this.model = config.model || 'model-identifier';

    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || 'not-needed',
      baseURL: config.baseUrl
    });
  }

  async generateAction(
    instructions: string, 
    input: string, 
    tools?: any[], 
    onToolCall?: (toolCall: any) => Promise<any>
  ): Promise<AgentAction> {
    try {
      const messages: any[] = [
        { role: 'system', content: instructions },
        { role: 'user', content: input }
      ];

      const body: any = {
        model: this.model,
        messages: messages,
        temperature: 0.7,
      };

      if (tools && tools.length > 0) {
        body.tools = tools.map(t => {
            if (t.type === 'apply_patch') {
                return {
                    type: 'function',
                    function: {
                        name: 'apply_patch',
                        description: 'Apply a unified diff patch to a file',
                        parameters: {
                            type: 'object',
                            properties: {
                                path: { type: 'string' },
                                diff: { type: 'string' }
                            },
                            required: ['path', 'diff']
                        }
                    }
                };
            }
            return t;
        });
      } else {
        // Use JSON schema mode which is more standard than json_object for many providers
        body.response_format = {
          type: 'json_schema',
          json_schema: {
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

      let response = await this.client.chat.completions.create(body);

      const maxToolLoops = 5;
      let loops = 0;

      while (
        loops < maxToolLoops && 
        response.choices[0].message.tool_calls && 
        response.choices[0].message.tool_calls.length > 0 &&
        onToolCall
      ) {
        loops++;
        const message = response.choices[0].message;
        messages.push(message);

        const toolCalls = message.tool_calls || [];
        for (const toolCall of toolCalls) {
          const tc = toolCall as any;
          const normalizedCall = {
              type: tc.type === 'function' ? 'function_call' : tc.type,
              call_id: tc.id,
              name: tc.function?.name,
              arguments: tc.function?.arguments,
              operation: tc.function?.name === 'apply_patch' ? JSON.parse(tc.function.arguments) : undefined
          };

          const toolResult = await onToolCall(normalizedCall);
          
          if (toolResult) {
              messages.push({
                  role: 'tool',
                  tool_call_id: tc.id,
                  content: typeof toolResult.output === 'string' ? toolResult.output : JSON.stringify(toolResult)
              });
          }
        }

        response = await this.client.chat.completions.create({
          model: this.model,
          messages: messages
        });
      }

      const finalMessage = response.choices[0].message;
      const content = finalMessage.content || '';
      
      let command = '';
      let thoughts = '';
      
      try {
          const parsed = JSON.parse(content);
          command = parsed.command || '';
          thoughts = parsed.thoughts || '';
      } catch {
          command = content.trim();
      }

      return {
        command: command,
        reasoning: {
          thoughts: thoughts,
          confidence: 1.0
        },
        metadata: {
          response: response
        }
      };
    } catch (error) {
      console.error('Error in Chat model:', error);
      throw error;
    }
  }
}
