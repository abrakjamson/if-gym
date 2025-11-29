#!/usr/bin/env node

/**
 * @if-gym/cli - Command-line interface
 */

import { Command } from 'commander';

const program = new Command();

program
  .name('if-gym')
  .description('AI agent framework for playing interactive fiction games')
  .version('0.1.0');

program
  .command('play')
  .description('Run an agent on a game')
  .option('-g, --game <path>', 'Path to game file')
  .option('-a, --agent <name>', 'Agent to use')
  .action((options) => {
    console.log('Playing game:', options.game);
    console.log('Using agent:', options.agent);
    console.log('\nNOTE: Full implementation coming soon!');
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
