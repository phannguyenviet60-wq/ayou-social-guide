'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Search, Plus, CheckCircle, AlertCircle, FileText } from 'lucide-react';

interface SearchResult {
  content: string;
  score: number;
  doc_id: string;
}

// 管理后台访问口令（可以自己改）
const ADMIN_PASSWORD = 'ayou2026';

export default function KnowledgeAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addMessage, setAddMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 验证口令
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('口令不对哦，再想想～');
    }
  };

  // 添加知识
  const handleAdd = async () => {
    if (!content.trim()) {
      setAddMessage({ type: 'error', text: '内容不能为空哦～' });
      return;
    }

    setIsAdding(true);
    setAddMessage(null);

    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_PASSWORD}`,
        },
        body: JSON.stringify({ content, title }),
      });

      const data = await response.json();

      if (data.success) {
        setAddMessage({ type: 'success', text: '添加成功啦！资料已录入知识库 ✨' });
        setTitle('');
        setContent('');
      } else {
        setAddMessage({ type: 'error', text: data.error || '添加失败了，再试试？' });
      }
    } catch (error) {
      setAddMessage({ type: 'error', text: '网络有点小问题，稍后再试吧～' });
    } finally {
      setIsAdding(false);
    }
  };

  // 搜索测试
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const response = await fetch(
        `/api/knowledge?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${ADMIN_PASSWORD}`,
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.chunks || []);
      } else {
        setSearchError(data.error || '搜索失败');
      }
    } catch (error) {
      setSearchError('搜索出错了～');
    } finally {
      setIsSearching(false);
    }
  };

  // 快速模板
  const templates = [
    {
      title: '资料下载说明',
      content: `【资料下载说明】
1. 购买后百度网盘链接会自动发货，请注意查收
2. 链接: https://pan.baidu.com/s/xxxxxxx 提取码: xxxx
3. 保存到自己的网盘后即可下载
4. 如链接失效请联系客服补发
5. 建议使用百度网盘APP下载，速度更快更稳定`,
    },
    {
      title: '解压密码说明',
      content: `【解压密码说明】
1. 所有压缩包的解压密码统一为：ayou2026
2. 请使用电脑解压，手机端可能出现解压失败
3. 推荐使用 WinRAR 或 7-Zip 解压软件
4. 如果提示密码错误，请确认是否输入正确，注意区分大小写
5. mac 用户请使用 The Unarchiver 软件解压`,
    },
    {
      title: '资料内容介绍',
      content: `【资料内容介绍】
本套资料包含以下内容：
1. 入门教程系列（10节课）- 适合零基础小白
2. 进阶实战课程（20节课）- 有基础后深入学习
3. 配套素材包 - 课程用到的所有源文件
4. 学习路线图 - 帮你规划学习路径
5. 不定期更新 - 后续新增内容免费更新

资料格式：视频课程 + PDF文档 + 源文件
总大小：约 50GB`,
    },
    {
      title: '更新与售后说明',
      content: `【更新与售后说明】
1. 资料会不定期更新，更新内容免费获取
2. 更新后会在朋友圈通知，注意查看
3. 百度网盘链接永久有效，不用担心过期
4. 如有任何问题可以随时联系客服
5. 工作时间：每天 9:00 - 22:00
6. 非工作时间留言，看到会第一时间回复`,
    },
  ];

  const handleUseTemplate = (template: { title: string; content: string }) => {
    setTitle(template.title);
    setContent(template.content);
  };

  // 未登录显示口令输入
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-xhs-bg flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-xhs-border w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-xhs-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h1 className="text-xl font-bold text-xhs-text">管理后台</h1>
            <p className="text-sm text-xhs-text-secondary mt-2">请输入访问口令</p>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <Input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="请输入口令"
                className="w-full"
                autoFocus
              />
              {passwordError && (
                <p className="text-xs text-red-500 mt-2">{passwordError}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-xhs-red hover:bg-xhs-red/90 text-white rounded-full"
            >
              进入后台
            </Button>
          </form>

          <p className="text-xs text-xhs-text-secondary text-center mt-4">
            忘记口令了？去代码里找 ADMIN_PASSWORD 看看～
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-xhs-bg p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-xhs-text mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6 text-xhs-red" />
          知识库管理后台
        </h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 添加知识 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-xhs-border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-xhs-red" />
              添加资料
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">资料标题（可选）</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="比如：资料下载说明"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="content">资料内容</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="把你的产品资料粘贴到这里..."
                  className="mt-1.5 min-h-[200px] resize-y"
                />
              </div>

              {addMessage && (
                <div
                  className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                    addMessage.type === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  {addMessage.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  {addMessage.text}
                </div>
              )}

              <Button
                onClick={handleAdd}
                disabled={isAdding}
                className="w-full bg-xhs-red hover:bg-xhs-red-hover text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isAdding ? '添加中...' : '添加到知识库'}
              </Button>

              {/* 快速模板 */}
              <div className="pt-4 border-t border-xhs-border">
                <p className="text-sm text-xhs-text-secondary mb-3">
                  快速模板（点一下就可以用）：
                </p>
                <div className="flex flex-wrap gap-2">
                  {templates.map((t) => (
                    <button
                      key={t.title}
                      onClick={() => handleUseTemplate(t)}
                      className="text-xs px-3 py-1.5 rounded-full bg-xhs-pink text-xhs-text hover:bg-xhs-pink-deep transition-colors"
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 搜索测试 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-xhs-border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-xhs-red" />
              搜索测试
            </h2>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="输入关键词测试检索效果"
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="bg-xhs-red hover:bg-xhs-red-hover text-white flex-shrink-0"
                >
                  {isSearching ? '搜索中' : '搜索'}
                </Button>
              </div>

              {searchError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {searchError}
                </div>
              )}

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {searchResults.length === 0 && !isSearching && searchQuery && (
                  <p className="text-sm text-xhs-text-secondary text-center py-8">
                    没有找到相关内容～
                  </p>
                )}
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-3 bg-xhs-bg rounded-xl border border-xhs-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-xhs-red">
                        匹配度 {Math.round(result.score * 100)}%
                      </span>
                      <span className="text-xs text-xhs-text-secondary">
                        #{index + 1}
                      </span>
                    </div>
                    <p className="text-sm text-xhs-text whitespace-pre-wrap line-clamp-4">
                      {result.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-6 bg-white rounded-2xl p-5 shadow-sm border border-xhs-border">
          <h2 className="text-lg font-semibold mb-3">💡 使用小贴士</h2>
          <ul className="space-y-2 text-sm text-xhs-text">
            <li className="flex items-start gap-2">
              <span className="text-xhs-red">•</span>
              把你的虚拟产品资料逐条添加到知识库中，越详细回答越准确
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xhs-red">•</span>
              每条资料建议聚焦一个主题，比如"下载说明"、"解压密码"、"内容介绍"等
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xhs-red">•</span>
              添加完可以在右侧搜索测试一下，看看检索效果好不好
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xhs-red">•</span>
              超出知识库范围的问题，智能体会自动婉转回复，不会编造答案
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
