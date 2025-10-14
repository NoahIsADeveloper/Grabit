import simpleGit from 'simple-git';

export const git = simpleGit();

export async function cloneRepo(repo, targetPath, branch) {
	await git.clone(repo, targetPath, ['--branch', branch]);
}

export async function pullRepo(repoPath) {
	const repoGit = simpleGit(repoPath);
	await repoGit.pull();
}

export async function getCurrentCommit(repoPath) {
	const repoGit = simpleGit(repoPath);
	return (await repoGit.revparse(['HEAD'])).trim();
}
