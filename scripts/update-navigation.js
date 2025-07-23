// 更新导航脚本 - 2024-12-19 14:30:25
// 批量更新所有页面的底部导航，添加Grammar选项

const fs = require('fs');
const path = require('path');

// 需要更新的页面文件
const pagesToUpdate = [
  'app/practice/page.tsx',
  'app/flashcard/page.tsx',
  'app/profile/page.tsx',
  'app/settings/page.tsx',
  'app/review/page.tsx',
  'app/review/mistakes/page.tsx',
  'app/test/page.tsx',
  'app/test/results/page.tsx',
  'app/upload/page.tsx',
  'app/study/page.tsx'
];

function updatePageNavigation(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 检查是否需要添加FileText导入
    if (!content.includes('FileText')) {
      content = content.replace(
        /import \{([^}]+)\} from 'lucide-react';/,
        (match, imports) => {
          if (!imports.includes('FileText')) {
            return `import {${imports}, FileText} from 'lucide-react';`;
          }
          return match;
        }
      );
    }
    
    // 查找并替换导航部分
    const navigationStart = content.indexOf('{/* Bottom Navigation */}');
    if (navigationStart === -1) {
      console.log(`⚠️  未找到导航注释: ${filePath}`);
      return false;
    }
    
    // 找到导航结束位置
    const navigationEnd = content.indexOf('</div>', navigationStart);
    if (navigationEnd === -1) {
      console.log(`⚠️  未找到导航结束: ${filePath}`);
      return false;
    }
    
    // 找到完整的导航结束（包括安全区域）
    const fullNavigationEnd = content.indexOf('<div className="h-5 bg-slate-50"></div>', navigationEnd);
    if (fullNavigationEnd === -1) {
      console.log(`⚠️  未找到完整导航结束: ${filePath}`);
      return false;
    }
    
    // 构建新的导航
    const newNavigation = `      {/* Bottom Navigation */}
      <div>
        <div className="flex gap-2 border-t border-[#e7edf3] bg-slate-50 px-4 pb-3 pt-2">
          <Link href="/" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
            <div className="text-[#4e7397] flex h-8 items-center justify-center">
              <House size={24} />
            </div>
            <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Home</p>
          </Link>
          <Link href="/practice" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
            <div className="text-[#4e7397] flex h-8 items-center justify-center">
              <BookOpen size={24} />
            </div>
            <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Practice</p>
          </Link>
          <Link href="/grammar" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
            <div className="text-[#4e7397] flex h-8 items-center justify-center">
              <FileText size={24} />
            </div>
            <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Grammar</p>
          </Link>
          <Link href="/flashcard" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
            <div className="text-[#4e7397] flex h-8 items-center justify-center">
              <Brain size={24} />
            </div>
            <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Vocabulary</p>
          </Link>
          <Link href="/profile" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
            <div className="text-[#4e7397] flex h-8 items-center justify-center">
              <User size={24} />
            </div>
            <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Profile</p>
          </Link>
        </div>
        <div className="h-5 bg-slate-50"></div>
      </div>`;
    
    // 替换导航部分
    const beforeNavigation = content.substring(0, navigationStart);
    const afterNavigation = content.substring(fullNavigationEnd + '<div className="h-5 bg-slate-50"></div>'.length);
    
    const updatedContent = beforeNavigation + newNavigation + afterNavigation;
    
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`✅ 已更新: ${filePath}`);
    return true;
    
  } catch (error) {
    console.error(`❌ 更新失败: ${filePath}`, error.message);
    return false;
  }
}

// 主函数
function main() {
  console.log('🔄 开始更新页面导航...\n');
  
  let updatedCount = 0;
  let totalCount = pagesToUpdate.length;
  
  pagesToUpdate.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      if (updatePageNavigation(filePath)) {
        updatedCount++;
      }
    } else {
      console.log(`❌ 文件不存在: ${filePath}`);
    }
  });
  
  console.log(`\n📊 更新完成: ${updatedCount}/${totalCount} 个文件已更新`);
  
  if (updatedCount === totalCount) {
    console.log('🎉 所有页面导航更新成功！');
  } else {
    console.log('⚠️  部分页面更新失败，请手动检查');
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { updatePageNavigation }; 