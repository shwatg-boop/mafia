import React, { useState } from 'react';
import { X, Skull, Shield, Sun, Moon, Scale } from 'lucide-react';
import { playClick } from '../audio/sounds';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'roles' | 'phases' | 'tips'>('roles');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-stone-900 border border-stone-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-800 bg-[#0d0e14]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="font-serif font-bold text-stone-100 text-sm sm:text-base tracking-wide uppercase">
              The Mafia Dossier & Guide
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

        {/* Tabs */}
        <div className="flex border-b border-stone-800 bg-stone-950/60 p-1 text-xs">
          <button
            onClick={() => {
              playClick();
              setActiveTab('roles');
            }}
            className={`flex-1 py-2 rounded-lg font-medium transition ${
              activeTab === 'roles'
                ? 'bg-stone-800 text-stone-100 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Factions
          </button>
          <button
            onClick={() => {
              playClick();
              setActiveTab('phases');
            }}
            className={`flex-1 py-2 rounded-lg font-medium transition ${
              activeTab === 'phases'
                ? 'bg-stone-800 text-stone-100 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Game Flow
          </button>
          <button
            onClick={() => {
              playClick();
              setActiveTab('tips');
            }}
            className={`flex-1 py-2 rounded-lg font-medium transition ${
              activeTab === 'tips'
                ? 'bg-stone-800 text-stone-100 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Strategy
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs sm:text-sm text-stone-300">
          {activeTab === 'roles' && (
            <div className="space-y-3">
              {/* Mafia */}
              <div className="p-3.5 rounded-xl bg-stone-950/70 border border-red-900/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skull className="w-5 h-5 text-red-400" />
                    <span className="font-serif font-bold text-stone-100 text-sm tracking-wide">
                      The Mafia Syndicate
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border bg-red-950/80 border-red-500 text-red-300">
                      Mafia Faction
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-red-300 italic">Criminal Infiltrators</p>
                <p className="text-stone-300 text-xs leading-relaxed">
                  The Mafia knows each other's secret identities. Each night under cover of darkness,
                  the Mafia confers to assassinate one innocent citizen. During the day, they must
                  deceive the town and blend in as ordinary villagers.
                </p>
                <div className="mt-2 pt-2 border-t border-stone-800/60 text-[11px] text-red-400 flex items-start gap-1">
                  <span className="font-semibold text-stone-400">Win Condition:</span>
                  <span>
                    Mafia members equal or outnumber the remaining living Villagers.
                  </span>
                </div>
              </div>

              {/* Villagers */}
              <div className="p-3.5 rounded-xl bg-stone-950/70 border border-amber-900/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-amber-300" />
                    <span className="font-serif font-bold text-stone-100 text-sm tracking-wide">
                      The Honest Villagers
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border bg-stone-900 border-amber-500/50 text-amber-200">
                      Town Faction
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-amber-300/80 italic">The Majority Citizens</p>
                <p className="text-stone-300 text-xs leading-relaxed">
                  Villagers do not know who the Mafia members are. They must use observation,
                  behavioral analysis, speech patterns, and trial voting to deduce who is lying and
                  condemn the Mafia syndicate.
                </p>
                <div className="mt-2 pt-2 border-t border-stone-800/60 text-[11px] text-emerald-400 flex items-start gap-1">
                  <span className="font-semibold text-stone-400">Win Condition:</span>
                  <span>
                    Every single member of the Mafia syndicate is eliminated.
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'phases' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-serif font-bold text-sm">
                  <Moon className="w-4 h-4" />
                  <span>1. The Night Phase</span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Darkness falls over the city. Honest citizens sleep soundly in their homes. The
                  Mafia awakens, coordinates through their encrypted Syndicate Radio, and picks one
                  victim to eliminate.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-sm">
                  <Sun className="w-4 h-4" />
                  <span>2. Morning Newspaper & Town Square</span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  At sunrise, church bells chime and the morning edition of <em>The Daily Inquirer</em>{' '}
                  reveals who was eliminated overnight. The living citizens assemble in the town square
                  to debate, cross-examine suspects, and identify who looks guilty.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800 space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-serif font-bold text-sm">
                  <Scale className="w-4 h-4" />
                  <span>3. Court Trial & Execution Vote</span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  The citizens vote by secret ballot to condemn a suspect to execution or stay the
                  execution. If a majority votes for the same suspect, they are eliminated!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 text-xs space-y-1">
                <p className="font-bold text-red-400">For The Mafia:</p>
                <p className="text-stone-300 leading-relaxed">
                  Blend in! Don't be excessively silent, and don't lead aggressive witch-hunts too
                  early. Vote alongside the town on innocent players without making your alliance
                  obvious.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 text-xs space-y-1">
                <p className="font-bold text-amber-300">For The Villagers:</p>
                <p className="text-stone-300 leading-relaxed">
                  Look at voting records! Who jumped onto a bandwagon at the last second? Who deflected
                  accusations away from another player? Share your thoughts and coordinate your votes.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-800 bg-[#0d0e14] flex justify-end">
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs transition"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
