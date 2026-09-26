import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Radio, MessageSquare, ShieldAlert } from 'lucide-react';
import { ChatMessage, PlayerData } from '../types/game';
import { playClick } from '../audio/sounds';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  currentUid?: string;
  player?: PlayerData;
  isNight: boolean;
  onSendMessage: (text: string, channel: 'town' | 'mafia') => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  currentUid,
  player,
  isNight,
  onSendMessage,
}) => {
  const isMafia = player?.role === 'mafia';
  const isAlive = player?.isAlive ?? false;
  const [channel, setChannel] = useState<'town' | 'mafia'>('town');
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // If night begins and player is mafia, default to mafia syndicate radio
  useEffect(() => {
    if (isNight && isMafia) {
      setChannel('mafia');
    }
  }, [isNight, isMafia]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, channel]);

  if (!isOpen) return null;

  const filteredMessages = messages.filter((m) => {
    if (channel === 'town') {
      return m.channel === 'town' || m.channel === 'system';
    }
    return m.channel === 'mafia';
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    playClick();
    onSendMessage(inputText, channel);
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md h-full bg-[#0d0e14] border-l border-stone-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-stone-800 bg-stone-950">
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-bold text-stone-100 text-sm tracking-wide uppercase">
              City Channels
            </h2>
          </div>
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel Selector */}
        <div className="flex border-b border-stone-800 bg-stone-950/70 p-1 text-xs">
          <button
            onClick={() => {
              playClick();
              setChannel('town');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-medium transition ${
              channel === 'town'
                ? 'bg-stone-800 text-stone-100 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            <span>Town Square</span>
          </button>

          {isMafia && (
            <button
              onClick={() => {
                playClick();
                setChannel('mafia');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-medium transition ${
                channel === 'mafia'
                  ? 'bg-red-950/80 text-red-200 border border-red-700/60 shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-red-400" />
              <span>Syndicate Radio</span>
            </button>
          )}
        </div>

        {/* Message Log */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2.5 text-xs">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12 text-stone-500 italic">
              {channel === 'mafia'
                ? 'Whisper secretly with your fellow Mafia members...'
                : 'No chatter in town square yet.'}
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMine = msg.senderId === currentUid;
              const isSys = msg.senderId === 'system';

              if (isSys) {
                return (
                  <div
                    key={msg.id}
                    className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-center font-serif text-[11px] text-amber-300/80"
                  >
                    {msg.text}
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-stone-500 px-1 mb-0.5 font-semibold">
                    {msg.senderName}
                  </span>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl ${
                      isMine
                        ? channel === 'mafia'
                          ? 'bg-red-800 text-white rounded-br-none'
                          : 'bg-amber-600 text-stone-950 font-medium rounded-br-none'
                        : channel === 'mafia'
                        ? 'bg-red-950/70 border border-red-800/60 text-red-200 rounded-bl-none'
                        : 'bg-stone-800 text-stone-200 rounded-bl-none'
                    }`}
                  >
                    <p className="leading-snug break-words">{msg.text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Chat input footer */}
        <div className="p-3 border-t border-stone-800 bg-stone-950">
          {isAlive ? (
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  channel === 'mafia'
                    ? 'Send encrypted syndicate order...'
                    : 'Speak in town square...'
                }
                maxLength={300}
                className="flex-1 px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 text-xs focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className={`p-2.5 rounded-xl text-white transition active:scale-95 ${
                  channel === 'mafia'
                    ? 'bg-red-700 hover:bg-red-600'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="p-2 text-center text-xs text-stone-500 italic">
              Deceased players may not broadcast messages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
