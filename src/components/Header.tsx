import React, { useState } from 'react';
import { Volume2, VolumeX, BookOpen, Share2, LogOut, LogIn, Crown, ShieldAlert } from 'lucide-react';
import { isAudioMuted, toggleAudioMute, playClick } from '../audio/sounds';
import { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
  roomId: string | null;
  isHost: boolean;
  onOpenRules: () => void;
  onOpenShare: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onLeaveRoom: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  roomId,
  isHost,
  onOpenRules,
  onOpenShare,
  onLogin,
  onLogout,
  onLeaveRoom,
}) => {
  const [muted, setMuted] = useState(isAudioMuted());
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleMuteToggle = () => {
    playClick();
    const state = toggleAudioMute();
    setMuted(state);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0d0e14]/95 backdrop-blur-md border-b border-stone-800/80 px-3 py-2.5">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-800 to-stone-900 border border-red-700/50 flex items-center justify-center shadow-lg shadow-red-950/40">
            <span className="font-serif text-lg font-black text-red-100 tracking-tighter">M</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-black tracking-wider text-sm sm:text-base text-stone-100 uppercase">
                Mafia Noir
              </span>
              <span className="text-[10px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/40">
                LIVE
              </span>
            </div>
            {roomId && (
              <div className="flex items-center gap-1 text-[11px] text-stone-400 font-mono">
                <span>ROOM:</span>
                <span className="text-amber-400 font-bold tracking-widest">{roomId}</span>
                {isHost && (
                  <span className="flex items-center text-[10px] text-amber-500 ml-1">
                    <Crown className="w-2.5 h-2.5 inline mr-0.5" /> HOST
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {roomId && (
            <button
              onClick={() => {
                playClick();
                onOpenShare();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700/60 text-xs font-medium transition active:scale-95 shadow-sm"
              title="Invite Friends"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Invite</span>
            </button>
          )}

          {/* Sound toggle */}
          <button
            onClick={handleMuteToggle}
            className="p-1.5 sm:p-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700/60 text-xs transition active:scale-95"
            title={muted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-stone-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Rules book */}
          <button
            onClick={() => {
              playClick();
              onOpenRules();
            }}
            className="p-1.5 sm:p-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700/60 text-xs transition active:scale-95"
            title="How to Play"
          >
            <BookOpen className="w-4 h-4 text-stone-300" />
          </button>

          {/* User profile / Auth button */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 p-1 rounded-full border border-stone-700/80 bg-stone-900 active:scale-95 transition"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Player'}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-stone-800 text-stone-200 flex items-center justify-center text-xs font-bold font-serif">
                    {(user.displayName || 'P').charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-stone-900 border border-stone-800 shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2 py-1.5 border-b border-stone-800/80 mb-1">
                      <p className="font-semibold text-stone-200 truncate">{user.displayName}</p>
                      <p className="text-[10px] text-stone-400 truncate">{user.email}</p>
                    </div>

                    {roomId && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          playClick();
                          onLeaveRoom();
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-amber-400 hover:bg-amber-950/30 rounded-lg transition"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Leave Game Room
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        playClick();
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-red-400 hover:bg-red-950/30 rounded-lg transition mt-0.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                playClick();
                onLogin();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-white font-medium text-xs shadow-md shadow-red-950/50 active:scale-95 transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
