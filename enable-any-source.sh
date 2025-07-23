#!/bin/bash
# 启用任何来源应用程序脚本 - 更新于 2024-01-21 03:25:00
# 使用方法: sudo ./enable-any-source.sh

echo "🔓 启用任何来源应用程序"
echo "========================"

# 检查当前状态
echo "📊 当前Gatekeeper状态:"
spctl --status

echo ""
echo "🔧 正在禁用Gatekeeper评估系统..."

# 禁用Gatekeeper
sudo spctl --master-disable

if [ $? -eq 0 ]; then
    echo "✅ Gatekeeper已禁用"
else
    echo "⚠️  需要在系统设置中手动确认"
    echo "💡 请按照以下步骤操作："
    echo "1. 打开系统偏好设置 > 安全性与隐私 > 通用"
    echo "2. 点击左下角的锁图标并输入密码"
    echo "3. 选择'任何来源'选项"
    echo "4. 确认更改"
fi

echo ""
echo "🔍 验证设置:"
spctl --status

echo ""
echo "📝 说明:"
echo "- 此设置允许运行任何来源的应用程序"
echo "- 包括从互联网下载的未签名应用"
echo "- 请确保只运行来自可信来源的软件"
echo "- 如需重新启用，运行: sudo spctl --master-enable"

echo ""
echo "🎉 设置完成！现在可以运行任何来源的应用程序了" 