# Portable Setup Helper Script
# Run this on the target machine to set up the project

param(
    [string]$Action = "help"
)

$ProjectDir = Split-Path -Parent $PSCommandPath
$ProjectName = Split-Path -Leaf $ProjectDir

function Show-Help {
    Write-Host @"
Portable Setup Helper for Stellantis IAM Portal

Usage:
  .\PORTABLE_SETUP.ps1 -Action install  # Install dependencies
  .\PORTABLE_SETUP.ps1 -Action dev      # Start dev server
  .\PORTABLE_SETUP.ps1 -Action build    # Build for production
  .\PORTABLE_SETUP.ps1 -Action help     # Show this help

Steps:
1. On a machine WITH external npm access, run:
   .\PORTABLE_SETUP.ps1 -Action install

2. Copy the entire project folder back to your machine

3. On your machine, run:
   .\PORTABLE_SETUP.ps1 -Action dev

The app will launch at http://localhost:5173
"@
}

function Install-Dependencies {
    Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
    npm install --verbose
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Installation complete!" -ForegroundColor Green
        Write-Host "Now copy this entire folder (including node_modules/) back to your machine." -ForegroundColor Yellow
    } else {
        Write-Host "✗ Installation failed. Check error output above." -ForegroundColor Red
        exit 1
    }
}

function Start-DevServer {
    if (-not (Test-Path "$ProjectDir\node_modules" -PathType Container)) {
        Write-Host "✗ node_modules not found!" -ForegroundColor Red
        Write-Host "Please run step 1-2 first (install on external machine, then copy back)." -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "Starting dev server..." -ForegroundColor Cyan
    npm run dev
}

function Build-Production {
    if (-not (Test-Path "$ProjectDir\node_modules" -PathType Container)) {
        Write-Host "✗ node_modules not found!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Building for production..." -ForegroundColor Cyan
    npm run build
}

# Execute action
switch ($Action.ToLower()) {
    "install" { Install-Dependencies }
    "dev" { Start-DevServer }
    "build" { Build-Production }
    default { Show-Help }
}
