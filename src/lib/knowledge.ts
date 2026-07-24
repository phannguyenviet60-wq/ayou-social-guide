import {
  KnowledgeClient,
  Config,
  DataSourceType,
  type KnowledgeDocument,
  type ChunkConfig,
  type KnowledgeChunk,
} from "coze-coding-dev-sdk";

// 数据集名称 - 小红书虚拟产品知识库
export const DATASET_NAME = "xiaohongshu_virtual_products";

// 分块配置 - 增大 max_tokens 确保每课内容不被分割
export const chunkConfig: ChunkConfig = {
  separator: "\n\n",
  max_tokens: 4000, // 增大到4000，确保每课内容完整
  remove_extra_spaces: false,
  remove_urls_emails: false,
};

// 创建知识库客户端
export function createKnowledgeClient(
  customHeaders?: Record<string, string>
) {
  const config = new Config();
  return new KnowledgeClient(config, customHeaders);
}

// 添加文本到知识库
export async function addTextToKnowledge(
  text: string,
  customHeaders?: Record<string, string>
) {
  const client = createKnowledgeClient(customHeaders);
  const documents: KnowledgeDocument[] = [
    {
      source: DataSourceType.TEXT,
      raw_data: text,
    },
  ];

  const response = await client.addDocuments(
    documents,
    DATASET_NAME,
    chunkConfig
  );
  return response;
}

// 搜索知识库
export async function searchKnowledge(
  query: string,
  topK: number = 5,
  minScore: number = 0.05,
  customHeaders?: Record<string, string>
) {
  const client = createKnowledgeClient(customHeaders);
  const response = await client.search(
    query,
    [DATASET_NAME],
    topK,
    minScore,
    customHeaders
  );
  return response;
}

// 从搜索结果中提取知识库内容，格式化为上下文
export function formatKnowledgeContext(
  chunks: KnowledgeChunk[]
): string {
  if (chunks.length === 0) return "";
  return chunks
    .map((chunk, index) => `【资料${index + 1}】\n${chunk.content}`)
    .join("\n\n");
}
