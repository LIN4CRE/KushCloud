import { useState, useEffect, useRef } from "react";
import { SaveData } from "../game/storage";
import { ScreenShell } from "../ui";
import { subscribeChat, sendMessage, ChatMessage } from "../config/firebase";
import { getUID } from "../game/leaderboard";
import { audio } from "../game/audio";

interface Props {
  save: SaveData;
  onBack: () => void;
}

export default function Chat({ save, onBack }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSearching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const myUid = getUID();

  useEffect(() => {
    const unsub = subscribeChat((msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    });
    return unsub;
  }, []);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSearching(true);
    try {
      await sendMessage(myUid, save.playerName, text.trim());
      setText("");
      audio.click();
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <ScreenShell title="Global Lounge" subtitle="Chill with other buds" onBack={onBack}>
      <div className="flex flex-col h-full max-h-[70vh]">
        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-3 pr-2 [scrollbar-width:thin]"
        >
          {messages.length === 0 && (
            <div className="text-center py-10 opacity-30">
              <div className="text-4xl mb-2">🌿</div>
              <p className="text-sm font-bold">Start the conversation...</p>
            </div>
          )}

          {messages.map((m) => {
            const isMe = m.uid === myUid;
            return (
              <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && <span className="text-[10px] font-black text-white/30 ml-2 mb-1 uppercase tracking-tighter">{m.name}</span>}
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm font-medium shadow-sm ${
                  isMe
                    ? "bg-emerald-500 text-white rounded-tr-none"
                    : "bg-white/10 text-white/90 border border-white/5 rounded-tl-none"
                }`}>
                  {m.text}
                </div>
                <span className="text-[8px] font-bold text-white/20 mt-1 mx-1">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            placeholder="Type a message..."
            className="flex-1 rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-emerald-500/50 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
          >
            {sending ? "..." : "✈️"}
          </button>
        </div>
      </div>
    </ScreenShell>
  );
}
