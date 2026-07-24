import { NextRequest, NextResponse } from "next/server";
import { HeaderUtils } from "coze-coding-dev-sdk";
import { addTextToKnowledge, searchKnowledge } from "@/lib/knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 管理后台访问口令（和页面保持一致）
const ADMIN_PASSWORD = "ayou2026";

interface AddKnowledgeRequest {
  content: string;
  title?: string;
}

// 验证管理口令
function verifyAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.slice(7);
  return token === ADMIN_PASSWORD;
}

export async function POST(request: NextRequest) {
  try {
    // 验证管理权限
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { error: "没有管理权限哦～" },
        { status: 401 }
      );
    }

    const { content, title } = (await request.json()) as AddKnowledgeRequest;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "内容不能为空" },
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 如果有标题，把标题加到内容前面
    const fullContent = title ? `【${title}】\n${content}` : content;

    const result = await addTextToKnowledge(fullContent, customHeaders);

    if (result.code === 0) {
      return NextResponse.json({
        success: true,
        message: "添加成功",
        doc_ids: result.doc_ids,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.msg || "添加失败" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("添加知识库错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

// GET 用于搜索测试
export async function GET(request: NextRequest) {
  try {
    // 验证管理权限
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { error: "没有管理权限哦～" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json(
        { error: "搜索词不能为空" },
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const result = await searchKnowledge(query, 5, 0.2, customHeaders);

    if (result.code === 0) {
      return NextResponse.json({
        success: true,
        chunks: result.chunks,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.msg || "搜索失败" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("搜索知识库错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
