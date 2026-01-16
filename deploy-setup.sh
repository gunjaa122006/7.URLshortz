#!/bin/bash

echo "🚀 URL Shortener - Quick Deploy Setup"
echo "======================================"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing git repository..."
    git init
    echo "✅ Git initialized"
else
    echo "✅ Git already initialized"
fi

# Add all files
echo ""
echo "📁 Adding files to git..."
git add .

# Commit
echo ""
echo "💾 Creating commit..."
git commit -m "Ready for deployment - URL Shortener with frontend"

echo ""
echo "✅ Project is ready for deployment!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Create a repository on GitHub"
echo "2. Run these commands:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/urlshortz.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Deploy on Render:"
echo "   → Go to https://dashboard.render.com"
echo "   → Click 'New +' → 'Blueprint'"
echo "   → Connect your GitHub repository"
echo "   → Render will auto-deploy with free SSL!"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
