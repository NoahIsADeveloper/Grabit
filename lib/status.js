import { readManifest } from '../utils/manifest.js';
import { getCurrentCommit } from '../utils/git.js';
import path from 'path';

export async function statusPackages() {
	const manifest = readManifest();
	const packages = manifest.packages || {};

	for (const [pkgName, pkg] of Object.entries(packages)) {
		const localCommit = pkg.currentCommit;
		console.log(`${pkgName}: ${localCommit}`);
	}
}
