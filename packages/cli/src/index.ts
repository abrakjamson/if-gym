#!/usr/bin/env node

/**
 * @if-gym/cli - Command-line interface
 */

import { Command } from 'commander';
import { GameSession } from '@if-gym/core';
import { IFVMSAdapter } from '@if-gym/interpreters';
import { RandomAgent, OpenAIAgent } from '@if-gym/agents';
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
  .option('-a, --agent <name>', 'Agent to use (random, openai, gpt-4)', 'random')
  .option('-m, --model <name>', 'Model name for OpenAI agent', 'gpt-4')
  .option('--turns <number>', 'Maximum turns', '100')
  .option('--verbose', 'Enable verbose logging', false)
  .option('--log', 'Output full gameplay to console', false)
  .action(async (options) => {
    let game;
    try {
      const gamePath = path.resolve(options.game);
      
      // Initialize Game
      game = new IFVMSAdapter();
      await game.load(gamePath);
      
      // Initialize Agent
      let agent;
      const agentType = options.agent.toLowerCase();
      
      if (agentType.includes('openai') || agentType.includes('gpt')) {
          agent = new OpenAIAgent({
              id: 'openai',
              name: 'OpenAI Agent',
              model: options.model,
              apiKey: process.env.OPENAI_API_KEY
          });
      } else {
          agent = new RandomAgent();
      }
      
      // Run Session
      const session = new GameSession(game, agent, {
          maxTurns: parseInt(options.turns, 10),
          verbose: options.verbose || options.log
      });
      
      console.log(`Starting session with agent ${agent.name} on ${path.basename(gamePath)}...`);
      const result = await session.run();
      
      console.log(`\nSession finished.`);
      console.log(`Turns: ${result.turns}`);
      console.log(`Metrics:`);
      console.table(result.metrics);
      
      if (result.error) {
          console.error(`Error: ${result.error}`);
          process.exit(1);
      }
    } catch (error: unknown) {
      console.error('Fatal Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    } finally {
      if (game) {
        await game.dispose();
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