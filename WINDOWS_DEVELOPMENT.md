# Windows Development Guide

This guide explains the Windows-specific configurations and fixes implemented in the Settler codebase to ensure smooth development on Windows platforms.

## Table of Contents

1. [Quick Start for Windows](#quick-start-for-windows)
2. [Windows Symlink Issue - RESOLVED](#windows-symlink-issue---resolved)
3. [Automated Setup](#automated-setup)
4. [Manual Configuration](#manual-configuration)
5. [Troubleshooting](#troubleshooting)

## Quick Start for Windows

### Prerequisites

- Windows 10 or later
- Node.js 22+ ([Download](https://nodejs.org/))
- Git ([Download](https://git-scm.com/download/win))
- Administrator access (optional, but recommended for full features)

### 1. Clone the Repository

```powershell
git clone https://github.com/your-org/settler.git
cd settler
```

### 2. Run Windows Setup Script

```powershell
# Option A: Using PowerShell
.\scripts\setup-windows.bat

# Option B: Using Command Prompt
scripts\setup-windows.bat
```

This script will:

- Check Node.js and pnpm versions
- Detect Windows platform and configure appropriately
- Install dependencies
- Configure symlink permissions (optional)

### 3. Start Development

```powershell
# Start development server
pnpm run dev

# Build for production (Windows-compatible)
pnpm run build

# Run visual regression tests
pnpm run test:visual
```

## Windows Symlink Issue - RESOLVED

### The Problem

Next.js `output: 'standalone'` mode creates symlinks during the build process for optimized Docker deployments. On Windows, creating symlinks requires:

- Administrator privileges, OR
- Windows Developer Mode enabled

Without these, the build fails with:

```
Error: EPERM: operation not permitted, symlink
```

### The Solution

**File:** `packages/web/next.config.js`

```javascript
const os = require("os");

// Detect Windows platform
const isWindows = os.platform() === "win32";

// Only use standalone output on non-Windows platforms or CI
// On Windows, use default output format to avoid symlink permission issues
const shouldUseStandalone = !isWindows || process.env.CI === "true";

const nextConfig = {
  // ... other config
  output: shouldUseStandalone ? "standalone" : undefined,
  // ... rest of config
};
```

### How It Works

1. **Platform Detection:** Uses Node.js `os.platform()` to detect Windows
2. **Conditional Output:**
   - **Windows:** Uses default Next.js output (no symlinks needed)
   - **Linux/macOS (CI):** Uses `standalone` output for Docker optimization
3. **Automatic:** No manual configuration needed - works out of the box

### Impact Assessment

| Feature                 | Windows  | Linux CI     |
| ----------------------- | -------- | ------------ |
| Local Development       | ✅ Works | N/A          |
| Build Output            | Standard | Standalone   |
| Docker Deployment       | Use WSL2 | ✅ Optimized |
| Visual Regression Tests | ✅ Works | ✅ Works     |
| Production Build        | Via CI   | ✅ Optimized |

## Automated Setup

### setup-windows.bat Features

The `scripts/setup-windows.bat` script provides:

1. **Environment Checks**
   - Node.js version verification (22+)
   - pnpm installation and activation
   - Windows version detection

2. **Developer Mode Detection**
   - Checks if Developer Mode is enabled
   - Provides instructions to enable if needed
   - Can enable via `--enable-devmode` flag (admin required)

3. **Dependency Installation**
   - Runs `pnpm install --frozen-lockfile`
   - Handles node_modules setup

4. **Configuration Validation**
   - Verifies next.config.js is properly configured
   - Provides clear next steps

### Using the Setup Script

```powershell
# Basic setup (recommended)
.\scripts\setup-windows.bat

# With Developer Mode enablement (requires admin)
# Run PowerShell as Administrator, then:
.\scripts\setup-windows.bat --enable-devmode
```

## Manual Configuration

### Option 1: Use Default Setup (Recommended)

The codebase now auto-detects Windows and adjusts accordingly. No action needed.

### Option 2: Enable Windows Developer Mode

Developer Mode allows symlink creation without admin rights.

**Via Settings:**

1. Open Settings → Privacy & Security → For Developers
2. Enable "Developer Mode"
3. Restart your terminal

**Via PowerShell (Admin):**

```powershell
# Run as Administrator
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock" `
  /t REG_DWORD /f /v "AllowDevelopmentWithoutDevLicense" /d "1"
```

**Via setup script:**

```powershell
# Run as Administrator
.\scripts\setup-windows.bat --enable-devmode
```

### Option 3: Force Standalone Mode

If you want to force standalone mode on Windows (requires admin or Developer Mode):

**Temporary:**

```powershell
# Run build with admin rights
# Right-click PowerShell → "Run as administrator"
pnpm run build
```

**Permanent (not recommended):**
Edit `packages/web/next.config.js` and remove the Windows check:

```javascript
// Remove this line:
// const shouldUseStandalone = !isWindows || process.env.CI === "true";

// Change to:
const shouldUseStandalone = true;
```

## Troubleshooting

### Issue: EPERM: operation not permitted, symlink

**Status:** ✅ Should no longer occur with the fix in place

**If it still happens:**

1. Ensure you're using the latest `next.config.js`
2. Check that `os` module is imported
3. Verify the platform detection logic

```javascript
// Debug check
console.log("Platform:", os.platform());
console.log("Is Windows:", isWindows);
console.log("Use Standalone:", shouldUseStandalone);
```

### Issue: Build fails with "Cannot find module"

**Cause:** Windows path separators vs. Unix

**Solution:**

```javascript
// Use path.join() for cross-platform paths
const myPath = path.join(__dirname, "src", "components");

// Avoid hardcoded slashes
// ❌ Bad: './src/components'
// ✅ Good: path.join(__dirname, 'src', 'components')
```

### Issue: pnpm not found

**Solution:**

```powershell
# Enable corepack (comes with Node.js 16+)
corepack enable

# Prepare specific pnpm version
corepack prepare pnpm@10.13.1 --activate

# Verify
pnpm --version
```

### Issue: Line ending issues (CRLF vs LF)

**Cause:** Windows uses CRLF (`\r\n`) while Unix uses LF (`\n`)

**Solution:**

```powershell
# Configure Git to handle line endings
git config --global core.autocrlf true

# Or use .gitattributes (already in repo)
# *.js text eol=lf
```

### Issue: Scripts won't run (execution policy)

**Cause:** PowerShell execution policy restrictions

**Solution:**

```powershell
# Check current policy
Get-ExecutionPolicy

# Set policy for current user (run as admin)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or use Command Prompt instead of PowerShell
# cmd.exe → scripts\setup-windows.bat
```

## Windows-Compatible Scripts

### Available npm/pnpm Scripts

All scripts in `package.json` are Windows-compatible:

```bash
# Development
pnpm run dev              # Start dev server
pnpm run build           # Build (Windows-compatible)
pnpm run build:all       # Build all packages

# Testing
pnpm run test:visual     # Visual regression tests
pnpm run test:e2e        # E2E tests
pnpm run test:ui-audit   # UI consistency audit

# Code Quality
pnpm run lint            # Run ESLint
pnpm run typecheck       # TypeScript check
pnpm run format          # Format code
```

### Cross-Platform Build

```powershell
# This now works on Windows without admin rights
pnpm run build

# Output goes to packages/web/.next/ (not standalone)
# No symlink creation required
```

## CI/CD Considerations

### Local (Windows)

- Uses standard Next.js output
- No Docker optimization needed locally
- Fast builds without symlink overhead

### CI (Linux)

- Uses `standalone` output automatically
- Optimized for Docker deployment
- Detects CI environment via `process.env.CI`

### Deployment Flow

```
Developer (Windows)
    ↓
Push to GitHub
    ↓
CI Build (Linux) → Standalone output
    ↓
Docker Image → Production
```

## Additional Resources

- [Next.js Standalone Output](https://nextjs.org/docs/pages/api-reference/next-config-js/output)
- [Windows Developer Mode](https://docs.microsoft.com/en-us/windows/apps/get-started/enable-your-device-for-development)
- [pnpm on Windows](https://pnpm.io/installation#on-windows)

## Summary

The Windows symlink permission issue has been **completely resolved** codebase-wide through:

1. **Automatic Platform Detection** in `next.config.js`
2. **Conditional Output Mode** (no standalone on Windows)
3. **Setup Script** for easy Windows development environment
4. **Documentation** for manual configuration options

No developer action is required - the codebase now works out of the box on Windows without elevated permissions.
