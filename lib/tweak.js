import fs from 'fs-extra';
import TOML from '@iarna/toml';
import path from 'path';
import { readManifest, writeManifest } from '../utils/manifest.js';

const MANIFEST_PATH = path.join(process.cwd(), 'grabit.toml');

export function handleTweak(action, pkgName, key, value) {
	if (!fs.existsSync(MANIFEST_PATH)) {
		console.error('grabit.toml not found in this directory.');
		process.exit(1);
	}

	const manifest = readManifest(MANIFEST_PATH);
	const packages = manifest.packages || {};

	if (!pkgName && action !== 'list') {
		console.error('Please specify a package.');
		process.exit(1);
	}

	const pkg = packages[pkgName] || {};

	switch (action) {
		case 'show':
			if (!pkgName) {
				console.log('Available packages:', Object.keys(packages).join(', '));
				return;
			}
			console.log(`Settings for ${pkgName}:`);
			console.log(TOML.stringify(pkg));
			break;

		case 'set':
			if (!key || value === undefined) {
				console.error('Usage: grabit tweak set <package> <key> <value>');
				return;
			}
			if (['include', 'cleanup'].includes(key)) {
				pkg[key] = value.split(',').map(s => s.trim()).filter(Boolean);
			} else {
				pkg[key] = value;
			}
			packages[pkgName] = pkg;
			manifest.packages = packages;
			writeManifest(manifest, MANIFEST_PATH);
			console.log(`Set ${key} for ${pkgName}`);
			break;

		case 'unset':
			if (!key) {
				console.error('Usage: grabit tweak unset <package> <key>');
				return;
			}
			delete pkg[key];
			packages[pkgName] = pkg;
			manifest.packages = packages;
			writeManifest(manifest, MANIFEST_PATH);
			console.log(`Removed ${key} from ${pkgName}`);
			break;

		case 'reset':
			manifest.packages[pkgName] = { repo: pkg.repo };
			writeManifest(manifest, MANIFEST_PATH);
			console.log(`Reset ${pkgName} to minimal defaults`);
			break;

		default:
			console.error('Unknown action. Use one of: show, set, unset, reset');
	}
}
