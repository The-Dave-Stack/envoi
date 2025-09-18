#!/usr/bin/env node

const { execSync } = require('child_process');

// Get the latest tag
try {
  const latestTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', { encoding: 'utf8' }).trim();
  
  if (!latestTag) {
    console.log('No previous tags found. This will be the first release.');
    console.log('BUMP_TYPE=patch');
    return;
  }
  
  // Get commits since last tag
  const commits = execSync(`git log ${latestTag}..HEAD --pretty=format:'%s'`, { encoding: 'utf8' });
  
  // Analyze commits
  const commitLines = commits.split('\n').filter(line => line.trim());
  
  let hasBreakingChange = false;
  let hasFeature = false;
  let hasFix = false;
  
  commitLines.forEach(commit => {
    if (commit.includes('feat!') || commit.includes('BREAKING CHANGE')) {
      hasBreakingChange = true;
    } else if (commit.startsWith('feat:')) {
      hasFeature = true;
    } else if (commit.startsWith('fix:')) {
      hasFix = true;
    }
  });
  
  // Determine bump type
  let bumpType = 'none';
  if (hasBreakingChange) {
    bumpType = 'major';
  } else if (hasFeature) {
    bumpType = 'minor';
  } else if (hasFix) {
    bumpType = 'patch';
  }
  
  console.log(`Latest tag: ${latestTag}`);
  console.log(`Commits analyzed: ${commitLines.length}`);
  console.log(`Breaking changes: ${hasBreakingChange}`);
  console.log(`Features: ${hasFeature}`);
  console.log(`Fixes: ${hasFix}`);
  console.log(`Recommended bump type: ${bumpType}`);
  
  // Output for GitHub Actions
  console.log(`BUMP_TYPE=${bumpType}`);
  
} catch (error) {
  console.error('Error analyzing commits:', error.message);
  console.log('BUMP_TYPE=none');
  process.exit(1);
}