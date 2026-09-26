import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Skull, Shield, RotateCcw, Bot } from 'lucide-react';
import { RoomData, PlayerData, GameRole } from '../types/game';
import { ROLE_DETAILS } from '../utils/roles';
import { playVictoryFanfare, playClick } from '../audio/sounds';

interface GameOverViewProps {
  room: RoomData;
  players: PlayerData[];
  currentUid?: string;
  isHost: boolean;
  onRestartGame: () => Promise<void>;
}

export const GameOverView: React.FC<GameOverViewProps> = ({
  room,
  players,
  currentUid,
  isHost,
  onRestartGame,
}) => {
  const winner = room.winner || 'town';

  useEffect(() => {
    playVictoryFanfare();

    try {
      const colors =
        winner === 'town'
          ? ['#10b981', '#3b82f6', '#f59e0b']
          : ['#ef4444', '#b91c1c', '#1c1917'];

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors,
      });

      const timeout = setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });
      }, 400);

      return () => clearTimeout(timeout);
    } catch {}
  }, [winner]);

  const banner =
    winner === 'mafia'
      ? {
          title: 'THE MAFIA SYNDICATE WINS',
          subtitle:
            'The Mafia has reached equal or superior numbers with the townspeople. Total control of the city is theirs!',
          accent: 'from-red-950 via-stone-900 to-stone-950 border-red-700/60',
          textColor: 'text-red-400',
          icon: <Skull className="w-12 h-12 text-red-500" />,
        }
      : {
          title: 'THE HONEST VILLAGERS WIN',
          subtitle:
            'Justice prevailed! Through observation, unity, and courage, every Mafia member has been unmasked and eliminated.',
          accent: 'from-emerald-950 via-stone-900 to-stone-950 border-emerald-700/60',
          textColor: 'text-emerald-400',
          icon: <Shield className="w-12 h-12 text-emerald-400" />,
        };

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-24 animate-in fade-in duration-300">
      {/* Victorious Banner */}
      <div
        className={`rounded-2xl bg-gradient-to-b ${banner.accent} border p-6 text-center shadow-2xl space-y-3 relative overflow-hidden`}
      >
        <div className="flex justify-center">{banner.icon}</div>

        <div>
          <span
            className={`text-[10px] font-mono tracking-widest uppercase font-bold px-2 py-0.5 rounded-full border bg-stone-950/80 ${banner.textColor}`}
          >
            Game Over • Final Verdict
          </span>
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-100 tracking-wide mt-2">
            {banner.title}
          </h1>
          <p className="text-xs text-stone-300 max-w-md mx-auto mt-1 leading-relaxed">
            {banner.subtitle}
          </p>
        </div>
      </div>

      {/* Roster Unmasked */}
      <div className="rounded-2xl bg-stone-900/90 border border-stone-800 p-4 shadow-xl space-y-3">
        <h2 className="font-serif font-bold text-stone-200 text-xs tracking-wider uppercase flex items-center justify-between">
          <span>Identities Revealed</span>
          <span className="text-stone-500 font-mono text-[10px]">
            {players.length} Total Players
          </span>
        </h2>

        <div className="space-y-2">
          {players.map((p) => {
            const role = (p.role || 'villager') as GameRole;
            const info = ROLE_DETAILS[role];
            const isMe = p.uid === currentUid;

            return (
              <div
                key={p.uid}
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  isMe
                    ? 'bg-amber-950/20 border-amber-600/40'
                    : 'bg-stone-950/70 border-stone-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      p.isAlive ? 'bg-emerald-400' : 'bg-red-500'
                    }`}
                    title={p.isAlive ? 'Survived' : 'Eliminated'}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs sm:text-sm text-stone-200">
                        {p.displayName}
                      </span>
                      {isMe && (
                        <span className="text-[9px] font-mono uppercase px-1 rounded bg-stone-800 text-stone-400">
                          You
                        </span>
                      )}
                      {p.isBot && <Bot className="w-3.5 h-3.5 text-stone-500" />}
                    </div>
                    <span className="text-[10px] text-stone-400">
                      {p.isAlive ? 'Survived' : 'Eliminated during trial or night'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full border font-bold ${info.badgeColor}`}
                  >
                    {info.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Restart / Play Again */}
      <div className="pt-2">
        {isHost ? (
          <button
            onClick={() => {
              playClick();
              onRestartGame();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white font-serif font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl active:scale-95 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Next Match in this Room</span>
          </button>
        ) : (
          <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 text-center text-xs text-stone-400">
            Waiting for host to commence the next round...
          </div>
        )}
      </div>
    </div>
  );
};
