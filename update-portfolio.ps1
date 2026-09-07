# update-portfolio.ps1
# Run this from the root of your local akachimaduako portfolio repository.
# It commits all website changes and pushes them to GitHub Pages.

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Akachi Maduako Portfolio Updater" -ForegroundColor Cyan
Write-Host "--------------------------------" -ForegroundColor Cyan

if (!(Test-Path ".git")) {
    Write-Host "ERROR: This folder is not a Git repository." -ForegroundColor Red
    Write-Host "Open PowerShell in the root folder of your deployed portfolio first."
    exit 1
}

Write-Host "Checking changes..."
git status --short

$changes = git status --porcelain
if (-not $changes) {
    Write-Host "No changes to upload." -ForegroundColor Yellow
    exit 0
}

$stamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$defaultMessage = "Update portfolio - $stamp"
$message = Read-Host "Commit message (press Enter for '$defaultMessage')"
if ([string]::IsNullOrWhiteSpace($message)) {
    $message = $defaultMessage
}

git add .
git commit -m $message

Write-Host ""
Write-Host "Uploading to GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Upload complete." -ForegroundColor Green
    Write-Host "GitHub Pages will deploy the update automatically."
    Write-Host "Website: https://akachimaduako.com/"
    Write-Host "NeonStudio: https://akachimaduako.com/neonstudio/"
    Write-Host "Privacy: https://akachimaduako.com/neonstudio/privacy/"
} else {
    Write-Host "Git push failed. Review the Git output above." -ForegroundColor Red
    exit 1
}
