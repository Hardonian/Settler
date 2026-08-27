@echo off
REM Windows Development Setup Script for Settler
REM This script helps configure Windows for optimal development

echo ======================================
echo Settler Windows Development Setup
echo ======================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Running with administrator privileges
) else (
    echo [INFO] Not running as administrator (this is normal)
    echo [INFO] Some features may be limited, but core development will work fine
)

echo.
echo ======================================
echo Checking Node.js version...
echo ======================================
node --version >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=*" %%a in ('node --version') do (
        echo [OK] Node.js version: %%a
    )
) else (
    echo [ERROR] Node.js not found. Please install Node.js 22 or later.
    exit /b 1
)

echo.
echo ======================================
echo Checking pnpm...
echo ======================================
pnpm --version >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=*" %%a in ('pnpm --version') do (
        echo [OK] pnpm version: %%a
    )
) else (
    echo [WARN] pnpm not found. Installing via corepack...
    corepack enable
    corepack prepare pnpm@9.15.0 --activate
)

echo.
echo ======================================
echo Configuring Windows for Symlinks (Optional)
echo ======================================
echo.
echo Next.js standalone builds require symlink creation permissions.
echo The next.config.js has been updated to automatically handle this.
echo.
echo Options:
echo 1. Use default build mode (RECOMMENDED - no changes needed)
echo    The app will build without standalone output on Windows
necho    CI/production (Linux) will use standalone mode automatically
)
echo.
echo 2. Enable Developer Mode for symlink support (OPTIONAL)
echo    This allows Windows to create symlinks without admin rights
)
echo.

REM Check Windows version for Developer Mode support
for /f "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
if "%VERSION%" GEQ "10.0" (
    echo [INFO] Windows 10/11 detected - Developer Mode available
    
    REM Check if Developer Mode is enabled via registry
    reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock" /v AllowDevelopmentWithoutDevLicense 2>nul | find "0x1" >nul
    if %errorLevel% == 0 (
        echo [OK] Developer Mode is already enabled
    ) else (
        echo [INFO] Developer Mode not enabled
        echo.
        echo To enable Developer Mode for symlink support:
        echo   1. Open Settings -^> Privacy ^& Security -^> For Developers
        echo   2. Enable "Developer Mode"
        echo   3. Restart your terminal
        echo.
        echo Or run this script as Administrator with the --enable-devmode flag
    )
) else (
    echo [INFO] Windows version earlier than 10 - Developer Mode not available
)

echo.
echo ======================================
echo Installation
echo ======================================
echo.

if not exist "node_modules" (
    echo Installing dependencies...
    pnpm install --frozen-lockfile
    if %errorLevel% neq 0 (
        echo [ERROR] Installation failed
        exit /b 1
    )
    echo [OK] Dependencies installed
) else (
    echo [OK] node_modules already exists
)

echo.
echo ======================================
echo Setup Complete!
echo ======================================
echo.
echo Next steps:
echo   pnpm run dev          - Start development server
gecho   pnpm run build        - Build for production (Windows-compatible)
)
echo   pnpm run test:visual  - Run visual regression tests
)
echo.
echo For more information, see:
echo   - UI_CONSISTENCY_REPORT.md
gecho   - README.md
)
echo.

if "%1"=="--enable-devmode" (
    if %errorLevel% == 0 (
        echo Attempting to enable Developer Mode via registry...
        reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock" /t REG_DWORD /f /v "AllowDevelopmentWithoutDevLicense" /d "1" 2>nul
        if %errorLevel% == 0 (
            echo [OK] Developer Mode enabled. Please restart your computer.
        ) else (
            echo [ERROR] Failed to enable Developer Mode. Please enable manually in Settings.
        )
    )
)

pause
