import React, { useState, useEffect } from 'react';
import {
  Skull,
  Play,
  LogIn,
  Users,
  Shield,
  ArrowRight,
  Edit2,
  Check,
  Scale,
  Moon,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { playClick } from '../audio/sounds';

interface HomeViewProps {
  user: User | null;
  displayName: string;
  loading: boolean;
  onLogin: () => void;
  onUpdateName: (name: string) => Promise<void>;
  onCreateRoom: () => Promise<string | undefined>;
  onJoinRoom: (code: string) => Promise<string | undefined>;
  onOpenRules: () => void;
  initialRoomCode?: string | null;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  displayName,
  loading,
  onLogin,
  onUpdateName,
  onCreateRoom,
  onJoinRoom,
  onOpenRules,
  initialRoomCode,
}) => {
  const [joinCode, setJoinCode] = useState(initialRoomCode || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(displayName);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (displayName) {
      setNameInput(displayName);
    }
  }, [displayName]);

  useEffect(() => {
    if (initialRoomCode) {
      setJoinCode(initialRoomCode.toUpperCase());
    }
  }, [initialRoomCode]);

  const handleCreate = async () => {
    if (!user) {
      onLogin();
      return;
    }
    setCreating(true);
    playClick();
    try {
      await onCreateRoom();
    } catch (err: unknown) {
      console.error('Failed to create room:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCode.trim().toUpperCase();
    if (!clean) return;

    if (!user) {
      onLogin();
      return;
    }

    setJoining(true);
    setJoinError(null);
    playClick();
    try {
      await onJoinRoom(clean);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Room not found or game in progress.';
      setJoinError(msg);
    } finally {
      setJoining(false);
    }
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    playClick();
    await onUpdateName(nameInput);
    setIsEditingName(false);
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Hero Card */}
      <div className="rounded-3xl bg-gradient-to-b from-[#141010] via-[#100e12] to-[#0a0a0e] border border-stone-800 p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-900/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-800 to-stone-900 border border-red-600/50 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-red-950/60">
          <Skull className="w-9 h-9 text-red-200" />
        </div>

        <span className="inline-block text-[11px] font-mono tracking-widest uppercase text-amber-400 font-bold px-3 py-1 rounded-full bg-amber-950/40 border border-amber-600/30 mb-2">
          Classic Mafia vs Villagers • Realtime Mobile
        </span>

        <h1 className="font-serif font-black text-3xl sm:text-4xl text-stone-100 tracking-tight leading-tight">
          MAFIA NOIR
        </h1>

        <p className="text-xs sm:text-sm text-stone-300 max-w-md mx-auto mt-2 leading-relaxed font-sans">
          Pure social deduction and deception. The criminal syndicate hides among the honest
          citizens. Host a room or join with friends on any phone.
        </p>

        {/* User Status / Name pill */}
        {user && (
          <div className="mt-5 p-3 rounded-2xl bg-stone-950/80 border border-stone-800/80 inline-flex items-center gap-3 text-left">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                className="w-10 h-10 rounded-full border border-stone-700 object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center font-bold text-stone-200">
                {(displayName || 'P').charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center gap-1.5">
                {isEditingName ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      maxLength={20}
                      className="px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-400 w-28"
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-1 rounded bg-amber-600 text-stone-950 hover:bg-amber-500"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="font-semibold text-xs text-stone-200">{displayName}</span>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1 text-stone-400 hover:text-stone-200"
                      title="Edit Display Name"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
              <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Signed in via Google
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Host Room Card */}
        <div className="rounded-2xl bg-stone-900/90 border border-stone-800 p-5 shadow-xl space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-xl bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400 mb-2">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            <h2 className="font-serif font-bold text-stone-100 text-base">Host a Room</h2>
            <p className="text-xs text-stone-400 mt-1 leading-relaxed">
              Create an underground match, invite friends via link or QR code, and customize game
              dynamics.
            </p>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white font-serif font-black text-xs sm:text-sm tracking-wider uppercase shadow-lg shadow-red-950/50 active:scale-95 transition"
          >
            {user ? (
              <span>{creating ? 'Creating Lobby...' : 'Host New Match'}</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to Host</span>
              </>
            )}
          </button>
        </div>

        {/* Join Room Card */}
        <div className="rounded-2xl bg-stone-900/90 border border-stone-800 p-5 shadow-xl space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-400 mb-2">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="font-serif font-bold text-stone-100 text-base">Join Game Room</h2>
            <p className="text-xs text-stone-400 mt-1 leading-relaxed">
              Enter the 6-letter room code shared by your host to join the town.
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. MFA482"
              maxLength={8}
              className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-center font-mono font-bold tracking-widest text-sm focus:outline-none focus:border-amber-500 uppercase"
            />

            {joinError && <p className="text-[11px] text-red-400 text-center">{joinError}</p>}

            <button
              type="submit"
              disabled={joining || !joinCode.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-serif font-black text-xs sm:text-sm tracking-wider uppercase border border-stone-700 shadow-md active:scale-95 transition disabled:opacity-50"
            >
              <span>{joining ? 'Entering Room...' : 'Enter Game'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Factions Showcase */}
      <div className="rounded-2xl bg-stone-900/60 border border-stone-800/80 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-serif font-bold text-stone-300 uppercase tracking-wider">
            The Two Factions
          </span>
          <button
            onClick={() => {
              playClick();
              onOpenRules();
            }}
            className="text-xs text-amber-400 hover:text-amber-300 underline"
          >
            How to Play
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Mafia */}
          <div className="p-3.5 rounded-xl bg-stone-950/70 border border-red-900/40 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-950 border border-red-700/60 flex items-center justify-center">
                <Skull className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="font-bold text-red-300">The Mafia Syndicate</p>
                <p className="text-[10px] text-stone-400">Night Assassination & Deception</p>
              </div>
            </div>
            <p className="text-[11px] text-stone-300 pt-1 leading-relaxed">
              Know each other's identities. Strike every night and blend into the town during day
              trials.
            </p>
          </div>

          {/* Villagers */}
          <div className="p-3.5 rounded-xl bg-stone-950/70 border border-amber-900/40 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-700/60 flex items-center justify-center">
                <Shield className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <p className="font-bold text-amber-200">The Honest Villagers</p>
                <p className="text-[10px] text-stone-400">Deduction & Jury Majority</p>
              </div>
            </div>
            <p className="text-[11px] text-stone-300 pt-1 leading-relaxed">
              Outnumber the Mafia. Use psychology, voting history, and alibis to expose and convict
              the killers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
