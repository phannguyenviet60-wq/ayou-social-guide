import ChatBox from "@/components/chat-box";

export default function Home() {
    return (
        <main
            className="h-screen w-full flex items-center justify-center bg-gradient-to-b from-xhs-pink/30 to-xhs-bg p-4">
            <div
                className="w-full max-w-md h-[85vh] max-h-[750px] bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col border border-xhs-border">
                {/* 顶部栏 - 微信风格 */}
                <div
                    className="flex items-center px-4 py-3 border-b border-xhs-border"
                    style={{
                        backgroundColor: "#FECACA",
                    }}>
                    <div className="flex items-center gap-3">
                        {/* 头像 */}
                        <div
                            className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FF2442] to-pink-400 flex items-center justify-center text-white font-medium text-sm shadow-sm">
                            阿柚
                        </div>
                        {/* 名字和状态 */}
                        <div>
                            <h1 className="text-base font-semibold text-gray-800">阿柚 · 社会化指南</h1>
                            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                                在线 · 通常很快回复
                            </p>
                        </div>
                    </div>
                </div>
                {/* 聊天区域 */}
                <div className="flex-1 overflow-hidden">
                    <ChatBox />
                </div>
            </div>
        </main>
    );
}