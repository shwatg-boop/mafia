import React, { useState, useEffect } from 'react';
import {
  Moon,
  Crosshair,
  Clock,
  CheckCircle2,
  Radio,
  Eye,
  Shield,
  Users,
} from 'lucide-react';
import { RoomData, PlayerData, GameRole } from '../types/game';
import { ROLE_DETAILS } from '../utils/roles';
import { playHeartbeat, playClick } from '../audio/sounds';

interface NightPhaseViewProps {
  room: RoomData;
  players: PlayerData[];
  currentUid?: string;
  isHost: boolean;
  onSubmitAction: (targetId: string) => Promise<void>;
  onResolveNight: () => Promise<void>;
  onOpenChat: () => void;
}

export const NightPhaseView: React.FC<NightPhaseViewProps> = ({
  room,
  players,
  currentUid,
  isHost,
  onSubmitAction,
  onResolveNight,
  onOpenChat,
}) => {
  const me = players.find((p) => p.uid === currentUid);
  const myRole = (me?.role || 'villager') as GameRole;
  const isAlive = me?.isAlive ?? false;

  const [selectedTargetId, setSelectedTargetId] = useState<string>(me?.nightTargetId || '');
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(30);

  useEffect(() => {
    if (me?.nightTargetId) {
      setSelectedTargetId(me.nightTargetId);
    }
  }, [me?.nightTargetId]);

  // Heartbeat ambient loop
  useEffect(() => {
    const hbInterval = setInterval(() => {
      playHeartbeat();
    }, 4500);

    return () => clearInterval(hbInterval);
  }, []);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (room.phaseDeadline) {
        const remaining = Math.max(0, Math.ceil((room.phaseDeadline - Date.now()) / 1000));
        setSecondsLeft(remaining);
        if (remaining <= 0 && isHost) {
          onResolveNight();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [room.phaseDeadline, isHost, onResolveNight]);

  const alivePlayers = players.filter((p) => p.isAlive);
  const aliveVillagers = alivePlayers.filter((p) => p.role !== 'mafia');
  const aliveMafiosi = alivePlayers.filter((p) => p.role === 'mafia');

  // Fellow mafia partners
  const mafiaPartners = aliveMafiosi.filter((p) => p.uid !== currentUid);

  const handleSelect = async (targetId: string) => {
    if (!isAlive || myRole !== 'mafia' || submitting) return;
    playClick();
    setSelectedTargetId(targetId);
    setSubmitting(true);
    try {
      await onSubmitAction(targetId);
    } catch (err) {
      console.error('Error submitting night action:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const roleInfo = ROLE_DETAILS[myRole];

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-24">
      {/* Night Atmosphere Card */}
      <div className="rounded-2xl bg-gradient-to-b from-[#08090e] via-[#0d0e17] to-[#12131f] border border-cyan-950/60 p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-900/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/50 flex items-center justify-center">
              <Moon className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
                Night {room.dayNumber || 1} • Silence Over City
              </span>
              <h1 className="font-serif font-black text-xl text-stone-100 tracking-wide">
                Under Cover of Darkness
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 text-xs font-mono font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{secondsLeft}s</span>
          </div>
        </div>

        {/* Role Brief & Channel Shortcut */}
        <div className="mt-3 pt-3 border-t border-cyan-950/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-stone-400">Your Identity:</span>
            <span
              className={`font-serif font-bold px-2 py-0.5 rounded-full border text-[11px] ${roleInfo.badgeColor}`}
            >
              {roleInfo.name}
            </span>
          </div>

          {myRole === 'mafia' && (
            <button
              onClick={() => {
                playClick();
                onOpenChat();
              }}
              className="text-[11px] font-semibold text-red-400 hover:text-red-300 underline flex items-center gap-1"
            >
              <Radio className="w-3 h-3" />
              <span>Syndicate Radio</span>
            </button>
          )}
        </div>
      </div>

      {/* Dead Spectator View */}
      {!isAlive && (
        <div className="rounded-2xl bg-stone-900/90 border border-stone-800 p-5 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center mx-auto text-stone-400">
            <Eye className="w-5 h-5" />
          </div>
          <h2 className="font-serif font-bold text-stone-200 text-base">You Are Deceased</h2>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            You watch silently as a spirit while the remaining citizens navigate the deadly night.
          </p>
        </div>
      )}

      {/* Role Action Section */}
      {isAlive && (
        <div className="space-y-3">
          {/* Mafia Syndicate Assassination Screen */}
          {myRole === 'mafia' ? (
            <div className="rounded-2xl bg-stone-900/90 border border-red-950 p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-400 font-serif font-bold text-sm uppercase tracking-wide">
                  <Crosshair className="w-4 h-4" />
                  <span>Syndicate Assassination Order</span>
                </div>
                {mafiaPartners.length > 0 && (
                  <span className="text-[10px] text-red-300 font-mono bg-red-950/80 px-2 py-0.5 rounded-full border border-red-800/40">
                    {aliveMafiosi.length} Mafiosi Active
                  </span>
                )}
              </div>

              <p className="text-xs text-stone-400">
                Choose which unsuspecting villager to eliminate tonight:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {aliveVillagers.map((target) => {
                  const isSelected = selectedTargetId === target.uid;

                  // Find other mafia partners targeting this person
                  const partnerTargets = mafiaPartners.filter(
                    (p) => p.nightTargetId === target.uid
                  );

                  return (
                    <button
                      key={target.uid}
                      onClick={() => handleSelect(target.uid)}
                      disabled={submitting}
                      className={`flex flex-col p-3 rounded-xl border text-left transition active:scale-95 ${
                        isSelected
                          ? 'bg-red-950/80 border-red-500 shadow-lg shadow-red-950/50'
                          : 'bg-stone-950/70 border-stone-800 hover:border-red-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-xs text-stone-200">
                          {target.displayName}
                        </span>
                        {isSelected ? (
                          <span className="flex items-center gap-1 text-[10px] text-red-300 font-bold uppercase">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Targeted</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-500">Tap to Hit</span>
                        )}
                      </div>

                      {partnerTargets.length > 0 && (
                        <div className="mt-1 pt-1 border-t border-stone-800/60 text-[10px] text-amber-400 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>
                            {partnerTargets.map((p) => p.displayName).join(', ')} also marked this
                            victim
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {mafiaPartners.length > 0 && (
                <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 text-[11px] text-stone-400">
                  Tip: Coordinate with your partners via the Syndicate Radio channel!
                </div>
              )}
            </div>
          ) : (
            /* Villager Night Vigilance Screen */
            <div className="rounded-2xl bg-stone-900/90 border border-stone-800 p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-stone-950 border border-stone-800 flex items-center justify-center mx-auto text-amber-400/80 shadow-lg">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h2 className="font-serif font-black text-stone-100 text-lg">
                  Locked Inside Your Home
                </h2>
                <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  The streets are empty and deadly. As an honest citizen, you must wait out the
                  night and pray the Mafia does not knock on your door.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800/80 text-left space-y-1.5 max-w-sm mx-auto">
                <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Citizen Strategy Guide:
                </p>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Tomorrow morning at town square, observe who votes immediately without discussion,
                  or who pushes false narratives.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Host Control to force resolve early if desired */}
      {isHost && (
        <div className="pt-2">
          <button
            onClick={() => {
              playClick();
              onResolveNight();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium text-xs border border-stone-700 transition"
          >
            Advance to Dawn (Host Bypass)
          </button>
        </div>
      )}
    </div>
  );
};
