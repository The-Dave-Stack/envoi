#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Running CI/CD validation checks...\n');

const errors = [];
const warnings = [];

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${description} exists`);
    return true;
  } else {
    console.log(`❌ ${description} missing: ${filePath}`);
    errors.push(`Missing ${description}: ${filePath}`);
    return false;
  }
}

function checkDirectory(dirPath, description) {
  const fullPath = path.join(__dirname, '..', dirPath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    console.log(`✅ ${description} exists`);
    return true;
  } else {
    console.log(`❌ ${description} missing: ${dirPath}`);
    errors.push(`Missing ${description}: ${dirPath}`);
    return false;
  }
}

function validateYAML(filePath) {
  try {
    const yaml = require('js-yaml');
    const content = fs.readFileSync(filePath, 'utf8');
    yaml.load(content);
    console.log(`✅ ${filePath} is valid YAML`);
    return true;
  } catch (error) {
    console.log(`❌ ${filePath} has invalid YAML: ${error.message}`);
    errors.push(`Invalid YAML in ${filePath}: ${error.message}`);
    return false;
  }
}

function validateJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    console.log(`✅ ${filePath} is valid JSON`);
    return true;
  } catch (error) {
    console.log(`❌ ${filePath} has invalid JSON: ${error.message}`);
    errors.push(`Invalid JSON in ${filePath}: ${error.message}`);
    return false;
  }
}

function runCommand(command, description) {
  try {
    execSync(command, { stdio: 'pipe' });
    console.log(`✅ ${description}`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} failed`);
    errors.push(`${description} failed: ${error.message}`);
    return false;
  }
}

// Check essential files
console.log('📁 Checking essential files...');
checkFile('package.json', 'Package configuration');
checkFile('tsconfig.json', 'TypeScript configuration');
checkFile('README.md', 'README documentation');
checkFile('CHANGELOG.md', 'Changelog');
checkFile('LICENSE', 'License file');

// Check essential directories
console.log('\n📂 Checking essential directories...');
checkDirectory('src', 'Source code directory');
checkDirectory('dist', 'Distribution directory');
checkDirectory('__tests__', 'Test directory');
checkDirectory('.github/workflows', 'GitHub Actions workflows');
checkDirectory('docs', 'Documentation directory');

// Validate configuration files
console.log('\n⚙️ Validating configuration files...');
validateJSON('package.json');
validateJSON('.releaserc.json');
validateJSON('.commitlintrc.json');

if (checkFile('.github/workflows/ci.yml', 'CI workflow')) {
  validateYAML('.github/workflows/ci.yml');
}
if (checkFile('.github/workflows/release.yml', 'Release workflow')) {
  validateYAML('.github/workflows/release.yml');
}
if (checkFile('.github/workflows/health-monitor.yml', 'Health monitor workflow')) {
  validateYAML('.github/workflows/health-monitor.yml');
}

// Check project build
console.log('\n🔨 Checking build process...');
if (fs.existsSync('node_modules')) {
  runCommand('npm run lint', 'Linting');
  runCommand('npm test', 'Tests');
  runCommand('npm run build', 'Build');
} else {
  warnings.push('node_modules not found - install dependencies first');
  console.log('⚠️ node_modules not found - install dependencies first');
}

// Check package.json scripts
console.log('\n📜 Checking package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['build', 'test', 'lint'];
const optionalScripts = ['test:integration', 'validate-changelog', 'semantic-release'];

requiredScripts.forEach(script => {
  if (packageJson.scripts && packageJson.scripts[script]) {
    console.log(`✅ ${script} script exists`);
  } else {
    errors.push(`Missing required script: ${script}`);
    console.log(`❌ Missing required script: ${script}`);
  }
});

optionalScripts.forEach(script => {
  if (packageJson.scripts && packageJson.scripts[script]) {
    console.log(`✅ ${script} script exists (optional)`);
  } else {
    warnings.push(`Missing optional script: ${script}`);
    console.log(`⚠️ Missing optional script: ${script}`);
  }
});

// Check git status
console.log('\n🔄 Checking git status...');
try {
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (status.trim()) {
    warnings.push('There are uncommitted changes');
    console.log('⚠️ There are uncommitted changes');
  } else {
    console.log('✅ Working directory is clean');
  }
} catch (error) {
  warnings.push('Not in a git repository or git not available');
  console.log('⚠️ Not in a git repository or git not available');
}

// Summary
console.log('\n📊 Validation Summary');
console.log('====================');

if (errors.length === 0 && warnings.length === 0) {
  console.log('🎉 All validation checks passed!');
  console.log('✅ Project is ready for CI/CD');
} else {
  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} error(s) found:`);
    errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️ ${warnings.length} warning(s) found:`);
    warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning}`);
    });
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Please fix errors before proceeding with CI/CD');
    process.exit(1);
  } else {
    console.log('\n⚠️ Project is ready for CI/CD but consider addressing warnings');
  }
}

console.log('\n🔗 Useful links:');
console.log('- CI/CD Documentation: docs/CI-CD.md');
console.log('- Release Process: docs/RELEASE-PROCESS.md');
console.log('- GitHub Actions: https://github.com/The-Dave-Stack/envoi/actions');