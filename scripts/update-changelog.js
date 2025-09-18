#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Get version from command line or use package.json version
const args = process.argv.slice(2);
let version = packageJson.version;

if (args.length > 0) {
  version = args[0];
}

// Read CHANGELOG.md
const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
let changelog = fs.readFileSync(changelogPath, 'utf8');

// Get current date
const date = new Date().toISOString().split('T')[0];

// Replace [Unreleased] with the new version
if (changelog.includes('## [Unreleased]')) {
  changelog = changelog.replace(
    '## [Unreleased]',
    `## [${version}] - ${date}\n\n## [Unreleased]`
  );
  
  // Update the links at the bottom
  const unreleasedLink = '[Unreleased]: https://github.com/The-Dave-Stack/envoi/compare/HEAD';
  const newLink = `[${version}]: https://github.com/The-Dave-Stack/envoi/releases/tag/v${version}`;
  
  if (changelog.includes(unreleasedLink)) {
    changelog = changelog.replace(
      unreleasedLink,
      `[Unreleased]: https://github.com/The-Dave-Stack/envoi/compare/v${version}...HEAD\n${newLink}`
    );
  }
  
  // Write updated changelog
  fs.writeFileSync(changelogPath, changelog);
  
  console.log(`✅ CHANGELOG.md updated for version ${version}`);
} else {
  console.log('❌ No [Unreleased] section found in CHANGELOG.md');
  process.exit(1);
}