import fs from 'fs-extra';
import path from 'path';
import { readManifest, writeManifest } from '../utils/manifest.js';

async function isDirEmpty(dirPath) {
	try {
		const files = await fs.readdir(dirPath);
		return files.length === 0;
	} catch (err) {
		if (err.code === 'ENOENT') {
			return false;
		}
		throw err;
	}
}

export async function removePackage(pkgName) {
	const manifest = readManifest();
	const pkg = manifest.packages?.[pkgName];

	if (!pkg) {
		console.error(`Package ${pkgName} not found in grabit.toml`);
		return;
	}

	for (const inc of pkg.include) {
		const target = path.join(pkg.path, inc);
		if (fs.existsSync(target)) {
			fs.removeSync(target);
			console.log(`Removed ${target}`);
		}
	}

	if (await isDirEmpty(pkg.path)) {
		fs.removeSync(pkg.path);
	}

	delete manifest.packages[pkgName];
	writeManifest(manifest);

	console.log(`Removed ${pkgName} from grabit.toml`);
}
