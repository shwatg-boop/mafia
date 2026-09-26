import React, { useState } from 'react';
import {
  Users,
  Crown,
  Bot,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  Clock,
  Settings2,
  Share2,
  ChevronDown,
  ChevronUp,
  Skull,
  Shield,
} from 'lucide-react';
import { RoomData, PlayerData } from '../types/game';
import { getRecommendedMafiaCount } from '../utils/roles';
import { playClick } from '../audio/sounds';

interface LobbyViewProps {
  room: RoomData;
  players: PlayerData[];
  currentUid?: string;
  isHost: boolean;
  onStartGame: () => Promise<void>;
  onToggleReady: () => void;
  onAddBot: () => void;
  onRemoveBot: (botUid: string) => void;
  onUpdateSettings: (settings: Partial<RoomData>) => void;
  onOpenShare: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  players,
  currentUid,
  isHost,
  onStartGame,
  onToggleReady,
  onAddBot,
  onRemoveBot,
  onUpdateSettings,
  onOpenShare,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [starting, setStarting] = useState(false);

  const me = players.find((p) => p.uid === currentUid);
  const canStart = players.length >= 3;

  const currentCount = players.length;
  const recommendedMafia = getRecommendedMafiaCount(currentCount);
  const maxSafeMafia = Math.max(1, Math.floor((currentCount - 1) / 2));
  const configuredMafia = Math.min(room.mafiaCount || recommendedMafia, maxSafeMafia);
  const projectedVillagers = Math.max(0, currentCount - configuredMafia);

  const handleStart = async () => {
    if (!canStart || starting) return;
    setStarting(true);
    playClick();
    try {
      await onStartGame();
    } catch (err) {
      console.error('Failed to start game:', err);
      alert(err instanceof Error ? err.message : 'Could not start game');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-24">
      {/* Lobby Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 border border-stone-800 p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-red-900/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase font-semibold">
              Underground Syndicate Lobby
            </span>
            <h1 className="font-serif font-black text-xl sm:text-2xl text-stone-100 tracking-wide mt-0.5">
              The Gathering
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">
              Classic Mafia vs Honest Villagers. Share your room link or invite code.
            </p>
          </div>

          <button
            onClick={() => {
              playClick();
              onOpenShare();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/40 border border-amber-600/40 text-amber-300 text-xs font-semibold shadow-md active:scale-95 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Invite</span>
          </button>
        </div>

        {/* Faction Balance Preview Banner */}
        <div className="mt-4 p-3 rounded-xl bg-stone-950/80 border border-stone-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-red-400 font-bold">
              <Skull className="w-4 h-4" />
              <span>{configuredMafia} Mafia</span>
            </div>
            <span className="text-stone-600 font-bold">VS</span>
            <div className="flex items-center gap-1 text-amber-300 font-bold">
              <Shield className="w-4 h-4" />
              <span>{projectedVillagers} Villagers</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-stone-400">
            {currentCount} {currentCount === 1 ? 'Player' : 'Players'}
          </span>
        </div>

        {/* Quick summary stats */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-stone-800/80">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-stone-950/60 border border-stone-800/60">
            <Users className="w-4 h-4 text-amber-400" />
            <div className="text-xs">
              <p className="text-stone-400 text-[10px]">Suspects Present</p>
              <p className="font-bold text-stone-200">
                {players.length} <span className="text-stone-500 font-normal">/ 16</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-stone-950/60 border border-stone-800/60">
            <Clock className="w-4 h-4 text-cyan-400" />
            <div className="text-xs">
              <p className="text-stone-400 text-[10px]">Status</p>
              <p className="font-bold text-stone-200">
                {players.length >= 3 ? (
                  <span className="text-emerald-400">Ready to Start</span>
                ) : (
                  <span className="text-red-400">Need {3 - players.length} more</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Host Match Settings Accordion (Host only) */}
      {isHost && (
        <div className="rounded-2xl bg-stone-900/90 border border-stone-800 overflow-hidden shadow-lg">
          <button
            onClick={() => {
              playClick();
              setShowSettings(!showSettings);
            }}
            className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-stone-200 bg-stone-950/70 border-b border-stone-800/60 hover:bg-stone-900 transition"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-amber-400" />
              <span className="font-serif tracking-wider uppercase">Match Dynamics & Timers</span>
            </div>
            {showSettings ? (
              <ChevronUp className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            )}
          </button>

          {showSettings && (
            <div className="p-4 space-y-4 text-xs animate-in fade-in duration-100">
              {/* Mafia Count Slider */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-stone-200">Mafia Syndicate Count</p>
                  <p className="text-[11px] text-stone-400">
                    Recommended: {recommendedMafia} for {currentCount || 3} players
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-stone-950 p-1 rounded-xl border border-stone-800">
                  <button
                    onClick={() => {
                      playClick();
                      onUpdateSettings({ mafiaCount: Math.max(1, configuredMafia - 1) });
                    }}
                    disabled={configuredMafia <= 1}
                    className="w-7 h-7 rounded-lg bg-stone-800 text-stone-200 hover:bg-stone-700 disabled:opacity-30 flex items-center justify-center font-bold active:scale-95"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-bold text-red-400 text-sm">
                    {configuredMafia}
                  </span>
                  <button
                    onClick={() => {
                      playClick();
                      onUpdateSettings({ mafiaCount: Math.min(maxSafeMafia, configuredMafia + 1) });
                    }}
                    disabled={configuredMafia >= maxSafeMafia}
                    className="w-7 h-7 rounded-lg bg-stone-800 text-stone-200 hover:bg-stone-700 disabled:opacity-30 flex items-center justify-center font-bold active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Discussion Duration */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
                <div>
                  <p className="font-medium text-stone-200">Day Discussion Timer</p>
                  <p className="text-[11px] text-stone-400">Time for townspeople to debate</p>
                </div>
                <div className="flex gap-1">
                  {[45, 60, 90].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => {
                        playClick();
                        onUpdateSettings({ discussionDurationSec: sec });
                      }}
                      className={`px-2.5 py-1 rounded-lg font-mono text-xs transition ${
                        (room.discussionDurationSec || 60) === sec
                          ? 'bg-amber-600 text-stone-950 font-bold'
                          : 'bg-stone-950 text-stone-400 hover:bg-stone-800'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Bot fill button */}
              <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between">
                <div>
                  <p className="font-medium text-stone-200">Add Simulated Suspects (Bots)</p>
                  <p className="text-[11px] text-stone-400">
                    Instantly fill empty slots for solo testing or small groups
                  </p>
                </div>
                <button
                  onClick={() => {
                    playClick();
                    onAddBot();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 font-medium active:scale-95 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Bot</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Players List Card */}
      <div className="rounded-2xl bg-stone-900/90 border border-stone-800 p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-stone-100 text-sm tracking-wide uppercase flex items-center gap-2">
            <span>Roster of Citizens</span>
            <span className="text-xs font-mono font-normal text-stone-400">
              ({players.length})
            </span>
          </h2>

          {!isHost && (
            <div className="text-[11px] text-stone-400">Waiting for host to commence...</div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {players.map((p) => {
            const isMe = p.uid === currentUid;
            return (
              <div
                key={p.uid}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                  isMe
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                    : 'bg-stone-950/60 border-stone-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {p.photoURL ? (
                    <img
                      src={p.photoURL}
                      alt={p.displayName}
                      className="w-8 h-8 rounded-full object-cover border border-stone-700 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 text-stone-200 flex items-center justify-center font-bold text-xs shrink-0">
                      {p.isBot ? (
                        <Bot className="w-4 h-4 text-amber-400" />
                      ) : (
                        p.displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-stone-200 truncate">
                        {p.displayName}
                      </p>
                      {isMe && (
                        <span className="text-[9px] font-mono uppercase px-1 rounded bg-amber-500/20 text-amber-300 shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
                      {p.isHost && (
                        <span className="flex items-center text-amber-400">
                          <Crown className="w-2.5 h-2.5 mr-0.5" /> Host
                        </span>
                      )}
                      {p.isBot && <span className="text-stone-500">AI Suspect</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {p.isReady ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ready</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-stone-500 italic">Waiting</span>
                  )}

                  {isHost && p.isBot && (
                    <button
                      onClick={() => {
                        playClick();
                        onRemoveBot(p.uid);
                      }}
                      className="p-1 rounded-lg text-stone-500 hover:text-red-400 hover:bg-stone-800 transition"
                      title="Remove bot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Action Bar on Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-3 bg-[#0d0e14]/95 backdrop-blur-md border-t border-stone-800">
        <div className="max-w-xl mx-auto flex items-center gap-2">
          {!isHost && (
            <button
              onClick={() => {
                playClick();
                onToggleReady();
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm border transition active:scale-95 ${
                me?.isReady
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                  : 'bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700'
              }`}
            >
              {me?.isReady ? '✓ You Are Ready' : 'Mark Ready'}
            </button>
          )}

          {isHost && (
            <button
              onClick={handleStart}
              disabled={!canStart || starting}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-serif font-black text-xs sm:text-sm tracking-wide uppercase transition shadow-lg active:scale-95 ${
                canStart && !starting
                  ? 'bg-gradient-to-r from-red-800 via-red-700 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white border border-red-500/50 shadow-red-950/60'
                  : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{canStart ? 'Commence Mafia Match' : 'Need 3+ Players to Start'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
