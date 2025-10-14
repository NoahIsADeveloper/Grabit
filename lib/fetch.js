import { readManifest, writeManifest } from '../utils/manifest.js';
import { cloneRepo, getCurrentCommit } from '../utils/git.js';
import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import { getEffectiveConfig } from '../utils/configLoader.js'; // reuse config loader

export async function fetchPackage(pkgName, options = {}) {
	const manifest = readManifest();
	const pkgs = manifest.packages || {};

	if (options.all) {
		const tempRoot = path.join('.grabit_temp');
		if (fs.existsSync(tempRoot)) fs.removeSync(tempRoot);
		fs.mkdirpSync(tempRoot);

		for (const name of Object.keys(pkgs)) {
			await fetchSinglePackage(name, manifest, tempRoot, options);
		}

		writeManifest(manifest);
		fs.removeSync(tempRoot);
		console.log('Finished fetching all packages.');
		return;
	}

	if (!pkgs[pkgName]) {
		console.error(`Package ${pkgName} not found in grabit.toml`);
		return;
	}

	await fetchSinglePackage(pkgName, manifest, null, options);
	writeManifest(manifest);
	console.log(`Fetched ${pkgName} at commit ${pkgs[pkgName].currentCommit}`);
}

async function fetchSinglePackage(pkgName, manifest, sharedTempRoot = null, cliOverrides = {}) {
	const pkg = manifest.packages[pkgName];
	const cfg = getEffectiveConfig({ cliOverrides });

	const effectivePath = cliOverrides.path || pkg.path || cfg.path;
	const effectiveBranch = cliOverrides.branch || pkg.branch || cfg.branch;
	const effectiveInclude = cliOverrides.include
		? String(cliOverrides.include).split(',').map(s => s.trim())
		: pkg.include || cfg.include;
	const effectiveCleanup = cliOverrides.cleanup
		? String(cliOverrides.cleanup).split(',').map(s => s.trim())
		: pkg.cleanup || cfg.cleanup;

	const tempRoot = sharedTempRoot || path.join('.grabit_temp');
	const tempPath = path.join(tempRoot, pkgName);

	if (!sharedTempRoot && fs.existsSync(tempRoot)) fs.removeSync(tempRoot);
	fs.mkdirpSync(tempRoot);

	await cloneRepo(pkg.repo, tempPath, effectiveBranch);

	for (const inc of effectiveInclude) {
		const src = path.join(tempPath, inc);
		const dest = path.join(effectivePath, inc);
		if (fs.existsSync(src)) fs.copySync(src, dest);
	}

	for (const pattern of effectiveCleanup) {
		const files = await glob(path.join(effectivePath, pattern));
		for (const file of files) {
			fs.removeSync(file);
		}
	}

	pkg.currentCommit = await getCurrentCommit(tempPath);

	if (!sharedTempRoot) fs.removeSync(tempRoot);

	console.log(`Fetched ${pkgName} at commit ${pkg.currentCommit}`);
}
