import React, { useState, useEffect } from 'react';
import { Shield, Skull, Eye, EyeOff, Lock, Users } from 'lucide-react';
import { GameRole, PlayerData } from '../types/game';
import { ROLE_DETAILS } from '../utils/roles';
import { playMysteryReveal, playClick } from '../audio/sounds';

interface RoleRevealModalProps {
  player: PlayerData;
  allPlayers: PlayerData[];
  isHost: boolean;
  onProceedToNight: () => void;
}

export const RoleRevealModal: React.FC<RoleRevealModalProps> = ({
  player,
  allPlayers,
  isHost,
  onProceedToNight,
}) => {
  const [revealed, setRevealed] = useState(false);
  const [countdown, setCountdown] = useState(10);

  const role = (player.role || 'villager') as GameRole;
  const info = ROLE_DETAILS[role];

  // Fellow mafia partners if player is mafia
  const mafiaPartners = allPlayers.filter(
    (p) => p.role === 'mafia' && p.uid !== player.uid
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleReveal = () => {
    playMysteryReveal();
    setRevealed(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-800 shadow-2xl p-5 text-center space-y-4">
        {/* Header stamp */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-700/60 text-red-300 text-[10px] font-mono tracking-widest uppercase">
            <Lock className="w-3 h-3" />
            <span>Classified Identity Dossier</span>
          </div>
          <h2 className="font-serif font-black text-xl text-stone-100 tracking-wide">
            Your Secret Identity
          </h2>
          <p className="text-xs text-stone-400">
            Keep your phone screen concealed from other players!
          </p>
        </div>

        {/* Sealed envelope vs Revealed Dossier */}
        {!revealed ? (
          <div
            onClick={handleReveal}
            className="cursor-pointer group p-8 rounded-2xl bg-stone-950 border-2 border-dashed border-stone-700 hover:border-amber-500/60 transition active:scale-95 space-y-3"
          >
            <div className="w-16 h-16 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center mx-auto group-hover:scale-105 transition shadow-lg">
              <Eye className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <p className="font-serif font-bold text-stone-200 text-sm">
                Tap to Break Wax Seal
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Reveals your allegiance: Mafia or Villager
              </p>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-stone-950 border border-stone-800 space-y-3 animate-in zoom-in-95 duration-200 shadow-inner">
            <div className="flex justify-center">
              {role === 'mafia' ? (
                <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-600 flex items-center justify-center shadow-lg shadow-red-950/60">
                  <Skull className="w-10 h-10 text-red-400" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-stone-900 border border-amber-600/60 flex items-center justify-center shadow-lg shadow-amber-950/40">
                  <Shield className="w-10 h-10 text-amber-300" />
                </div>
              )}
            </div>

            <div>
              <span
                className={`inline-block text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border mb-1 ${info.badgeColor}`}
              >
                {info.team === 'mafia' ? 'Criminal Syndicate' : 'Innocent Town'}
              </span>
              <h3 className="font-serif font-black text-2xl text-stone-100 tracking-wider">
                {info.name}
              </h3>
              <p className="text-xs text-amber-400/90 italic font-medium">{info.tagline}</p>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed text-left bg-stone-900/60 p-3 rounded-xl border border-stone-800">
              {info.description}
            </p>

            {/* Mafia partner reveal */}
            {role === 'mafia' && (
              <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/50 text-left space-y-1">
                <div className="flex items-center gap-1.5 text-red-400 font-semibold text-xs">
                  <Users className="w-3.5 h-3.5" />
                  <span>Syndicate Partners:</span>
                </div>
                {mafiaPartners.length > 0 ? (
                  <ul className="text-xs text-stone-200 list-disc list-inside">
                    {mafiaPartners.map((m) => (
                      <li key={m.uid} className="font-medium">
                        {m.displayName}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-stone-400 italic">
                    You are the lone Syndicate assassin operating in this city.
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => {
                playClick();
                setRevealed(false);
              }}
              className="flex items-center justify-center gap-1 text-[11px] text-stone-400 hover:text-stone-300 transition"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Conceal again</span>
            </button>
          </div>
        )}

        {/* Action Button */}
        <div className="space-y-2 pt-1">
          {isHost ? (
            <button
              onClick={() => {
                playClick();
                onProceedToNight();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white font-serif font-black text-xs sm:text-sm tracking-wider uppercase shadow-lg active:scale-95 transition"
            >
              Enter Night Phase ({countdown}s)
            </button>
          ) : (
            <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 text-xs text-stone-400">
              Night begins in <span className="font-bold text-amber-400">{countdown}s</span> (or
              when host advances)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
