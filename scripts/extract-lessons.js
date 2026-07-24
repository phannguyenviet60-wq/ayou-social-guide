#!/usr/bin/env node
/**
 * 提取所有课程标题和核心洞察
 */

const fs = require('fs');
const path = require('path');

const FILES = [
  '第一篇_认知基础篇_20260724165145987.txt',
  '第二篇_人际交往篇.txt',
  '第三篇_自我成长篇.txt',
  '第四篇_自我保护篇.txt',
  '第五篇_职场篇.txt',
  '第六篇_人情世故篇.txt',
  '第七篇_话术工具篇.txt',
  '第八篇_春节及节日篇.txt',
];

const lessons = [];

for (const file of FILES) {
  const filePath = path.join(__dirname, '..', 'assets', file);
  if (!fs.existsSync(filePath)) continue;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  let currentLesson = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 匹配课程标题
    const titleMatch = line.match(/^第(\d+)课[：:](.+)/);
    if (titleMatch) {
      if (currentLesson) {
        lessons.push(currentLesson);
      }
      currentLesson = {
        num: parseInt(titleMatch[1]),
        title: titleMatch[2].trim(),
        insight: ''
      };
      continue;
    }
    
    // 匹配核心洞察
    if (currentLesson && line.startsWith('核心洞察：')) {
      currentLesson.insight = line.replace('核心洞察：', '').trim();
    }
  }
  
  if (currentLesson) {
    lessons.push(currentLesson);
  }
}

// 输出JSON格式
console.log(JSON.stringify(lessons, null, 2));
