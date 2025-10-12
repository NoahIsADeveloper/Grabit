import { readManifest, writeManifest } from '../utils/manifest.js';
import { cloneRepo, getCurrentCommit } from '../utils/git.js';
import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

export async function fetchPackage(pkgName) {
	const manifest = readManifest();
	const pkg = manifest.packages?.[pkgName];
	if (!pkg) return console.error(`Package ${pkgName} not found in grabit.toml`);

	const tempRoot = path.join('.grabit_temp');
	const tempPath = path.join(tempRoot, pkgName);

	if (fs.existsSync(tempPath)) fs.removeSync(tempPath);

	await cloneRepo(pkg.repo, tempPath, pkg.branch);

	pkg.include.forEach((inc) => {
		const src = path.join(tempPath, inc);
		const dest = path.join(pkg.path, inc);
		if (fs.existsSync(src)) fs.copySync(src, dest);
	});

	for (const pattern of pkg.cleanup) {
		const files = await glob(path.join(pkg.path, pattern));
		for (const file of files) {
			fs.removeSync(file);
		}
	}

	pkg.currentCommit = await getCurrentCommit(tempPath);

	writeManifest(manifest);

	if (fs.existsSync(tempRoot)) fs.removeSync(tempRoot);

	console.log(`Fetched ${pkgName} at commit ${pkg.currentCommit}`);
}
