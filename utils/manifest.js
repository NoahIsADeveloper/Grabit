import fs from 'fs';
import TOML from '@iarna/toml';

export function readManifest(path = 'grabit.toml') {
	if (!fs.existsSync(path)) return {};
	const content = fs.readFileSync(path, 'utf-8');
	return TOML.parse(content);
}

export function writeManifest(data, path = 'grabit.toml') {
	const tomlString = TOML.stringify(data);
	fs.writeFileSync(path, tomlString);
}