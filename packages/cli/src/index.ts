#!/usr/bin/env node

/**
 * @if-gym/cli - Command-line interface
 */

import { Command } from 'commander';
import { GameSession, Logger } from '@if-gym/core';
import { IFVMSAdapter } from '@if-gym/interpreters';
import { PromptCacheAgent, RandomAgent, GoalsAgent } from '@if-gym/agents';
import { OpenAIModel, RandomModel } from '@if-gym/models';
import * as path from 'path';
import 'dotenv/config';

const program = new Command();

program
  .name('if-gym')
  .description('AI agent framework for playing interactive fiction games')
  .version('0.1.0');

program
  .command('play')
  .description('Run an agent on a game')
  .requiredOption('-g, --game <path>', 'Path to game file')
  .option('-a, --agent <type>', 'Agent type (prompt-cache, goals, random)', 'prompt-cache')
  .option('-m, --model <type>', 'Model type (openai, random)', 'openai')
  .option('--model-name <name>', 'Specific model name (e.g. gpt-5.2)', 'gpt-5.2')
  .option('--turns <number>', 'Maximum turns', '100')
  .option('--verbose', 'Enable verbose logging', false)
  .option('--log', 'Output full gameplay to console', false)
  .option('--log-file <path>', 'Path to log file (defaults to ./logs/session-[timestamp].log)')
  .option('--no-console', 'Disable logging to console')
  .action(async (options) => {
    let game;
    let logger;
    try {
      const gamePath = path.resolve(options.game);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const logFilePath = options.logFile || path.join(process.cwd(), 'logs', `session-${timestamp}.log`);

      logger = new Logger({
        logToFile: true,
        logPath: logFilePath,
        logToConsole: options.console !== false,
        verbose: options.verbose || options.log
      });

      logger.log(`Session Configuration:`);
      logger.log(`- Game: ${gamePath}`);
      logger.log(`- Agent: ${options.agent}`);
      logger.log(`- Model: ${options.model}`);
      logger.log(`- Model Name: ${options.modelName}`);
      logger.log(`- Max Turns: ${options.turns}`);
      logger.log(`- Log File: ${logFilePath}`);
      logger.log(`- Date: ${new Date().toLocaleString()}`);
      logger.log(`----------------------------------------\n`);
      
      // Initialize Game
      game = new IFVMSAdapter();
      await game.load(gamePath);
      
      // Initialize Model
      let model;
      const modelType = options.model.toLowerCase();
      if (modelType === 'openai') {
          model = new OpenAIModel({
              model: options.modelName,
              apiKey: process.env.OPENAI_API_KEY
          });
      } else {
          model = new RandomModel();
      }

      // Initialize Agent
      let agent;
      const agentType = options.agent.toLowerCase();
      
      if (agentType === 'goals') {
          agent = new GoalsAgent({
              modelInstance: model
          });
      } else if (agentType === 'prompt-cache') {
          agent = new PromptCacheAgent({
              modelInstance: model
          });
      } else {
          agent = new RandomAgent();
      }
      
      // Run Session
      const session = new GameSession(game, agent, {
          maxTurns: parseInt(options.turns, 10),
          verbose: options.verbose || options.log,
          logger: logger
      });
      
      logger.log(`Starting session with agent ${agent.name} on ${path.basename(gamePath)}...`);
      const result = await session.run();
      
      logger.log(`\nSession finished.`);
      logger.log(`Turns: ${result.turns}`);
      logger.log(`Metrics:`);
      
      // Format metrics for logging
      if (options.console !== false) {
        console.table(result.metrics);
      }
      logger.log(JSON.stringify(result.metrics, null, 2));
      
      if (result.error) {
          logger.error(`Error: ${result.error}`);
          process.exit(1);
      }
    } catch (error: unknown) {
      if (logger) {
        logger.error(`Fatal Error: ${error instanceof Error ? error.message : String(error)}`);
      } else {
        console.error('Fatal Error:', error instanceof Error ? error.message : String(error));
      }
      process.exit(1);
    } finally {
      if (game) {
        await game.dispose();
      }
      if (logger) {
        logger.close();
      }
    }
  });

program
  .command('benchmark')
  .description('Run benchmark suite')
  .option('-s, --suite <name>', 'Benchmark suite to run')
  .action((options) => {
    console.log('Running benchmark:', options.suite);
    console.log('\nNOTE: Full implementation coming soon!');
  });

program.parse();