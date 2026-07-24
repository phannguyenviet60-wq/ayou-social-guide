// 简单的内存限流 - 防止被刷
// 生产环境建议用 Redis，这里用内存 Map 足够中小流量用

import type { NextRequest } from "next/server";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// 配置：每个 IP 每分钟最多 20 次请求
const MAX_REQUESTS_PER_MINUTE = 20;
const WINDOW_MS = 60 * 1000; // 1分钟窗口

// 获取客户端 IP
export function getClientIp(request: NextRequest): string {
  // 优先从 header 取（经过代理时）
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  // fallback，用一个默认标识
  return "unknown";
}

// 检查是否超限
export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // 没有记录或窗口已过期，新建
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_MINUTE - 1,
      resetTime: now + WINDOW_MS,
    };
  }

  // 超限
  if (record.count >= MAX_REQUESTS_PER_MINUTE) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  // 计数 +1
  record.count++;
  rateLimitMap.set(ip, record);
  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_MINUTE - record.count,
    resetTime: record.resetTime,
  };
}

// 定期清理过期记录，防止内存泄漏
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000); // 每5分钟清理一次
