import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import TOML from '@iarna/toml';
import { readManifest, writeManifest } from './manifest.js';

const GLOBAL_DIR = path.join(os.homedir(), '.grabit');
const GLOBAL_PATH = path.join(GLOBAL_DIR, 'config.toml');

export function loadGlobalConfig() {
	if (!fs.existsSync(GLOBAL_PATH)) return {};
	try {
		const raw = fs.readFileSync(GLOBAL_PATH, 'utf8');
		return TOML.parse(raw).defaults || {};
	} catch (e) {
		console.error('Failed to parse global config:', e.message);
		return {};
	}
}

export function writeGlobalConfig(defaultsObj) {
	fs.mkdirpSync(GLOBAL_DIR);
	const out = { defaults: defaultsObj || {} };
	fs.writeFileSync(GLOBAL_PATH, TOML.stringify(out));
}

export function loadLocalConfig(cwd = process.cwd()) {
	const manifestPath = path.join(cwd, 'grabit.toml');
	if (!fs.existsSync(manifestPath)) return {};
	try {
		const raw = fs.readFileSync(manifestPath, 'utf8');
		const parsed = TOML.parse(raw);
		return parsed.defaults || {};
	} catch (e) {
		console.error('Failed to parse local grabit.toml:', e.message);
		return {};
	}
}

export function writeLocalConfig(defaultsObj, cwd = process.cwd()) {
	const manifestPath = path.join(cwd, 'grabit.toml');
	let manifest = {};
	if (fs.existsSync(manifestPath)) {
		manifest = readManifest(manifestPath);
	}
	manifest.defaults = defaultsObj || {};
	writeManifest(manifest, manifestPath);
}

export function getEffectiveConfig({ cwd = process.cwd(), cliOverrides = {} } = {}) {
	const builtins = {
		path: 'dependencies',
		branch: 'main',
		include: ['src', 'lib'],
		cleanup: ['*.md'],
	};

	const globalDefaults = loadGlobalConfig();
	const localDefaults = loadLocalConfig(cwd);

	const merged = { ...builtins, ...globalDefaults, ...localDefaults, ...cliOverrides };

	if (typeof merged.include === 'string') merged.include = merged.include.split(',').map(s => s.trim()).filter(Boolean);
	if (typeof merged.cleanup === 'string') merged.cleanup = merged.cleanup.split(',').map(s => s.trim()).filter(Boolean);
	return merged;
}
