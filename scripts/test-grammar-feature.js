// 语法功能测试脚本 - 2024-12-19 14:30:25
// 验证语法学习功能的数据结构和逻辑

const { grammarRules } = require('../app/data/grammarRules.js');
const { grammarQuestions } = require('../app/data/grammarQuestions.js');

console.log('🧪 开始测试语法学习功能...\n');

// 测试1: 验证语法规则数据结构
console.log('📋 测试1: 验证语法规则数据结构');
console.log(`✅ 语法规则数量: ${grammarRules.length}`);
grammarRules.forEach((rule, index) => {
  console.log(`  ${index + 1}. ${rule.title} (ID: ${rule.id})`);
  console.log(`     示例数量: ${rule.examples.length}`);
  console.log(`     解释长度: ${rule.explanation.length} 字符`);
});
console.log('');

// 测试2: 验证练习题数据结构
console.log('📝 测试2: 验证练习题数据结构');
console.log(`✅ 练习题总数: ${grammarQuestions.length}`);

// 按语法规则分组统计
const questionsByRule = {};
grammarQuestions.forEach(question => {
  if (!questionsByRule[question.ruleId]) {
    questionsByRule[question.ruleId] = [];
  }
  questionsByRule[question.ruleId].push(question);
});

Object.keys(questionsByRule).forEach(ruleId => {
  const rule = grammarRules.find(r => r.id === ruleId);
  const questions = questionsByRule[ruleId];
  console.log(`  ${rule?.title}: ${questions.length} 道题`);
  
  questions.forEach((q, index) => {
    console.log(`    ${index + 1}. ${q.type === 'multiple-choice' ? '选择题' : '完形填空'}: ${q.question.substring(0, 50)}...`);
  });
});
console.log('');

// 测试3: 验证数据完整性
console.log('🔍 测试3: 验证数据完整性');
let allValid = true;

// 检查每个语法规则是否有对应的练习题
grammarRules.forEach(rule => {
  const questions = grammarQuestions.filter(q => q.ruleId === rule.id);
  if (questions.length === 0) {
    console.log(`❌ ${rule.title} 没有对应的练习题`);
    allValid = false;
  } else {
    console.log(`✅ ${rule.title}: ${questions.length} 道练习题`);
  }
});

// 检查练习题是否有对应的语法规则
grammarQuestions.forEach(question => {
  const rule = grammarRules.find(r => r.id === question.ruleId);
  if (!rule) {
    console.log(`❌ 练习题 ${question.id} 引用了不存在的语法规则: ${question.ruleId}`);
    allValid = false;
  }
});

console.log('');

// 测试4: 验证题目类型分布
console.log('📊 测试4: 验证题目类型分布');
const typeCount = {};
grammarQuestions.forEach(q => {
  typeCount[q.type] = (typeCount[q.type] || 0) + 1;
});

Object.keys(typeCount).forEach(type => {
  console.log(`  ${type === 'multiple-choice' ? '选择题' : '完形填空'}: ${typeCount[type]} 道`);
});

console.log('');

// 测试5: 验证答案正确性
console.log('✅ 测试5: 验证答案正确性');
let answerValid = true;

grammarQuestions.forEach(question => {
  if (!question.options.includes(question.answer)) {
    console.log(`❌ 练习题 ${question.id} 的答案不在选项中: ${question.answer}`);
    answerValid = false;
  }
});

if (answerValid) {
  console.log('✅ 所有答案都在对应选项中');
}

console.log('');

// 总结
console.log('📈 测试总结:');
console.log(`  语法规则: ${grammarRules.length} 个`);
console.log(`  练习题: ${grammarQuestions.length} 道`);
console.log(`  数据完整性: ${allValid ? '✅ 通过' : '❌ 失败'}`);
console.log(`  答案正确性: ${answerValid ? '✅ 通过' : '❌ 失败'}`);

if (allValid && answerValid) {
  console.log('\n🎉 所有测试通过！语法学习功能数据结构完整且正确。');
} else {
  console.log('\n⚠️  发现一些问题，请检查上述错误信息。');
} 