#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');

// Read current CHANGELOG.md
let changelog = fs.readFileSync(changelogPath, 'utf8');

// Check if [Unreleased] section exists
if (!changelog.includes('## [Unreleased]')) {
  console.log('❌ No [Unreleased] section found in CHANGELOG.md');
  process.exit(1);
}

// Add new [Unreleased] section if it doesn't exist after the current one
const unreleasedIndex = changelog.indexOf('## [Unreleased]');
const nextSectionIndex = changelog.indexOf('## [', unreleasedIndex + 1);

if (nextSectionIndex === -1) {
  // No other version sections, add new Unreleased at the end
  changelog += '\n## [Unreleased]\n\n';
} else {
  // Insert new Unreleased section before the next version
  changelog = changelog.slice(0, nextSectionIndex) + '\n## [Unreleased]\n\n' + changelog.slice(nextSectionIndex);
}

// Write back to file
fs.writeFileSync(changelogPath, changelog);

console.log('✅ Added new [Unreleased] section to CHANGELOG.md');