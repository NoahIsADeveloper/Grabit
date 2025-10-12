import { readManifest, writeManifest } from '../utils/manifest.js';
import path from 'path';
import fs from 'fs-extra';

export function addPackage(repo, options) {
	const manifest = readManifest();
	const pkgName = path.basename(repo, '.git');

	if (!manifest.packages) manifest.packages = {};
	manifest.packages[pkgName] = {
		repo,
		branch: options.branch,
		currentCommit: null,
		path: `dependencies/${pkgName}`,
		include: ['src', 'lib'],
		cleanup: ['*.md']
	};

	fs.mkdirSync(manifest.packages[pkgName].path, { recursive: true });
	writeManifest(manifest);
	console.log(`Added ${pkgName} to grabit.toml`);
}
