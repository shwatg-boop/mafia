import React, { useEffect, useState } from 'react';
import { Skull, ArrowRight } from 'lucide-react';
import { RoomData, PlayerData } from '../types/game';
import { playDawnChime, playClick } from '../audio/sounds';

interface DawnAnnouncementViewProps {
  room: RoomData;
  players: PlayerData[];
  currentUid?: string;
  isHost: boolean;
  onProceedToDiscussion: () => void;
}

export const DawnAnnouncementView: React.FC<DawnAnnouncementViewProps> = ({
  room,
  players,
  currentUid,
  isHost,
  onProceedToDiscussion,
}) => {
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    playDawnChime();
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (isHost) onProceedToDiscussion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isHost, onProceedToDiscussion]);

  const hasCasualty = Boolean(room.lastEliminatedName);

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-24 animate-in fade-in duration-300">
      {/* 1930s Vintage Newspaper Card */}
      <div className="rounded-2xl bg-[#e6ded1] text-[#1c1917] p-5 sm:p-6 shadow-2xl border-4 border-[#292524] relative overflow-hidden font-serif">
        {/* Newspaper masthead */}
        <div className="border-b-2 border-black pb-2 text-center">
          <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-widest text-stone-700 border-b border-stone-400 pb-1 mb-1">
            <span>CITY EDITION</span>
            <span>DAY {room.dayNumber || 1} MORNING DISPATCH</span>
            <span>PRICE 2 CENTS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-black font-serif">
            The Daily Inquirer
          </h1>
        </div>

        {/* Headline */}
        <div className="py-4 text-center border-b border-stone-400">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-stone-900 leading-tight">
            {hasCasualty ? 'BLOOD ON THE COBBLESTONES!' : 'NIGHT ENDS WITHOUT CASUALTY!'}
          </h2>
          <p className="text-xs italic text-stone-700 mt-1 font-serif">
            {hasCasualty
              ? 'Tragedy strikes city as gunfire echoes under cover of darkness.'
              : 'The city awakens peacefully without night incidents.'}
          </p>
        </div>

        {/* Story Body */}
        <div className="py-4 space-y-3 font-serif text-xs sm:text-sm text-stone-800 leading-relaxed">
          {hasCasualty ? (
            <div className="p-3.5 bg-stone-900 text-stone-100 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-950 border border-red-700 flex items-center justify-center shrink-0">
                <Skull className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-red-400 font-mono">
                  Casualty Confirmed:
                </p>
                <p className="font-bold text-base text-white">{room.lastEliminatedName}</p>
                <p className="text-[11px] text-stone-400">
                  The innocent citizen was murdered during the night.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-stone-900 text-stone-100 rounded-xl">
              <p className="font-bold text-sm text-white">Quiet Night</p>
              <p className="text-[11px] text-stone-300">
                No citizens were eliminated overnight.
              </p>
            </div>
          )}

          <p className="italic text-xs text-stone-700 border-l-2 border-stone-800 pl-3">
            "{room.lastNightSummary || 'Citizens awaken to convene emergency town council.'}"
          </p>
        </div>
      </div>

      {/* Advance button */}
      <div className="space-y-2">
        {isHost ? (
          <button
            onClick={() => {
              playClick();
              onProceedToDiscussion();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white font-serif font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl active:scale-95 transition"
          >
            <span>Convene Town Square ({countdown}s)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 text-center text-xs text-stone-400">
            Town square gathers in <span className="text-amber-400 font-bold">{countdown}s</span>...
          </div>
        )}
      </div>
    </div>
  );
};
