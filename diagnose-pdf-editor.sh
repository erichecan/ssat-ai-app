#!/bin/bash
# PDF Editor诊断脚本 - 更新于 2024-01-21 03:20:00
# 使用方法: ./diagnose-pdf-editor.sh

echo "🔍 PDF Editor诊断报告"
echo "======================"

# 检查应用是否存在
echo "📁 应用位置检查:"
if [ -d "/Applications/PDF Editor.app" ]; then
    echo "✅ PDF Editor.app 存在于 /Applications/"
else
    echo "❌ PDF Editor.app 未找到"
    exit 1
fi

# 检查应用权限
echo ""
echo "🔐 权限检查:"
ls -la "/Applications/PDF Editor.app" | head -1

# 检查代码签名
echo ""
echo "📝 代码签名检查:"
codesign -dv "/Applications/PDF Editor.app" 2>&1 | head -5

# 检查隔离属性
echo ""
echo "🚫 隔离属性检查:"
if xattr -l "/Applications/PDF Editor.app" | grep -q "com.apple.quarantine"; then
    echo "⚠️  发现隔离属性，需要移除"
else
    echo "✅ 无隔离属性"
fi

# 检查系统版本
echo ""
echo "💻 系统信息:"
sw_vers

# 检查SIP状态
echo ""
echo "🛡️  SIP状态:"
if csrutil status | grep -q "disabled"; then
    echo "⚠️  SIP已禁用"
else
    echo "✅ SIP已启用"
fi

# 检查应用缓存
echo ""
echo "🗂️  缓存检查:"
if [ -d "~/Library/Caches/ah.pdf" ]; then
    echo "📁 发现应用缓存"
    ls -la ~/Library/Caches/ah.pdf | head -3
else
    echo "✅ 无应用缓存"
fi

# 检查偏好设置
echo ""
echo "⚙️  偏好设置检查:"
if [ -f "~/Library/Preferences/ah.pdf.plist" ]; then
    echo "📄 发现偏好设置文件"
    ls -la ~/Library/Preferences/ah.pdf.plist
else
    echo "✅ 无偏好设置文件"
fi

# 检查崩溃日志
echo ""
echo "📊 崩溃日志检查:"
recent_crashes=$(ls -t ~/Library/Logs/DiagnosticReports/ | grep -i "pdf" | head -3)
if [ -n "$recent_crashes" ]; then
    echo "⚠️  发现最近的崩溃日志:"
    echo "$recent_crashes"
else
    echo "✅ 无最近的崩溃日志"
fi

# 建议解决方案
echo ""
echo "💡 建议解决方案:"
echo "1. 如果发现隔离属性，运行: sudo xattr -rd com.apple.quarantine '/Applications/PDF Editor.app'"
echo "2. 清理缓存: rm -rf ~/Library/Caches/ah.pdf"
echo "3. 重置偏好设置: rm -rf ~/Library/Preferences/ah.pdf.plist"
echo "4. 尝试安全模式启动: open -a 'PDF Editor' --args --safe-mode"
echo "5. 检查应用是否与macOS 15.5兼容"
echo "6. 考虑重新安装应用"

echo ""
echo "🔧 诊断完成" 