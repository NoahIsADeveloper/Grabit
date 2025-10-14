import fs from 'fs-extra';
import path from 'path';
import { readManifest, writeManifest } from '../utils/manifest.js';

export function removePackage(pkgName) {
	const manifest = readManifest();
	const pkg = manifest.packages?.[pkgName];

	if (!pkg) {
		console.error(`Package ${pkgName} not found in grabit.toml`);
		return;
	}

	pkg.include.forEach((inc) => {
		const target = path.join(pkg.path, inc);
		if (fs.existsSync(target)) {
			fs.removeSync(target);
			console.log(`Removed ${target}`);
		}
	});

	delete manifest.packages[pkgName];
	writeManifest(manifest);

	console.log(`Removed ${pkgName} from grabit.toml`);
}
