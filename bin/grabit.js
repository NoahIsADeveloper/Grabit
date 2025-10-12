#!/usr/bin/env node

import { Command } from 'commander';
import { addPackage } from '../lib/add.js';
import { fetchPackage } from '../lib/fetch.js';
import { updatePackages } from '../lib/update.js';
import { statusPackages } from '../lib/status.js';

const program = new Command();

program
	.name('grabit')
	.description('Manage external project dependencies')
	.version('0.1.0');

program
	.command('add <repo>')
	.option('--branch <branch>', 'Branch to track', 'main')
	.action((repo, options) => addPackage(repo, options));

program
	.command('fetch <package>')
	.action((pkg) => fetchPackage(pkg));

program
	.command('update')
	.option('--all', 'Update all packages')
	.action((options) => updatePackages(options));

program
	.command('status')
	.action(() => statusPackages());

program
	.command('init')
	.description('Initialize a new grabit project')
	.action(() => import('../lib/init.js').then(m => m.initProject()));

program.parse();
