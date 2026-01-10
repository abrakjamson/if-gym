import { BaseInterpreter } from './base.js';
import { CommandResult } from '@if-gym/core';
import * as fs from 'fs';
// @ts-ignore
import ifvms from 'ifvms';
// @ts-ignore
import GlkOte from 'glkote-term';

export class IFVMSAdapter extends BaseInterpreter {
  private vm: any;
  private glk: any;
  private glkOte: any;
  private glkOptions: any;
  private outputBuffer: string = '';
  private inputResolver: ((output: string) => void) | null = null;
  private isRunning: boolean = false;
  private currentWindowId: number | null = null;
  private pendingInputType: 'line' | 'char' | null = null;
  private generation: number = 0;
  private keepAliveTimer: NodeJS.Timeout | null = null;

  constructor(_options: { gamePath?: string } = {}) {
    super();
  }

  async load(gameFile: string | Buffer): Promise<void> {
    const buffer = typeof gameFile === 'string' ? fs.readFileSync(gameFile) : gameFile;
    const ZVM = ifvms.ZVM;
    this.vm = new ZVM();
    this.glk = GlkOte.Glk;

    const self = this;
    this.glkOte = {
      init: (options: any) => {
        this.glkOptions = options;
        setImmediate(() => {
          if (options.accept) {
            options.accept({
              type: 'init',
              gen: 0,
              metrics: {
                width: 80, height: 24,
                outspacingx: 0, outspacingy: 0,
                inspacingx: 0, inspacingy: 0,
                buffercharwidth: 1, buffercharheight: 1,
                buffermarginx: 0, buffermarginy: 0,
                gridcharwidth: 1, gridcharheight: 1,
                gridmarginx: 0, gridmarginy: 0,
              }
            });
          }
        });
      },
      update: (data: any) => {
        self.handleUpdate(data);
      },
      log: (_msg: string) => {},
      warning: (_msg: string) => {},
      error: (msg: string) => {
        console.error('IFVMS Error:', msg);
      }
    };

    const options = {
      vm: this.vm,
      Dialog: { 
        open: (_ctx: any, callback: any) => callback(null),
        save: (_ctx: any, _content: any, callback: any) => callback(null)
      },
      Glk: this.glk,
      GlkOte: this.glkOte,
    };

    this.vm.prepare(buffer, options);
  }

  async start(): Promise<string> {
    this.keepAliveTimer = setInterval(() => {}, 1000);

    return new Promise((resolve, reject) => {
      this.inputResolver = resolve;
      this.isRunning = true;
      
      const options = {
        vm: this.vm,
        Dialog: { 
            open: (_ctx: any, callback: any) => callback(null),
            save: (_ctx: any, _content: any, callback: any) => callback(null)
        },
        Glk: this.glk,
        GlkOte: this.glkOte,
      };

      try {
        this.glk.init(options);
      } catch (e) {
        if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
        reject(e);
      }
    });
  }

  async executeCommand(command: string): Promise<CommandResult> {
    if (!this.isRunning) throw new Error('Game not running');

    this.state.history.push({
      turnNumber: this.state.turnNumber++,
      command: command,
      response: '',
      timestamp: new Date()
    });

    return new Promise((resolve) => {
        this.inputResolver = (output) => {
            const lastEntry = this.state.history[this.state.history.length - 1];
            if (lastEntry) lastEntry.response = output;
            resolve({ output, gameEnded: this.state.isEnded });
        };

        if (this.currentWindowId !== null && this.glkOptions?.accept) {
             if (this.pendingInputType === 'char') {
                 // For char input, we send just the first character or a space
                 const val = command.length > 0 ? command[0] : ' ';
                 this.glkOptions.accept({
                    type: 'char',
                    window: this.currentWindowId,
                    value: val,
                    gen: this.generation
                });
             } else {
                 this.glkOptions.accept({
                    type: 'line',
                    window: this.currentWindowId,
                    value: command,
                    gen: this.generation
                });
             }
        }
    });
  }

  private handleUpdate(data: any) {
    if (data.gen !== undefined) this.generation = data.gen;
    if (data.disable) this.state.isEnded = true;

    if (data.content) {
        for (const content of data.content) {
            if (content.text) {
                for (const line of content.text) {
                    if (line.content) {
                        for (let i = 0; i < line.content.length; i++) {
                            const part = line.content[i];
                            if (typeof part === 'string' && i % 2 === 1) {
                                this.outputBuffer += part;
                            } else if (typeof part === 'object' && part.text) {
                                this.outputBuffer += part.text;
                            }
                        }
                        this.outputBuffer += '\n';
                    } else if (typeof line === 'string') {
                        this.outputBuffer += line + '\n';
                    }
                }
            } else if (content.lines) {
                // Grid window (status bar)
                for (const line of content.lines) {
                    if (line.content) {
                        for (const part of line.content) {
                            if (part.text) this.outputBuffer += part.text;
                        }
                        this.outputBuffer += '\n';
                    }
                }
            }
        }
    }
    
    if (data.input && data.input.length > 0) {
        const inputReq = data.input.find((i: any) => i.type === 'line' || i.type === 'char');
        if (inputReq) {
            this.currentWindowId = inputReq.id;
            this.pendingInputType = inputReq.type;
            
            if (this.inputResolver) {
                const output = this.outputBuffer.trim();
                this.outputBuffer = '';
                const resolver = this.inputResolver;
                this.inputResolver = null;
                resolver(output);
            }
        }
    }
  }

  async dispose(): Promise<void> {
      if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
      this.isRunning = false;
  }

  async save(): Promise<Buffer> { return Buffer.from(''); }
  async restore(_saveData: Buffer): Promise<void> {}
}