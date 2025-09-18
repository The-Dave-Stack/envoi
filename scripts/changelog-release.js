#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');

// Get version from command line
const version = process.argv[2];

if (!version) {
  console.error('❌ Please provide a version number');
  console.log('Usage: npm run changelog:release <version>');
  console.log('Example: npm run changelog:release 0.1.1');
  process.exit(1);
}

// Validate version format
const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(version)) {
  console.error('❌ Invalid version format. Use semantic versioning (e.g., 0.1.1)');
  process.exit(1);
}

// Read current CHANGELOG.md
let changelog = fs.readFileSync(changelogPath, 'utf8');

// Check if [Unreleased] section exists
if (!changelog.includes('## [Unreleased]')) {
  console.log('❌ No [Unreleased] section found in CHANGELOG.md');
  console.log('Run "npm run changelog:add" to add one first');
  process.exit(1);
}

// Get current date
const date = new Date().toISOString().split('T')[0];

// Replace [Unreleased] with version section
changelog = changelog.replace(
  '## [Unreleased]',
  `## [${version}] - ${date}`
);

// Add new [Unreleased] section
const versionSectionIndex = changelog.indexOf(`## [${version}] - ${date}`);
const nextSectionIndex = changelog.indexOf('## [', versionSectionIndex + 1);

if (nextSectionIndex === -1) {
  // No other sections after, add at the end
  changelog += '\n## [Unreleased]\n\n';
} else {
  // Insert new Unreleased section before the next version
  changelog = changelog.slice(0, nextSectionIndex) + '\n## [Unreleased]\n\n' + changelog.slice(nextSectionIndex);
}

// Update version links at the bottom
const unreleasedLinkPattern = /\[Unreleased\]: .+/;
const versionLink = `[${version}]: https://github.com/The-Dave-Stack/envoi/releases/tag/v${version}`;

if (changelog.match(unreleasedLinkPattern)) {
  // Update existing Unreleased link
  changelog = changelog.replace(
    unreleasedLinkPattern,
    `[Unreleased]: https://github.com/The-Dave-Stack/envoi/compare/v${version}...HEAD\n${versionLink}`
  );
} else {
  // Add new links section
  changelog += `\n[Unreleased]: https://github.com/The-Dave-Stack/envoi/compare/v${version}...HEAD\n${versionLink}`;
}

// Write back to file
fs.writeFileSync(changelogPath, changelog);

console.log(`✅ Updated CHANGELOG.md for release ${version}`);