/**
 * 批量上传知识库脚本
 * 从飞书导出的 TXT 文件中解析内容，按课拆分并上传
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// 读取文件内容
const filePath = join(process.cwd(), 'assets/第一篇_认知基础篇.txt');
const content = readFileSync(filePath, 'utf-8');

// 解析课程
function parseLessons(text: string): Array<{ title: string; content: string }> {
  const lessons: Array<{ title: string; content: string }> = [];
  
  // 按"第X课："分割
  const lessonRegex = /第\d+课：[^\n]+/g;
  const matches = [...text.matchAll(lessonRegex)];
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const title = match[0].trim();
    const start = match.index!;
    const end = i < matches.length - 1 ? matches[i + 1].index! : text.length;
    
    // 提取内容（从标题后到下一课标题前）
    let lessonContent = text.substring(start, end).trim();
    
    // 提取大标题（第一篇_认知基础篇）
    const bigTitleMatch = lessonContent.match(/^(第[一二三四五六七八篇]_[^\n]+)/m);
    const bigTitle = bigTitleMatch ? bigTitleMatch[1] : '';
    
    lessons.push({
      title,
      content: lessonContent
    });
  }
  
  return lessons;
}

const lessons = parseLessons(content);
console.log(`解析到 ${lessons.length} 课`);

// 输出前3课预览
lessons.slice(0, 3).forEach((lesson, i) => {
  console.log(`\n=== 第${i + 1}课 ===`);
  console.log(`标题：${lesson.title}`);
  console.log(`内容长度：${lesson.content.length} 字符`);
  console.log(`内容预览：${lesson.content.substring(0, 100)}...`);
});

// 生成上传命令
console.log('\n\n=== 上传命令 ===');
lessons.forEach((lesson, i) => {
  // 转义 JSON 特殊字符
  const escapedContent = lesson.content
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
  const escapedTitle = lesson.title
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
  
  console.log(`\n# 第${i + 1}课`);
  console.log(`curl -X POST http://localhost:5000/api/knowledge \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "Authorization: Bearer ayou2026" \\`);
  console.log(`  -d '{"title":"${escapedTitle}","content":"${escapedContent}"}'`);
});

console.log(`\n\n共 ${lessons.length} 课需要上传`);
