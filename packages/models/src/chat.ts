import { IFModel, AgentAction } from '@if-gym/core';
import OpenAI from 'openai';

export interface ChatModelConfig {
  id?: string;
  name?: string;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  debug?: boolean;
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
  private debug: boolean;

  constructor(config: ChatModelConfig = {}) {
    this.id = config.id || 'chat-model';
    this.name = config.name || 'Chat Model';
    this.model = config.model || 'model-identifier';
    this.debug = config.debug || true;

    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || 'not-needed',
      baseURL: config.baseUrl
    });
  }

  private extractJson(text: string): any {
    if (!text) return null;
    let cleaned = text.trim();
    try {
      return JSON.parse(cleaned);
    } catch (e) {}

    const mdMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (mdMatch) {
      try {
        return JSON.parse(mdMatch[1]);
      } catch (e) {}
    }

    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        const potentialJson = cleaned.substring(start, end + 1);
        return JSON.parse(potentialJson);
      } catch (e) {}
    }
    return null;
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

      // Final response format schema
      const finalResponseFormat: any = {
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

      const body: any = {
        model: this.model,
        messages: messages,
        temperature: 0.7,
      };

      // CRITICAL: If we have tools, do NOT send response_format in the first call.
      // This allows the model to choose between calling a tool or returning text.
      // Forcing a JSON schema on the text often disables tool-calling in local providers.
      if (tools && tools.length > 0) {
        body.tools = tools.map(t => {
            if (t.type === 'apply_patch') {
                return {
                    type: 'function',
                    function: {
                        name: 'apply_patch',
                        description: 'Apply a unified diff patch to a file. Call this BEFORE providing your final JSON command if you need to update memory.',
                        parameters: {
                            type: 'object',
                            properties: {
                                path: { type: 'string', description: 'The file to patch (e.g. goals.md)' },
                                diff: { type: 'string', description: 'The unified diff content' }
                            },
                            required: ['path', 'diff']
                        }
                    }
                };
            }
            return t;
        });
        body.tool_choice = 'auto';
      } else {
        body.response_format = finalResponseFormat;
      }

      if (this.debug) {
          console.log(`\n--- ChatModel Initial Request ---`);
          console.log(`Model: ${this.model}`);
          console.log(`Tools: ${body.tools ? body.tools.length : 0} defined`);
          console.log(`Enforcing JSON Schema: ${!!body.response_format}`);
      }

      let response = await this.client.chat.completions.create(body);

      const maxToolLoops = 5;
      let loops = 0;
      const allToolCalls: any[] = [];

      while (
        loops < maxToolLoops && 
        response.choices[0].message.tool_calls && 
        response.choices[0].message.tool_calls.length > 0 &&
        onToolCall
      ) {
        loops++;
        const assistantMessage: any = response.choices[0].message;
        messages.push(assistantMessage);

        if (this.debug) {
            const count = assistantMessage.tool_calls ? assistantMessage.tool_calls.length : 0;
            console.log(`ChatModel: Loop ${loops} - Model requested ${count} tools.`);
        }

        const toolCalls = assistantMessage.tool_calls || [];
        for (const toolCall of toolCalls) {
          const tc = toolCall as any;
          const normalizedCall: any = {
              type: tc.function?.name === 'apply_patch' ? 'apply_patch_call' : 'function_call',
              call_id: tc.id,
              name: tc.function?.name,
              arguments: tc.function?.arguments,
          };

          if (tc.function?.name === 'apply_patch' && tc.function.arguments) {
              const parsed = this.extractJson(tc.function.arguments);
              if (parsed) normalizedCall.operation = parsed;
          }

          allToolCalls.push(normalizedCall);
          const toolResult = await onToolCall(normalizedCall);
          
          if (toolResult) {
              if (this.debug) console.log(`ChatModel: Sending tool result for ${normalizedCall.name}`);
              messages.push({
                  role: 'tool',
                  tool_call_id: tc.id,
                  content: typeof toolResult.output === 'string' ? toolResult.output : JSON.stringify(toolResult)
              });
          }
        }

        // After tools are processed, we now WANT the final JSON command.
        // We add the response_format here to ensure the model follows the schema in its final reply.
        response = await this.client.chat.completions.create({
          model: this.model,
          messages: messages,
          response_format: finalResponseFormat
        });
      }

      const finalMessage = response.choices[0].message;
      const content = finalMessage.content || '';
      
      if (this.debug) {
          console.log(`--- ChatModel Final Response ---`);
          console.log(content);
          console.log(`-------------------------------\n`);
      }

      let command = '';
      let thoughts = '';
      
      const parsed = this.extractJson(content);
      if (parsed) {
          command = parsed.command || '';
          thoughts = parsed.thoughts || '';
      } else {
          command = content.trim();
      }

      return {
        command: command,
        reasoning: {
          thoughts: thoughts,
          confidence: 1.0
        },
        metadata: {
          output: allToolCalls,
          output_text: content,
          response: response
        }
      };
    } catch (error) {
      console.error('Error in Chat model:', error);
      throw error;
    }
  }
}