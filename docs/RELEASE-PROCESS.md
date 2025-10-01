# Release Process Quick Reference

## Automated Releases (Recommended)

### Prerequisites
- All CI/CD checks must pass
- Follow conventional commit format
- Push to main branch

### Process
1. **Make changes** with conventional commit messages:
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve issue"
   ```

2. **Push to main**:
   ```bash
   git push origin main
   ```

3. **Automatic release** triggered by GitHub Actions:
   - Version calculated from commits
   - Changelog updated
   - GitHub release created
   - Package published to npm

### Commit Types & Version Bumps
- `feat`: Minor version bump (0.2.1 → 0.3.0)
- `fix`: Patch version bump (0.2.1 → 0.2.2)
- `BREAKING CHANGE`: Major version bump (0.2.1 → 1.0.0)

## Manual Releases (Emergency Only)

⚠️ **This process should only be used for emergency releases when the automated system is unavailable.**

### Step 1: Update Version
```bash
npm version patch  # or minor, major
```

### Step 2: Update Changelog Manually
Edit `CHANGELOG.md` to add the new version section and update links

### Step 3: Create Release
```bash
git push origin main --tags
gh release create v0.2.2 --title "Release v0.2.2" --notes "Release notes here"
```

### Step 4: Publish to npm
```bash
npm publish --access public
```

## Troubleshooting Releases

### Release Failed
1. Check CI/CD logs in GitHub Actions
2. Verify commit message format
3. Ensure all tests pass
4. Check NPM_TOKEN secret

### Version Conflicts
1. Check existing versions: `npm view @thedavestack/envoi versions`
2. Update package.json if needed
3. Clean git tags: `git tag -d v0.2.2 && git push origin :refs/tags/v0.2.2`

### Rollback Process
1. Unpublish npm package: `npm unpublish @thedavestack/envoi@0.2.2`
2. Delete GitHub release via web interface
3. Revert commit: `git revert <commit-hash>`
4. Push fix: `git push origin main`

## Release Checklist

### Before Release
- [ ] All tests pass locally
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Documentation updated
- [ ] Dependencies audited
- [ ] **Automated**: CHANGELOG.md automatically updated by semantic-release

### After Release (Automated)
- [ ] ✅ GitHub release automatically created
- [ ] ✅ npm package automatically published
- [ ] ✅ CHANGELOG.md automatically updated
- [ ] Update any dependent projects
- [ ] Communicate release to users
- [ ] Monitor for issues

## Skip CI for Emergency Commits

```bash
git commit -m "chore: emergency fix [skip ci]"
git push origin main
```

## Useful Commands

```bash
# Check current version
npm version

# View commit history
git log --oneline -10

# Check package versions
npm outdated

# Run full test suite
npm test

# Check for security issues
npm audit

# Validate CI/CD setup
npm run validate-cicd

# Create conventional commit
npm run commit

# Trigger semantic-release manually
npm run semantic-release
```

## Environment Setup

### Required Secrets
- `NPM_TOKEN`: npm publishing token
- `GITHUB_TOKEN`: GitHub API token (auto-provided)
- `CODECOV_TOKEN`: Codecov token (optional)

### Local Setup
```bash
# Install dependencies
npm install

# Install commitizen globally (optional)
npm install -g commitizen

# Setup git hooks (optional)
npm run prepare
```