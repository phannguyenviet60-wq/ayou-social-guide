"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface ChatBoxProps {
    welcomeMessage?: string;
}

export default function ChatBox(
    {
        welcomeMessage = "嗨，宝子！你来啦～我是阿柚💕\n\n恭喜你翻开了这份《社会化指南》，迈出了勇敢的一小步。\n\n不管你遇到下载问题、找不到解压密码，还是遇到棘手的社交场景不知道该看哪一章，都可以在这里随时敲我。\n\n别有压力，把这里当成你的专属自留地，我一直都在这里陪你慢慢来哦～"
    }: ChatBoxProps
) {
    const [messages, setMessages] = useState<ChatMessage[]>([{
        id: "welcome",
        role: "assistant",
        content: welcomeMessage,
        timestamp: new Date()
    }]);

    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        const textarea = textareaRef.current;

        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
        }
    }, [inputValue]);

    const handleSend = async () => {
        const trimmedMessage = inputValue.trim();

        if (!trimmedMessage || isLoading)
            return;

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            content: trimmedMessage,
            timestamp: new Date()
        };

        const assistantMessageId = `assistant-${Date.now()}`;

        const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: "assistant",
            content: "",
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage, assistantMessage]);
        setInputValue("");
        setIsLoading(true);

        try {
            const historyMessages = [...messages, userMessage].map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await fetch("/api/chat", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    messages: historyMessages
                })
            });

            if (!response.ok) {
                throw new Error("请求失败");
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error("无法读取响应");
            }

            let fullContent = "";

            while (true) {
                const {
                    done,
                    value
                } = await reader.read();

                if (done)
                    break;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.done)
                                {} else if (data.content) {
                                fullContent += data.content;

                                setMessages(prev => prev.map(m => m.id === assistantMessageId ? {
                                    ...m,
                                    content: fullContent
                                } : m));
                            } else if (data.error) {
                                throw new Error(data.error);
                            }
                        } catch {}
                    }
                }
            }
        } catch (error) {
            console.error("发送消息失败:", error);

            setMessages(prev => prev.map(m => m.id === assistantMessageId ? {
                ...m,
                content: "抱歉呀宝子～网络有点小问题，你再试一下好不好？不行的话给我留言也可以哦～💦"
            } : m));
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const quickQuestions = ["资料怎么下载呀？", "解压密码是什么？", "资料都包含什么内容呀？", "资料会更新吗？"];

    const handleQuickQuestion = (question: string) => {
        setInputValue(question);
        textareaRef.current?.focus();
    };

    return (
        <div className="flex flex-col h-full bg-xhs-bg">
            {}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                {messages.map(message => <div
                    key={message.id}
                    className={`flex message-enter ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    style={{
                        backgroundColor: "#FFFFFF"
                    }}>
                    {message.role === "assistant" && <div
                        className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-xhs-red to-pink-400 flex items-center justify-center text-white text-sm font-medium mr-2">柚
                                      </div>}
                    <div
                        className={`max-w-[75%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed ${message.role === "user" ? "bg-xhs-pink text-xhs-text rounded-tr-sm" : "bg-white border border-xhs-border text-xhs-text rounded-tl-sm shadow-sm"}`}>
                        {message.role === "assistant" && !message.content && isLoading ? <div className="flex items-center gap-1 py-1">
                            <span
                                className="typing-dot w-2 h-2 rounded-full bg-xhs-text-secondary inline-block" />
                            <span
                                className="typing-dot w-2 h-2 rounded-full bg-xhs-text-secondary inline-block" />
                            <span
                                className="typing-dot w-2 h-2 rounded-full bg-xhs-text-secondary inline-block" />
                        </div> : <div
                            className="whitespace-pre-wrap break-words"
                            style={{
                                fontFamily: "\"Noto Sans SC\", sans-serif",
                                fontWeight: "normal",
                                textAlign: "left",
                                color: "#0A0A0A"
                            }}>
                            {message.content}
                        </div>}
                    </div>
                    {message.role === "user" && <div
                        className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm ml-2"
                        style={{
                            fontFamily: "DOUYINSANSBOLD-GB",
                            fontWeight: "normal",
                            textDecorationThickness: "0px",
                            backgroundColor: "#FECACA"
                        }}>我
                                      </div>}
                </div>)}
                <div ref={messagesEndRef} />
            </div>
            {}
            {messages.length <= 1 && !isLoading && <div className="px-4 pb-2">
                <p className="text-xs text-xhs-text-secondary mb-2">试试问我这些问题 👇
                              </p>
                <div className="flex flex-wrap gap-2">
                    {quickQuestions.map(q => <button
                        key={q}
                        onClick={() => handleQuickQuestion(q)}
                        className="text-xs px-3 py-1.5 rounded-full bg-white border border-xhs-border text-xhs-text hover:border-xhs-red hover:text-xhs-red transition-colors">
                        {q}
                    </button>)}
                </div>
            </div>}
            {}
            <div className="border-t border-xhs-border bg-white p-3">
                <div
                    className="flex items-end gap-2 max-w-3xl mx-auto"
                    style={{
                        borderColor: "#A5F3FC"
                    }}>
                    <Textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="有什么问题尽管问我呀～"
                        className="resize-none min-h-[44px] max-h-[120px] rounded-2xl border-xhs-border focus-visible:ring-1 focus-visible:ring-xhs-red/30 focus-visible:border-xhs-red/50 text-sm py-2.5 px-4"
                        rows={1}
                        disabled={isLoading}
                        style={{
                            borderColor: "#FECACA"
                        }} />
                    <Button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isLoading}
                        className="h-11 w-11 rounded-full bg-xhs-red hover:bg-xhs-red-hover text-white flex-shrink-0 p-0 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        aria-label="发送">
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
                <p className="text-[11px] text-xhs-text-secondary text-center mt-2">回答仅供参考，以实际资料为准
                            </p>
            </div>
        </div>
    );
}