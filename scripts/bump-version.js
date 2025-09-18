#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Get command line arguments
const args = process.argv.slice(2);
let bumpType = 'patch'; // Default to patch

if (args.includes('--major')) {
  bumpType = 'major';
} else if (args.includes('--minor')) {
  bumpType = 'minor';
} else if (args.includes('--patch')) {
  bumpType = 'patch';
}

// Current version
const currentVersion = packageJson.version;
console.log(`Current version: ${currentVersion}`);

// Bump version
const versionParts = currentVersion.split('.').map(Number);
let newVersion;

switch (bumpType) {
  case 'major':
    versionParts[0]++;
    versionParts[1] = 0;
    versionParts[2] = 0;
    break;
  case 'minor':
    versionParts[1]++;
    versionParts[2] = 0;
    break;
  case 'patch':
    versionParts[2]++;
    break;
}

newVersion = versionParts.join('.');
console.log(`New version: ${newVersion}`);

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`✅ Version bumped to ${newVersion}`);