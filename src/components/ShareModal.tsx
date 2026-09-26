import React, { useState } from 'react';
import { X, Copy, Check, Share2, Send, QrCode } from 'lucide-react';
import { getQRCodeUrl } from '../utils/qr';
import { playClick } from '../audio/sounds';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, roomId }) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen) return null;

  // Build full join URL
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const joinUrl = `${origin}${pathname}?room=${roomId}`;

  const handleCopy = async () => {
    playClick();
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
    }
  };

  const handleNativeShare = async () => {
    playClick();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Join Mafia Noir Game',
          text: `Join our secret multiplayer Mafia match! Room Code: ${roomId}`,
          url: joinUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  const shareWhatsApp = () => {
    playClick();
    const text = `Join our multiplayer Mafia match! Room Code: ${roomId}\n${joinUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareTelegram = () => {
    playClick();
    const text = `Join our multiplayer Mafia match! Room Code: ${roomId}`;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(joinUrl)}&text=${encodeURIComponent(text)}`,
      '_blank'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-2xl bg-stone-900 border border-stone-800 shadow-2xl p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div>
            <h3 className="font-serif font-bold text-stone-100 text-base tracking-wide">
              Invite Suspects
            </h3>
            <p className="text-xs text-stone-400">Anyone with the link or code can join</p>
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

        {/* Room Code Card */}
        <div className="p-4 rounded-xl bg-gradient-to-b from-stone-950 to-stone-900 border border-stone-800 text-center space-y-1">
          <p className="text-[11px] font-mono tracking-widest text-stone-400 uppercase">
            Secret Room Code
          </p>
          <div className="text-3xl font-black font-mono tracking-widest text-amber-400 selection:bg-amber-900">
            {roomId}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Copy link */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-800 to-stone-900 hover:from-red-700 hover:to-stone-800 text-white font-medium text-xs sm:text-sm border border-red-700/50 shadow-lg active:scale-95 transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Invite Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-300" />
                <span>Copy Invite Link</span>
              </>
            )}
          </button>

          {/* Native share for mobile */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-xs transition active:scale-95 border border-stone-700/60"
            >
              <Share2 className="w-4 h-4 text-cyan-400" />
              <span>Share via Phone Apps</span>
            </button>
          )}

          {/* Social share row */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={shareWhatsApp}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40 text-xs font-medium transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={shareTelegram}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/40 text-xs font-medium transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram</span>
            </button>
            <button
              onClick={() => {
                playClick();
                setShowQR(!showQR);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-medium transition"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span>QR Code</span>
            </button>
          </div>
        </div>

        {/* QR Code preview */}
        {showQR && (
          <div className="pt-2 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="inline-block p-2 rounded-xl bg-white/5 border border-stone-700 shadow-md">
              <img
                src={getQRCodeUrl(joinUrl, 160)}
                alt="Room QR Code"
                className="w-36 h-36 rounded-lg mx-auto"
              />
            </div>
            <p className="text-[10px] text-stone-400 mt-1.5">
              Point mobile camera to join immediately
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
