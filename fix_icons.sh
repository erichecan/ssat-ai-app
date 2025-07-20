#!/bin/bash

# 修复所有使用 Heroicons 的文件
files=(
  "/Users/sophie/Desktop/eriche/ssat-ai-app/app/test/page.tsx"
  "/Users/sophie/Desktop/eriche/ssat-ai-app/app/mistakes/page.tsx"
  "/Users/sophie/Desktop/eriche/ssat-ai-app/app/leaderboard/page.tsx"
)

for file in "${files[@]}"; do
  echo "修复文件: $file"
  
  # 替换 Heroicons 导入为 Lucide React
  sed -i '' 's/@heroicons\/react\/24\/outline/lucide-react/g' "$file"
  sed -i '' 's/@heroicons\/react\/24\/solid/lucide-react/g' "$file"
  
  # 替换具体的图标名称
  sed -i '' 's/XMarkIcon/X/g' "$file"
  sed -i '' 's/HomeIcon/House/g' "$file"
  sed -i '' 's/MagnifyingGlassIcon/Search/g' "$file"
  sed -i '' 's/BookmarkIcon/Bookmark/g' "$file"
  sed -i '' 's/UserIcon/User/g' "$file"
  sed -i '' 's/ArrowLeftIcon/ArrowLeft/g' "$file"
  sed -i '' 's/ListBulletIcon/List/g' "$file"
  sed -i '' 's/CheckIcon/Check/g' "$file"
  sed -i '' 's/UserCircleIcon/User/g' "$file"
  sed -i '' 's/BookOpenIcon/BookOpen/g' "$file"
  
  # 替换 className 使用
  sed -i '' 's/className="h-6 w-6"/size={24}/g' "$file"
  sed -i '' 's/className="h-5 w-5"/className="h-5 w-5"/g' "$file"
  
  # 添加 Link 导入如果不存在
  if ! grep -q "import Link" "$file"; then
    sed -i '' '1a\
import Link from '\''next/link'\''
' "$file"
  fi
  
done

echo "所有文件已修复完成！"