# Pull Request Template

## 📋 Description
Please describe the changes you're making and why. Be specific about what problem this solves or what feature this adds.

## 🧩 Type of Change
Please check the type of change you're making:
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Dependency update
- [ ] Refactoring
- [ ] CI/CD improvement
- [ ] Test addition
- [ ] Configuration change

## ✅ Checklist
- [ ] I have read the [CONTRIBUTING.md](CONTRIBUTING.md) if this repo has one
- [ ] My code follows the style of this project (lint passes)
- [ ] I have added appropriate tests for my changes
- [ ] I have updated the documentation if needed
- [ ] I have verified that `verify:fast` passes locally
- [ ] I have verified that `verify:conflict-markers` passes locally
- [ ] This PR does not introduce new security vulnerabilities
- [ ] Dependabot auto-merge is not required for this change (Tier 1) or has been reviewed (Tier 2)

## 🔍 Testing
How have you tested your changes?
- [ ] `pnpm run verify:fast` passes
- [ ] `pnpm run lint` passes
- [ ] `pnpm run typecheck` passes
- [ ] Manual testing performed

## 📝 Additional Context
Any additional context, screenshots, or notes about this PR?