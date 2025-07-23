#!/bin/bash
# PDF Editor安全警告修复脚本 - 更新于 2024-01-21 03:15:00
# 使用方法: sudo ./fix-pdf-editor.sh

echo "🔧 开始修复PDF Editor安全警告..."

# 检查应用是否存在
if [ ! -d "/Applications/PDF Editor.app" ]; then
    echo "❌ 错误: PDF Editor.app 未找到在 /Applications/ 目录中"
    echo "请确保应用已正确安装到Applications文件夹"
    exit 1
fi

echo "✅ 找到PDF Editor.app"

# 检查当前隔离属性
echo "📋 检查当前隔离属性..."
xattr -l "/Applications/PDF Editor.app" | grep -q "com.apple.quarantine"
if [ $? -eq 0 ]; then
    echo "⚠️  发现隔离属性，正在移除..."
    
    # 移除隔离属性
    sudo xattr -rd com.apple.quarantine "/Applications/PDF Editor.app"
    
    if [ $? -eq 0 ]; then
        echo "✅ 隔离属性已成功移除"
    else
        echo "❌ 移除隔离属性失败"
        exit 1
    fi
else
    echo "✅ 未发现隔离属性，无需移除"
fi

# 验证修复结果
echo "🔍 验证修复结果..."
xattr -l "/Applications/PDF Editor.app" | grep -q "com.apple.quarantine"
if [ $? -ne 0 ]; then
    echo "✅ 验证成功: 隔离属性已完全移除"
else
    echo "❌ 验证失败: 隔离属性仍然存在"
    exit 1
fi

# 尝试打开应用
echo "🚀 尝试打开PDF Editor..."
open "/Applications/PDF Editor.app"

if [ $? -eq 0 ]; then
    echo "✅ PDF Editor已成功启动"
    echo "🎉 修复完成！应用现在应该可以正常使用了"
else
    echo "⚠️  应用启动可能遇到其他问题"
    echo "💡 建议检查系统偏好设置 > 安全性与隐私 > 通用"
fi

echo ""
echo "📝 如果问题仍然存在，请尝试以下步骤："
echo "1. 打开系统偏好设置 > 安全性与隐私 > 通用"
echo "2. 点击'仍要打开'按钮"
echo "3. 或者选择'打开'来允许应用运行" 