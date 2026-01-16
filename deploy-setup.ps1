# 🚀 URL Shortener - Quick Deploy Setup

Write-Host "🚀 URL Shortener - Quick Deploy Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path .git)) {
    Write-Host "📦 Initializing git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git already initialized" -ForegroundColor Green
}

# Add all files
Write-Host ""
Write-Host "📁 Adding files to git..." -ForegroundColor Yellow
git add .

# Commit
Write-Host ""
Write-Host "💾 Creating commit..." -ForegroundColor Yellow
git commit -m "Ready for deployment - URL Shortener with frontend"

Write-Host ""
Write-Host "✅ Project is ready for deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create a repository on GitHub" -ForegroundColor White
Write-Host "2. Run these commands:" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/urlshortz.git" -ForegroundColor Gray
Write-Host "   git branch -M main" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Deploy on Render:" -ForegroundColor White
Write-Host "   → Go to https://dashboard.render.com" -ForegroundColor Gray
Write-Host "   → Click 'New +' → 'Blueprint'" -ForegroundColor Gray
Write-Host "   → Connect your GitHub repository" -ForegroundColor Gray
Write-Host "   → Render will auto-deploy with free SSL!" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 See DEPLOYMENT.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
