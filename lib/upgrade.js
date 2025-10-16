import { readManifest, writeManifest } from '../utils/manifest.js';
import { fetchPackage } from './fetch.js';
import { pullRepo } from '../utils/git.js';
import fs from 'fs-extra';
import path from 'path';
import { getEffectiveConfig } from '../utils/configLoader.js';

export async function upgradePackage(pkgName, options = {}) {
    const manifest = readManifest();
    const pkgs = manifest.packages || {};

    if (!pkgs[pkgName]) {
        console.error(`Package ${pkgName} not found in grabit.toml`);
        return;
    }

    const pkg = pkgs[pkgName];
    const cfg = getEffectiveConfig({ cliOverrides: options });

    const effectiveBranch = options.branch || pkg.branch || cfg.branch;

    const tempRoot = path.join('.grabit_temp');
    const tempPath = path.join(tempRoot, pkgName);

    if (!fs.existsSync(tempRoot)) fs.mkdirpSync(tempRoot);
    if (!fs.existsSync(tempPath)) {
        const { cloneRepo } = await import('../utils/git.js');
        await cloneRepo(pkg.repo, tempPath, effectiveBranch);
    }

    await pullRepo(tempPath);

    const { getCurrentCommit } = await import('../utils/git.js');
    const latestCommit = await getCurrentCommit(tempPath);

    pkg.commit = latestCommit;
    writeManifest(manifest);

    console.log(`Upgraded ${pkgName} to latest commit ${latestCommit}`);

    if (options.fetch) {
        await fetchPackage(pkgName, options);
    }

    fs.removeSync(tempRoot);
}
