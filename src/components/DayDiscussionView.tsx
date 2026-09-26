import React, { useState, useEffect } from 'react';
import { Sun, Clock, Scale, MessageSquare, AlertCircle, Bot } from 'lucide-react';
import { RoomData, PlayerData, ChatMessage } from '../types/game';
import { playClick, playTick } from '../audio/sounds';

interface DayDiscussionViewProps {
  room: RoomData;
  players: PlayerData[];
  messages: ChatMessage[];
  currentUid?: string;
  isHost: boolean;
  onAdvanceToVoting: () => Promise<void>;
  onSendMessage: (text: string, channel: 'town') => void;
  onOpenChat: () => void;
}

const QUICK_ACCUSATIONS = [
  'I suspect something shady!',
  'Where were you last night?',
  'I have a solid alibi.',
  'Their behavior changed completely.',
  'Trust me, vote them out!',
  'I am innocent Townsperson!',
];

export const DayDiscussionView: React.FC<DayDiscussionViewProps> = ({
  room,
  players,
  messages,
  currentUid,
  isHost,
  onAdvanceToVoting,
  onSendMessage,
  onOpenChat,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(60);
  const [inputText, setInputText] = useState('');

  const me = players.find((p) => p.uid === currentUid);
  const isAlive = me?.isAlive ?? false;

  useEffect(() => {
    const interval = setInterval(() => {
      if (room.phaseDeadline) {
        const remaining = Math.max(0, Math.ceil((room.phaseDeadline - Date.now()) / 1000));
        setSecondsLeft(remaining);
        if (remaining <= 5 && remaining > 0) {
          playTick();
        }
        if (remaining <= 0 && isHost) {
          onAdvanceToVoting();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [room.phaseDeadline, isHost, onAdvanceToVoting]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !isAlive) return;
    playClick();
    onSendMessage(inputText, 'town');
    setInputText('');
  };

  const handleQuickSend = (text: string) => {
    if (!isAlive) return;
    playClick();
    onSendMessage(text, 'town');
  };

  const alivePlayers = players.filter((p) => p.isAlive);
  const townMessages = messages.filter((m) => m.channel === 'town' || m.channel === 'system');

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-24">
      {/* Day Header Card */}
      <div className="rounded-2xl bg-gradient-to-b from-[#14120e] via-[#1a1712] to-[#211d17] border border-amber-900/40 p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-700/50 flex items-center justify-center">
              <Sun className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-semibold">
                Day {room.dayNumber || 1} • Town Square
              </span>
              <h1 className="font-serif font-black text-xl text-stone-100 tracking-wide">
                General Debate
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-300 text-xs font-mono font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{secondsLeft}s</span>
          </div>
        </div>

        <p className="text-xs text-stone-400 mt-2">
          Debate who committed the midnight crimes before the courthouse voting begins.
        </p>

        {/* Alive vs dead pill tally */}
        <div className="mt-3 pt-3 border-t border-amber-950/60 flex items-center justify-between text-xs">
          <span className="text-stone-400">
            Alive Citizens: <strong className="text-emerald-400">{alivePlayers.length}</strong> /{' '}
            {players.length}
          </span>
          <span className="text-stone-400">
            Eliminated: <strong className="text-red-400">{players.length - alivePlayers.length}</strong>
          </span>
        </div>
      </div>

      {/* Suspect Quick List */}
      <div className="p-3 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2">
        <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
          Living Suspects on the Stand:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {alivePlayers.map((p) => (
            <span
              key={p.uid}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 ${
                p.uid === currentUid
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                  : 'bg-stone-950/60 border-stone-800 text-stone-300'
              }`}
            >
              {p.isBot && <Bot className="w-3 h-3 text-stone-500" />}
              {p.displayName}
            </span>
          ))}
        </div>
      </div>

      {/* Town Square Discussion Feed */}
      <div className="rounded-2xl bg-stone-900/90 border border-stone-800 p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-stone-800">
          <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-stone-200 uppercase tracking-wide">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>Town Square Transcript</span>
          </div>
          <button
            onClick={() => {
              playClick();
              onOpenChat();
            }}
            className="text-[11px] text-amber-400 hover:text-amber-300 underline"
          >
            Full Log
          </button>
        </div>

        {/* Messages scroll box */}
        <div className="h-44 overflow-y-auto space-y-2 pr-1 text-xs">
          {townMessages.length === 0 ? (
            <p className="text-stone-500 italic text-center py-8">
              No statements uttered yet. Speak up to defend yourself or accuse!
            </p>
          ) : (
            townMessages.slice(-15).map((m) => {
              const isSys = m.senderId === 'system';
              const isMine = m.senderId === currentUid;
              return (
                <div
                  key={m.id}
                  className={`p-2 rounded-xl ${
                    isSys
                      ? 'bg-stone-950/80 border border-stone-800 text-amber-200/90 text-center font-serif text-[11px]'
                      : isMine
                      ? 'bg-amber-950/30 border border-amber-700/40 text-stone-200 ml-6'
                      : 'bg-stone-950/60 border border-stone-800 text-stone-300 mr-6'
                  }`}
                >
                  {!isSys && (
                    <div className="flex items-center justify-between text-[10px] text-stone-400 mb-0.5 font-semibold">
                      <span>{m.senderName}</span>
                    </div>
                  )}
                  <p className="leading-snug">{m.text}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Quick accusation tap pills */}
        {isAlive && (
          <div className="pt-2 border-t border-stone-800/80">
            <p className="text-[10px] text-stone-400 mb-1.5 font-semibold">Quick Statements:</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACCUSATIONS.map((phrase, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickSend(phrase)}
                  className="px-2.5 py-1 rounded-full bg-stone-950 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/50 text-[11px] text-stone-300 transition active:scale-95"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat input */}
        {isAlive ? (
          <form onSubmit={handleSend} className="flex gap-2 pt-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="State your argument or accusation..."
              maxLength={200}
              className="flex-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs focus:outline-none focus:border-amber-500/60"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs border border-stone-700 transition active:scale-95"
            >
              Speak
            </button>
          </form>
        ) : (
          <div className="p-2 rounded-xl bg-stone-950/60 text-center text-xs text-stone-500">
            The deceased cannot speak during day council.
          </div>
        )}
      </div>

      {/* Advance to Court Trial */}
      {isHost && (
        <div className="pt-2">
          <button
            onClick={() => {
              playClick();
              onAdvanceToVoting();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white font-serif font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl active:scale-95 transition"
          >
            <Scale className="w-4 h-4" />
            <span>Summon Courthouse & Cast Ballots</span>
          </button>
        </div>
      )}
    </div>
  );
};
