#!/bin/bash

echo "📊 快速状态检查"
echo "================="

# 检查进程
if ps aux | grep "batch-generate-vocabulary" | grep -v grep > /dev/null; then
    echo "✅ 后台进程正在运行"
else
    echo "❌ 后台进程已停止"
fi

# 检查最新日志
echo ""
echo "📝 最新日志 (最后10行):"
tail -10 vocabulary-generation.log

echo ""
echo "💡 使用命令:"
echo "   查看实时日志: tail -f vocabulary-generation.log"
echo "   停止进程: pkill -f batch-generate-vocabulary"
echo "   检查数据库: node scripts/check-generated-vocabulary.mjs"