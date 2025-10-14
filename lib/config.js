// lib/config.js
import fs from 'fs-extra';
import path from 'path';
import TOML from '@iarna/toml';
import { loadGlobalConfig, writeGlobalConfig, loadLocalConfig, writeLocalConfig, getEffectiveConfig } from '../utils/configLoader.js';

function parseValueForKey(key, rawValue) {
	if (rawValue === undefined) return undefined;

	if (['include', 'cleanup'].includes(key)) {
		if (Array.isArray(rawValue)) return rawValue;
		return rawValue.split(',').map(s => s.trim()).filter(Boolean);
	}

	if (rawValue === 'true') return true;
	if (rawValue === 'false') return false;
	return rawValue;
}

export function handleConfig(action, key, value, options = {}) {
	const { local = false, global = false, json = false } = options;

	const target = local ? 'local' : (global ? 'global' : 'global');

	switch (action) {
		case 'set': {
			if (!key || value === undefined) {
				console.error('Usage: grabit config set <key> <value> [--local]');
				return;
			}
			const parsed = parseValueForKey(key, value);
			if (target === 'global') {
				const cfg = loadGlobalConfig();
				cfg[key] = parsed;
				writeGlobalConfig(cfg);
				console.log(`Set global ${key} = ${Array.isArray(parsed) ? JSON.stringify(parsed) : parsed}`);
			} else {
				const cfg = loadLocalConfig();
				cfg[key] = parsed;
				writeLocalConfig(cfg);
				console.log(`Set local ${key} = ${Array.isArray(parsed) ? JSON.stringify(parsed) : parsed}`);
			}
			break;
		}

		case 'unset': {
			if (!key) {
				console.error('Usage: grabit config unset <key> [--local]');
				return;
			}
			if (target === 'global') {
				const cfg = loadGlobalConfig();
				delete cfg[key];
				writeGlobalConfig(cfg);
				console.log(`Removed ${key} from global config`);
			} else {
				const cfg = loadLocalConfig();
				delete cfg[key];
				writeLocalConfig(cfg);
				console.log(`Removed ${key} from local config`);
			}
			break;
		}

		case 'list': {
			const showGlobal = global || !local;
			const showLocal = local || !global;

			if (showGlobal) {
				const g = loadGlobalConfig();
				if (json) console.log(JSON.stringify({ global: g }, null, 2));
				else {
					console.log('Global config (~/.grabit/config.toml):');
					console.log(TOML.stringify({ defaults: g }));
				}
			}

			if (showLocal) {
				const l = loadLocalConfig();
				if (json) console.log(JSON.stringify({ local: l }, null, 2));
				else {
					console.log('Local project defaults (grabit.toml [defaults]):');
					console.log(TOML.stringify({ defaults: l }));
				}
			}

			if (!local && !global) {
				const eff = getEffectiveConfig({ cwd: process.cwd() });
				if (json) console.log(JSON.stringify({ effective: eff }, null, 2));
				else {
					console.log('Effective config (merged):');
					console.log(TOML.stringify({ defaults: eff }));
				}
			}
			break;
		}

		case 'reset': {
			const globalPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.grabit', 'config.toml');
			if (fs.existsSync(globalPath)) {
				fs.removeSync(globalPath);
				console.log('Global config reset (removed ~/.grabit/config.toml)');
			} else {
				console.log('No global config found to reset.');
			}
			break;
		}

		default:
			console.error('Unknown action. Use one of: set, unset, list, reset');
	}
}
