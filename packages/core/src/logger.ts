import * as fs from 'fs';
import * as path from 'path';

export interface LoggerConfig {
  logToFile?: boolean;
  logPath?: string;
  logToConsole?: boolean;
  verbose?: boolean;
}

export class Logger {
  private config: LoggerConfig;
  private logStream: fs.WriteStream | null = null;

  constructor(config: LoggerConfig = {}) {
    this.config = {
      logToFile: true,
      logToConsole: true,
      verbose: false,
      ...config
    };

    if (this.config.logToFile && this.config.logPath) {
      const dir = path.dirname(this.config.logPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.logStream = fs.createWriteStream(this.config.logPath, { flags: 'a' });
    }
  }

  log(message: string): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message}`;

    if (this.config.logToConsole) {
      console.log(message);
    }

    if (this.logStream) {
      this.logStream.write(formattedMessage + '\n');
    }
  }

  info(message: string): void {
    this.log(`INFO: ${message}`);
  }

  error(message: string): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ERROR: ${message}`;

    if (this.config.logToConsole) {
      console.error(formattedMessage);
    }

    if (this.logStream) {
      this.logStream.write(formattedMessage + '\n');
    }
  }

  close(): void {
    if (this.logStream) {
      this.logStream.end();
    }
  }
}
