// 高频问题缓存 - 0 Token 消耗，直接返回答案
// 这些是用户最常问的问题，匹配到了直接回答，不调用 LLM
// ⚠️ 加得越多越省 Token！有新的常见问题就往这里加

import lessonsCatalog from './lessons-catalog.json';

export interface FaqItem {
  keywords: string[]; // 关键词列表，命中任意一个就算匹配
  answer: string; // 直接返回的答案
}

// 你可以在这里继续加，越全越省 Token
// 格式说明：
// {
//   keywords: ["关键词1", "关键词2"],   ← 用户说的话里包含这些词就触发
//   answer: "回答内容"                  ← 直接返回给用户的话
// }
export const FAQ_LIST: FaqItem[] = [
  {
    keywords: ["解压密码", "解压码", "压缩包密码", "密码是啥", "密码是多少"],
    answer:
      "宝～所有压缩包的解压密码都是：ayou2026 💕\n\n👉 小提醒：\n1. 请用电脑解压哦，手机端容易失败\n2. 推荐用 WinRAR 或 7-Zip\n3. mac 宝子用 The Unarchiver\n4. 注意区分大小写哦～",
  },
  {
    keywords: ["怎么下载", "如何下载", "在哪下载", "下载地址", "下载链接", "网盘链接", "百度网盘"],
    answer:
      "姐妹～购买后百度网盘链接会自动发货的哦！📦\n\n👉 下载步骤：\n1. 打开链接保存到自己的网盘\n2. 建议用百度网盘APP下载，速度更快\n3. 大文件用电脑端下，不容易断\n\n如果链接失效了，你可以直接给我留言补发哈～",
  },
  {
    keywords: ["资料内容", "包含什么", "有什么内容", "都有啥", "包括哪些", "内容介绍", "指南内容"],
    answer:
      "宝～这本《社会化指南》内容超全的！📚\n\n👉 主要内容：\n✅ 基础入门篇 - 社恐小白也能看懂的社交原理\n✅ 场景实战篇 - 职场/聚会/约会等常见场景应对\n✅ 话术模板篇 - 直接用的聊天话术和回复技巧\n✅ 心态建设篇 - 从内到外建立社交自信\n✅ 后续会持续更新新的章节～\n\n慢慢看，别着急，我们一步一步来💕",
  },
  {
    keywords: ["更新", "会更吗", "有没有更新", "持续更新"],
    answer:
      "宝子放心～资料会不定期更新的！✨\n\n更新后我会在朋友圈通知，不用额外花钱，买了就是终身有效哒～\n百度网盘链接也是永久有效的，不用担心过期哦💕",
  },
  {
    // 退款问题 - 柔软道歉 + 委婉拒绝 + 提供当场解答
    // 强制话术：不说退或不退，用"网盘资料发货后系统机制无法退回"委婉表达
    keywords: ["退款", "退钱", "能不能退", "可以退吗", "不想要了", "想退", "退货", "被骗", "骗人", "智商税"],
    answer:
      "宝子，没能完全契合你的预期，阿柚真的很抱歉（鞠躬🙇‍♀️）。因为网盘资料发货后系统机制是无法操作退回的，但我是真心希望能帮到你！是不是觉得内容太泛了？你随便抛一个具体的社交痛点给我，我当场帮你拆解好吗？",
  },
  {
    // 觉得没用 / 套用不上 - 顺毛安抚 + 主动提出具体分析
    keywords: ["没用", "不好用", "用不上", "没用啊", "没什么用", "没效果", "白费", "白买了", "不值"],
    answer:
      "抱抱宝子🥺，觉得套用不上，可能是还没遇到完全对应的场景。改变沟通习惯需要慢慢来哦～你最近遇到了什么棘手的人际麻烦？直接打字发给我，我立刻帮你从资料里匹配最管用的那句原话好不好？",
  },
  {
    // 资料太乱 / 找不着 - 安抚急躁 + 提供一键直达检索
    keywords: ["太乱", "找不到", "找不着", "怎么找", "在哪找", "在哪里", "眼花", "太多了", "怎么翻"],
    answer:
      "别急别急宝子，摸摸头～资料干货确实有点多，看起来容易眼花。你想找哪个具体的场景？比如『拒绝同事』或者『反击PUA』，直接发关键词给我，我直接把那一页的核心步骤和方法提炼给你哦！",
  },
  {
    keywords: ["客服", "人工", "联系你", "怎么找你", "怎么联系"],
    answer:
      "宝～有任何问题都可以给我留言哦！💬\n\n我每天都会看消息，看到了就会回复你的～一般工作时间（9:00-22:00）回复会比较快，非工作时间可能会慢一点哈，见谅啦～",
  },
  {
    keywords: ["手机解压", "手机打不开", "手机解不了"],
    answer:
      "姐妹！手机端解压经常出问题的，建议用电脑解压哦～💻\n\n👉 正确姿势：\n1. 电脑下载后用 WinRAR 或 7-Zip 解压\n2. 密码是 ayou2026（注意大小写）\n3. 如果还是不行，给我留言我帮你想办法～",
  },
  {
    keywords: ["链接失效", "链接打不开", "链接挂了", "链接过期"],
    answer:
      "宝别急！链接失效了直接给我留言就行～🔗\n\n我看到后会第一时间给你发新链接，不耽误你学习的～💕",
  },
  {
    keywords: ["你是谁", "你叫什么", "你是AI吗", "你是机器人吗"],
    answer:
      "哈哈宝子～我是阿柚呀！🍊\n\n就是那个在小红书分享运营干货的阿柚～有什么关于资料的问题尽管问我哦，我都会认真回答你的～😘",
  },
];

// 检查是否命中高频问题
export function matchFaq(query: string): string | null {
  const lowerQuery = query.toLowerCase().trim();
  
  // 特殊处理：检测"第X课"这类查询
  const lessonMatch = query.match(/第(\d+)课/);
  if (lessonMatch) {
    const lessonNum = parseInt(lessonMatch[1]);
    // 从课程目录中查找该课的信息
    const lesson = lessonsCatalog.find((l: { num: number }) => l.num === lessonNum);
    if (lesson) {
      return `宝～第${lesson.num}课是《${lesson.title}》哦！\n\n💡 核心洞察：${lesson.insight}\n\n想深入了解的话，可以翻到资料里第${lesson.num}课详细看看～里面有更具体的方法和场景分析哦💕`;
    } else {
      return `宝～你想了解第${lessonNum}课的内容呀？\n\n你可以直接告诉我你想了解的具体问题哦，比如：\n- 第${lessonNum}课的核心观点是什么？\n- 第${lessonNum}课有哪些实用技巧？\n- 第${lessonNum}课的方法怎么用？\n\n这样我能更精准地帮你找到对应的内容～💕`;
    }
  }
  
  // 特殊处理：检测"第X篇"这类查询
  const chapterMatch = query.match(/第([一二三四五六七八九十\d]+)篇/);
  if (chapterMatch) {
    const chapterNum = chapterMatch[1];
    // 中文数字转阿拉伯数字
    const numMap: Record<string, number> = {
      '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
      '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
    };
    const chapterIndex = numMap[chapterNum] || parseInt(chapterNum);
    
    const chapterNames = [
      '认知基础篇',
      '人际交往篇',
      '自我成长篇',
      '自我保护篇',
      '职场篇',
      '人情世故篇',
      '话术工具篇',
      '春节及节日篇'
    ];
    
    if (chapterIndex >= 1 && chapterIndex <= chapterNames.length) {
      const chapterName = chapterNames[chapterIndex - 1];
      // 计算该篇包含的课程范围
      const lessonRanges = [
        [1, 20],    // 第一篇：1-20课
        [21, 43],   // 第二篇：21-43课
        [44, 62],   // 第三篇：44-62课
        [63, 81],   // 第四篇：63-81课 (实际是第四篇_自我保护篇，但课程编号可能不同)
        [82, 99],   // 第五篇：82-99课
        [100, 108], // 第六篇：100-108课
        [109, 118], // 第七篇：109-118课
        [119, 128]  // 第八篇：119-128课
      ];
      
      const [startLesson, endLesson] = lessonRanges[chapterIndex - 1] || [1, 20];
      
      return `宝～第${chapterIndex}篇是《${chapterName}》哦！\n\n📚 这一篇包含第${startLesson}课到第${endLesson}课，共${endLesson - startLesson + 1}课的内容～\n\n你可以告诉我你想了解哪一课，或者直接问具体的问题，我帮你找到对应的内容💕`;
    }
  }

  for (const faq of FAQ_LIST) {
    for (const keyword of faq.keywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        return faq.answer;
      }
    }
  }

  return null;
}

// 兜底话术 - 知识库没有的内容，婉转回复
// 不说"找人工"，因为是虚拟产品自交付
// 温柔引导用户翻资料，或者留言反馈
const DEFAULT_REPLIES = [
  "宝～这个问题指南里好像没有详细写到呢，你可以先翻一下目录看看有没有相关的章节～如果确实找不到，给我留言具体问题，我看看能不能补充进去💕",
  "宝子，这个内容我得确认一下有没有收录到指南里～你可以先浏览一下资料的文件夹，说不定就藏在哪个角落里呢哈哈～如果真的没有，你跟我说一声，我记下来后续补上！",
  "不好意思呀亲爱的，这个问题暂时不在指南范围内～你先看看指南里其他内容有没有能帮到你的，有什么需求随时留言，我尽力安排～",
  "宝～指南里目前没有这块内容呢，不过你可以先看看现有的章节，都是很实用的干货！有什么想补充的方向也可以跟我说，我记在小本本上📒",
];

// 随机返回一个兜底话术
export function getRandomFallbackReply(): string {
  const index = Math.floor(Math.random() * DEFAULT_REPLIES.length);
  return DEFAULT_REPLIES[index];
}
