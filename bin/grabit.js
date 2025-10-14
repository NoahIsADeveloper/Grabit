#!/usr/bin/env node

import { Command } from 'commander';
import { fetchPackage } from '../lib/fetch.js';
import { statusPackages } from '../lib/status.js';

const program = new Command();

program
	.name('grabit')
	.description('Manage external project dependencies')
	.version('0.1.0');

program
	.command('add <repo>')
	.description('Add a package to grabit.toml using defaults or overrides')
	.option('--path <path>', 'Override default path for this add only')
	.option('--branch <branch>', 'Override default branch')
	.option('--include <patterns>', 'Comma-separated include patterns')
	.option('--cleanup <patterns>', 'Comma-separated cleanup patterns')
	.action((repo, options) => {
		import('../lib/add.js').then(mod => mod.addPackage(repo, options));
	});

program
	.command('fetch [package]')
	.description('Fetch a package or all with --all')
	.option('--all', 'Fetch all packages')
	.option('--path <path>', 'Override path for this fetch')
	.option('--branch <branch>', 'Override branch')
	.option('--include <patterns>', 'Comma-separated include paths')
	.option('--cleanup <patterns>', 'Comma-separated cleanup patterns')
	.action((pkg, options) => import('../lib/fetch.js')
		.then(mod => mod.fetchPackage(pkg, options)));

program
	.command('status')
	.action(() => statusPackages());

program
	.command('init')
	.description('Initialize a new grabit project')
	.action(() => import('../lib/init.js').then(m => m.initProject()));

program
	.command('remove <package>')
	.description('Remove a package and its included files')
	.action((pkgName) => import('../lib/remove.js').then(m => m.removePackage(pkgName)));

program
	.command('tweak <action> [package] [key] [value]')
	.description('Edit per-package settings in grabit.toml')
	.action((action, pkg, key, value) => {
		import('../lib/tweak.js').then(mod =>
			mod.handleTweak(action, pkg, key, value)
		);
	});

program
	.command('config <action> [key] [value]')
	.description('Manage grabit configuration (set/list/unset/reset)')
	.option('--local', 'Operate on project-local config (grabit.toml)')
	.option('--global', 'Operate on global config (~/.grabit/config.toml)')
	.option('--json', 'Print machine-readable JSON for list')
	.action((action, key, value, cmdObj) => {
		import('../lib/config.js').then(mod =>
			mod.handleConfig(action, key, value, { local: !!cmdObj.local, global: !!cmdObj.global, json: !!cmdObj.json })
		);
	});

program.parse();
