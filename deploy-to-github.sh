#!/bin/bash
# SSAT AI学习平台 - GitHub部署脚本
# 使用方法: ./deploy-to-github.sh YOUR_GITHUB_USERNAME

set -e

# 检查参数
if [ $# -eq 0 ]; then
    echo "❌ 请提供GitHub用户名"
    echo "使用方法: ./deploy-to-github.sh YOUR_GITHUB_USERNAME"
    exit 1
fi

GITHUB_USERNAME=$1
REPO_NAME="ssat-ai-app"

echo "🚀 开始部署SSAT AI学习平台到GitHub..."
echo "👤 GitHub用户名: $GITHUB_USERNAME"
echo "📦 仓库名称: $REPO_NAME"

# 检查Git状态
echo "📋 检查Git状态..."
git status

# 确保所有更改已提交
echo "💾 添加并提交所有更改..."
git add .
git commit -m "最终版本 - 准备部署到GitHub

✅ 完整功能:
- 主页Dashboard
- 练习系统  
- 复习功能
- 闪卡训练
- AI聊天助手
- 用户设置
- 数据库集成
- Netlify部署配置

🔧 技术栈:
- Next.js 15
- React 19
- Tailwind CSS
- Supabase
- Google Gemini AI
- TypeScript

📅 $(date '+%Y-%m-%d %H:%M:%S')" || echo "没有新的更改需要提交"

# 检查是否已有远程仓库
if git remote get-url origin >/dev/null 2>&1; then
    echo "🔗 检测到现有远程仓库"
    git remote -v
    echo "🚀 推送到现有仓库..."
    git push origin main
else
    echo "➕ 添加GitHub远程仓库..."
    git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git
    
    echo "🌿 设置主分支..."
    git branch -M main
    
    echo "🚀 首次推送到GitHub..."
    git push -u origin main
fi

echo ""
echo "🎉 部署完成！"
echo "📍 GitHub仓库地址: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo "🌐 接下来可以在Netlify中连接此仓库进行部署"
echo ""
echo "📋 Netlify部署步骤:"
echo "1. 访问 https://netlify.com"
echo "2. 点击 'New site from Git'"
echo "3. 选择GitHub并授权"
echo "4. 选择 $GITHUB_USERNAME/$REPO_NAME 仓库"
echo "5. 配置构建设置 (参考 NETLIFY_DEPLOYMENT.md)"
echo "6. 添加环境变量"
echo "7. 触发部署" 