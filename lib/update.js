import { readManifest, writeManifest } from '../utils/manifest.js';
import { fetchPackage } from './fetch.js';

export async function updatePackages(options) {
	const manifest = readManifest();
	const packages = manifest.packages || {};

	if (options.all) {
		for (const pkgName of Object.keys(packages)) {
			await fetchPackage(pkgName);
		}
	} else {
		console.log('Specify packages to update with fetch <package> or use --all');
	}
}
