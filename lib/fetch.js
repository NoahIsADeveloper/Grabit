import { readManifest, writeManifest } from '../utils/manifest.js';
import { cloneRepo, checkoutCommit, pullRepo, getCurrentCommit } from '../utils/git.js';
import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import { getEffectiveConfig } from '../utils/configLoader.js';

export async function fetchPackage(pkgName, options = {}) {
    const manifest = readManifest();
    const pkgs = manifest.packages || {};

    const tempRoot = path.join('.grabit_temp');
    if (options.all) {
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

    if (fs.existsSync(tempRoot)) fs.removeSync(tempRoot);
    fs.mkdirpSync(tempRoot);

    await fetchSinglePackage(pkgName, manifest, tempRoot, options);
    writeManifest(manifest);
    fs.removeSync(tempRoot);
}

async function fetchSinglePackage(pkgName, manifest, tempRoot, cliOverrides = {}) {
    const pkg = manifest.packages[pkgName];
    const cfg = getEffectiveConfig({ cliOverrides });

    const effectivePath = cliOverrides.path || pkg.path || cfg.path;
    const effectiveBranch = cliOverrides.branch || pkg.branch || cfg.branch;
    const effectiveInclude = cliOverrides.include
        ? String(cliOverrides.include).split(',').map(s => s.trim())
        : pkg.include || cfg.include || [];
    const effectiveCleanup = cliOverrides.cleanup
        ? String(cliOverrides.cleanup).split(',').map(s => s.trim())
        : pkg.cleanup || cfg.cleanup || [];

    const tempPath = path.join(tempRoot, pkgName);

    const needsClone = !fs.existsSync(tempPath);

    if (needsClone) {
        await cloneRepo(pkg.repo, tempPath, effectiveBranch);
    }

    if (cliOverrides.latest || !pkg.commit) {
        await pullRepo(tempPath);
    } else if (pkg.commit) {
        await checkoutCommit(tempPath, pkg.commit);
    }

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
    console.log(`Fetched ${pkgName} at commit ${pkg.currentCommit}`);
}
