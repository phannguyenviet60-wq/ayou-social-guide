#!/usr/bin/env node
/**
 * 批量上传知识库脚本
 * 将118课内容按课为单位上传到知识库
 */

const fs = require('fs');
const path = require('path');

// 知识库API地址
const API_URL = 'http://localhost:5000/api/knowledge';
const ADMIN_TOKEN = 'ayou2026';

// 文件路径
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

/**
 * 解析文件内容，按课分割
 */
function parseLessons(content, fileName) {
  const lessons = [];
  
  // 按"第X课"分割
  const lessonPattern = /第(\d+)课[：:](.+?)(?=第\d+课[：:]|$)/gs;
  let match;
  
  while ((match = lessonPattern.exec(content)) !== null) {
    const lessonNum = match[1];
    const lessonContent = match[0].trim();
    
    // 提取课程标题（第一行）
    const firstLine = lessonContent.split('\n')[0];
    const titleMatch = firstLine.match(/第(\d+)课[：:](.+)/);
    const title = titleMatch ? titleMatch[2].trim() : `第${lessonNum}课`;
    
    lessons.push({
      num: parseInt(lessonNum),
      title: title,
      content: lessonContent,
      fileName: fileName
    });
  }
  
  return lessons;
}

/**
 * 上传单条内容到知识库
 * 优化格式：确保标题在内容开头，便于语义检索
 */
async function uploadToKnowledge(title, content) {
  // 优化格式：标题重复3次，确保语义检索能匹配到
  const fullContent = `${title}\n${title}\n${title}\n\n${content}`;
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({
        title: title,
        content: fullContent
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return { success: true, doc_ids: data.doc_ids };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 延迟函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始批量上传知识库...\n');
  
  let totalLessons = 0;
  let successCount = 0;
  let failCount = 0;
  const failedLessons = [];
  
  // 读取所有文件
  for (const file of FILES) {
    const filePath = path.join(__dirname, '..', 'assets', file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  文件不存在: ${file}`);
      continue;
    }
    
    console.log(`📖 读取文件: ${file}`);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 解析课程
    const lessons = parseLessons(content, file);
    console.log(`   找到 ${lessons.length} 课\n`);
    
    // 上传每课
    for (const lesson of lessons) {
      totalLessons++;
      const lessonTitle = `第${lesson.num}课：${lesson.title}`;
      
      console.log(`📤 上传: ${lessonTitle}`);
      const result = await uploadToKnowledge(lessonTitle, lesson.content);
      
      if (result.success) {
        successCount++;
        console.log(`   ✅ 成功 (doc_ids: ${result.doc_ids?.join(', ')})`);
      } else {
        failCount++;
        failedLessons.push({ num: lesson.num, title: lesson.title, error: result.error });
        console.log(`   ❌ 失败: ${result.error}`);
      }
      
      // 延迟避免请求过快
      await sleep(500);
    }
    
    console.log('');
  }
  
  // 输出统计
  console.log('\n' + '='.repeat(50));
  console.log('📊 上传完成统计:');
  console.log(`   总课数: ${totalLessons}`);
  console.log(`   成功: ${successCount}`);
  console.log(`   失败: ${failCount}`);
  
  if (failedLessons.length > 0) {
    console.log('\n❌ 失败的课程:');
    failedLessons.forEach(l => {
      console.log(`   第${l.num}课: ${l.title} - ${l.error}`);
    });
  }
  
  console.log('='.repeat(50));
}

main().catch(console.error);
