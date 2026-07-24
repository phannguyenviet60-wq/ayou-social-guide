import { NextRequest } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
import { searchKnowledge, formatKnowledgeContext } from "@/lib/knowledge";
import { buildSystemPromptWithKnowledge } from "@/lib/prompt";
import { matchFaq, getRandomFallbackReply } from "@/lib/faq";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

// 高相似度阈值 - 超过这个分数才走 LLM，否则直接引导人工
// 调低，让"第X课"、"第X篇"这类简短查询也能匹配到内容
const HIGH_SIMILARITY_THRESHOLD = 0.08;

export async function POST(request: NextRequest) {
  try {
    // 0. 限流检查（防刷）
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return new Response(
        JSON.stringify({
          error: `太频繁啦～歇 ${retryAfter} 秒再来哦`,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
          },
        }
      );
    }

    const { messages } = (await request.json()) as ChatRequest;

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "消息不能为空" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 获取用户最新的问题
    const latestUserMessage = messages.filter((m) => m.role === "user").pop();
    const userQuery = latestUserMessage?.content || "";

    // 1. 高频问题缓存匹配 - 0 Token 消耗直接返回
    const faqAnswer = matchFaq(userQuery);
    if (faqAnswer) {
      return createDirectStreamResponse(faqAnswer);
    }

    // 2. 检索知识库
    let knowledgeContext = "";
    let topScore = 0;
    try {
      // 检测是否是"第X课"、"第X篇"这类查询，使用更精确的搜索策略
      const lessonMatch = userQuery.match(/第(\d+)[课篇]/);
      
      if (lessonMatch) {
        // 如果是"第X课"查询，尝试多种搜索策略
        const lessonNum = lessonMatch[1];
        const searchQueries = [
          `第${lessonNum}课：`,  // 带冒号
          `第${lessonNum}课`,    // 不带冒号
          userQuery,            // 原始查询
        ];
        
        let foundMatch = false;
        for (const query of searchQueries) {
          const searchResult = await searchKnowledge(
            query,
            20, // 增加topK，确保更多内容被检索到
            0.01, // 降低minScore，让更多内容被检索到
            customHeaders
          );
          
          if (searchResult.code === 0 && searchResult.chunks.length > 0) {
            // 优先匹配精确的课程
            const exactMatch = searchResult.chunks.find(chunk => 
              chunk.content.includes(`第${lessonNum}课：`) || 
              chunk.content.startsWith(`第${lessonNum}课`)
            );
            
            if (exactMatch) {
              knowledgeContext = formatKnowledgeContext([exactMatch]);
              topScore = exactMatch.score || 0;
              foundMatch = true;
              break;
            }
          }
        }
        
        // 如果还是找不到，使用原始查询进行语义检索
        if (!foundMatch) {
          const searchResult = await searchKnowledge(
            userQuery,
            10,
            0.05,
            customHeaders
          );
          if (searchResult.code === 0 && searchResult.chunks.length > 0) {
            knowledgeContext = formatKnowledgeContext(searchResult.chunks);
            topScore = searchResult.chunks[0].score || 0;
          }
        }
      } else {
        // 普通查询，使用语义检索
        const searchResult = await searchKnowledge(
          userQuery,
          10,
          0.05,
          customHeaders
        );
        if (searchResult.code === 0 && searchResult.chunks.length > 0) {
          knowledgeContext = formatKnowledgeContext(searchResult.chunks);
          topScore = searchResult.chunks[0].score || 0;
        }
      }
    } catch (searchError) {
      console.error("知识库检索失败:", searchError);
      // 知识库挂了也不怕，直接走兜底引导人工
    }

    // 3. 低相似度直接引导人工客服 - 不调用 LLM，省 Token
    // 只有当最高分超过阈值时，才认为知识库中有相关内容，需要 LLM 组织语言
    if (!knowledgeContext || topScore < HIGH_SIMILARITY_THRESHOLD) {
      const reply = getRandomFallbackReply();
      return createDirectStreamResponse(reply);
    }

    // 4. 构建系统提示词 + 知识库上下文
    const systemPrompt = buildSystemPromptWithKnowledge(knowledgeContext);

    // 只保留最近 3 轮对话 + 当前问题，省 Token
    const recentMessages = getRecentMessages(messages, 3);
    const llmMessages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      { role: "system", content: systemPrompt },
      ...recentMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // 5. 调用 LLM 流式输出（用最小模型，省成本）
    const config = new Config();
    const llmClient = new LLMClient(config, customHeaders);

    const stream = llmClient.stream(llmMessages, {
      model: "doubao-seed-2-0-mini-260215", // 用 mini 版本，更快更便宜
      temperature: 0.5, // 降低温度，输出更稳定
      thinking: "disabled",
    });

    // 6. 创建 SSE 流式响应
    return createSSEStreamResponse(stream);
  } catch (error) {
    console.error("聊天接口错误:", error);
    // 兜底：出错了也给用户一个友好的回复
    return createDirectStreamResponse(
      "宝～我这边网络有点小波动，你再问一次好不好？不行的话直接找我人工客服也可以哦～💦"
    );
  }
}

// 工具函数：直接返回一个流式响应（不调用 LLM，0 Token）
function createDirectStreamResponse(text: string): Response {
  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    start(controller) {
      // 模拟流式输出，分段发送，体验和真实 LLM 一样
      // 但因为是本地生成，0 Token 消耗
      const chunks = splitTextForStreaming(text);
      let index = 0;

      const sendNext = () => {
        if (index >= chunks.length) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
          );
          controller.close();
          return;
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ content: chunks[index] })}\n\n`
          )
        );
        index++;
        // 每段间隔 15-30ms，模拟自然打字速度
        const delay = 15 + Math.random() * 15;
        setTimeout(sendNext, delay);
      };

      sendNext();
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

// 工具函数：把文本拆成小段，模拟流式输出
function splitTextForStreaming(text: string): string[] {
  const chunks: string[] = [];
  // 按字符拆分，每 1-3 个字一段，模拟打字效果
  let i = 0;
  while (i < text.length) {
    const chunkSize = 1 + Math.floor(Math.random() * 3);
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize;
  }
  return chunks;
}

// 工具函数：用 LLM 流式输出创建 SSE 响应
function createSSEStreamResponse(
  stream: AsyncGenerator<{ content?: unknown }, unknown, unknown>
): Response {
  const encoder = new TextEncoder();
  let isCancelled = false;

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream as AsyncIterable<{ content?: unknown }>) {
          if (isCancelled) break;
          if (chunk.content) {
            const text = chunk.content.toString();
            try {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ content: text })}\n\n`
                )
              );
            } catch {
              isCancelled = true;
              break;
            }
          }
        }
        if (!isCancelled) {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
            );
          } catch {
            // 忽略
          }
        }
      } catch (streamError) {
        console.error("流式输出错误:", streamError);
        if (!isCancelled) {
          try {
            // LLM 挂了？兜底返回人工客服引导
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  content: getRandomFallbackReply(),
                })}\n\n`
              )
            );
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
            );
          } catch {
            // 忽略
          }
        }
      } finally {
        if (!isCancelled) {
          try {
            controller.close();
          } catch {
            // 忽略
          }
        }
      }
    },
    cancel() {
      isCancelled = true;
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

// 工具函数：只保留最近 N 轮对话
function getRecentMessages(
  messages: ChatMessage[],
  rounds: number
): ChatMessage[] {
  // rounds 表示保留多少轮 user-assistant 对话
  // 最后一条用户消息必须保留
  const maxMessages = rounds * 2 + 1; // 每轮2条 + 最后1条用户消息
  if (messages.length <= maxMessages) return messages;
  return messages.slice(messages.length - maxMessages);
}
