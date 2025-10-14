import { readManifest, writeManifest } from '../utils/manifest.js';
import path from 'path';
import { getEffectiveConfig } from '../utils/configLoader.js';

export function addPackage(repo, options = {}) {
	const cwd = process.cwd();
	const cliOverrides = {};
	if (options.path) cliOverrides.path = options.path;
	if (options.branch) cliOverrides.branch = options.branch;
	if (options.include) cliOverrides.include = Array.isArray(options.include) ? options.include : String(options.include).split(',').map(s => s.trim());
	if (options.cleanup) cliOverrides.cleanup = Array.isArray(options.cleanup) ? options.cleanup : String(options.cleanup).split(',').map(s => s.trim());

	const cfg = getEffectiveConfig({ cwd, cliOverrides });

	const manifest = readManifest();
	if (!manifest.packages) manifest.packages = {};

	const pkgName = path.basename(repo, '.git');

	const packagePath = path.join(cfg.path, pkgName);
	manifest.packages[pkgName] = {
		repo,
		branch: cfg.branch,
		currentCommit: null,
		path: packagePath,
		include: cfg.include,
		cleanup: cfg.cleanup,
	};

	writeManifest(manifest);
	console.log(`Added ${pkgName} to grabit.toml with path=${packagePath}`);
}
