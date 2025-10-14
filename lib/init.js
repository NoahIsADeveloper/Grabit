import fs from 'fs-extra';
import path from 'path';
import { writeManifest } from '../utils/manifest.js';

export function initProject() {
	const manifestPath = path.join(process.cwd(), 'grabit.toml');

	if (fs.existsSync(manifestPath)) {
		console.log('grabit.toml already exists in this project.');
		return;
	}

	const initialManifest = { packages: {} };
	writeManifest(initialManifest, manifestPath);

	console.log('Initialized grabit project with grabit.toml.');
}
