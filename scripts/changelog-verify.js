#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
const packagePath = path.join(__dirname, '..', 'package.json');

// Read files
const changelog = fs.readFileSync(changelogPath, 'utf8');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Check if [Unreleased] section exists
const hasUnreleased = changelog.includes('## [Unreleased]');
if (!hasUnreleased) {
  console.log('❌ No [Unreleased] section found in CHANGELOG.md');
  console.log('Run "npm run changelog:add" to add one');
  process.exit(1);
}

// Check if [Unreleased] section has content
const unreleasedStart = changelog.indexOf('## [Unreleased]');
const nextSectionStart = changelog.indexOf('## [', unreleasedStart + 1);
const unreleasedContent = changelog.slice(unreleasedStart, nextSectionStart === -1 ? changelog.length : nextSectionStart);

const hasContent = unreleasedContent.includes('### Added') || 
                   unreleasedContent.includes('### Changed') || 
                   unreleasedContent.includes('### Deprecated') || 
                   unreleasedContent.includes('### Removed') || 
                   unreleasedContent.includes('### Fixed') || 
                   unreleasedContent.includes('### Security');

if (!hasContent) {
  console.log('⚠️  [Unreleased] section exists but appears to be empty');
}

// Check if current version is already in changelog
const currentVersion = packageJson.version;
if (changelog.includes(`## [${currentVersion}]`)) {
  console.log(`⚠️  Version ${currentVersion} already exists in CHANGELOG.md`);
}

// Check changelog format
const formatIssues = [];
if (!changelog.startsWith('# Changelog')) {
  formatIssues.push('Missing "# Changelog" header');
}
if (!changelog.includes('All notable changes to this project will be documented in this file.')) {
  formatIssues.push('Missing standard description');
}
if (!changelog.includes('Keep a Changelog')) {
  formatIssues.push('Missing Keep a Changelog reference');
}
if (!changelog.includes('Semantic Versioning')) {
  formatIssues.push('Missing Semantic Versioning reference');
}

// Check for proper version links
const hasLinks = changelog.includes('[Unreleased]:');
if (!hasLinks) {
  formatIssues.push('Missing version links at the bottom');
}

// Report results
console.log('📋 CHANGELOG.md Verification Results:');
console.log('');

if (hasUnreleased && hasContent) {
  console.log('✅ [Unreleased] section exists with content');
} else if (hasUnreleased) {
  console.log('⚠️  [Unreleased] section exists but appears empty');
}

if (changelog.includes(`## [${currentVersion}]`)) {
  console.log(`✅ Current version ${currentVersion} found in changelog`);
} else {
  console.log(`ℹ️  Current version ${currentVersion} not yet released`);
}

if (formatIssues.length === 0) {
  console.log('✅ Changelog format is correct');
} else {
  console.log('❌ Format issues found:');
  formatIssues.forEach(issue => console.log(`   - ${issue}`));
}

console.log('');
console.log('Next steps:');
if (!hasContent) {
  console.log('1. Add changes to [Unreleased] section');
}
if (!changelog.includes(`## [${currentVersion}]`)) {
  console.log(`2. When ready to release: npm run changelog:release ${currentVersion}`);
}
console.log('3. Follow the manual release process in README.md');