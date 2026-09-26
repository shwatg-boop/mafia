import React, { useState, useEffect } from 'react';
import { Scale, CheckCircle2, AlertTriangle, Clock, ShieldX, Bot } from 'lucide-react';
import { RoomData, PlayerData } from '../types/game';
import { playGavel, playClick, playTick } from '../audio/sounds';

interface VotingPhaseViewProps {
  room: RoomData;
  players: PlayerData[];
  currentUid?: string;
  isHost: boolean;
  onSubmitVote: (targetId: string) => Promise<void>;
  onResolveVoting: () => Promise<void>;
}

export const VotingPhaseView: React.FC<VotingPhaseViewProps> = ({
  room,
  players,
  currentUid,
  isHost,
  onSubmitVote,
  onResolveVoting,
}) => {
  const me = players.find((p) => p.uid === currentUid);
  const isAlive = me?.isAlive ?? false;
  const [selectedVoteId, setSelectedVoteId] = useState<string>(me?.voteTargetId || '');
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(45);

  useEffect(() => {
    if (me?.voteTargetId) {
      setSelectedVoteId(me.voteTargetId);
    }
  }, [me?.voteTargetId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (room.phaseDeadline) {
        const remaining = Math.max(0, Math.ceil((room.phaseDeadline - Date.now()) / 1000));
        setSecondsLeft(remaining);
        if (remaining <= 5 && remaining > 0) {
          playTick();
        }
        if (remaining <= 0 && isHost) {
          onResolveVoting();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [room.phaseDeadline, isHost, onResolveVoting]);

  const alivePlayers = players.filter((p) => p.isAlive);
  const requiredVotes = Math.floor(alivePlayers.length / 2) + 1;

  // Calculate live vote tally
  const voteTally: { [targetId: string]: { count: number; voters: string[] } } = {};
  alivePlayers.forEach((p) => {
    voteTally[p.uid] = { count: 0, voters: [] };
  });
  voteTally['skip'] = { count: 0, voters: [] };

  players
    .filter((p) => p.isAlive && p.voteTargetId)
    .forEach((p) => {
      if (voteTally[p.voteTargetId!]) {
        voteTally[p.voteTargetId!].count += 1;
        voteTally[p.voteTargetId!].voters.push(p.displayName);
      }
    });

  const totalVotesCast = alivePlayers.filter((p) => Boolean(p.voteTargetId)).length;

  const handleVote = async (targetId: string) => {
    if (!isAlive || submitting) return;
    playGavel();
    setSelectedVoteId(targetId);
    setSubmitting(true);
    try {
      await onSubmitVote(targetId);
    } catch (err) {
      console.error('Error submitting vote:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-24">
      {/* Courthouse Header */}
      <div className="rounded-2xl bg-gradient-to-b from-[#181111] via-[#201414] to-[#2b1818] border border-red-900/50 p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-800/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-red-700/60 flex items-center justify-center">
              <Scale className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-red-400 uppercase font-semibold">
                Trial by Jury • Day {room.dayNumber || 1}
              </span>
              <h1 className="font-serif font-black text-xl text-stone-100 tracking-wide">
                Courtroom Ballot
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs font-mono font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{secondsLeft}s</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-red-950/60 flex items-center justify-between text-xs">
          <span className="text-stone-300">
            Ballots Cast: <strong>{totalVotesCast}</strong> / {alivePlayers.length}
          </span>
          <span className="text-amber-400 font-semibold">
            Execution Quorum: {requiredVotes} votes
          </span>
        </div>
      </div>

      {/* Dead spectator note */}
      {!isAlive && (
        <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 text-center text-xs text-stone-400">
          You are deceased and have no voting rights in the town trial.
        </div>
      )}

      {/* Living Suspects Ballot List */}
      <div className="rounded-2xl bg-stone-900/90 border border-stone-800 p-4 shadow-xl space-y-3">
        <h2 className="font-serif font-bold text-stone-200 text-xs tracking-wider uppercase">
          Cast Your Accusation
        </h2>

        <div className="space-y-2">
          {alivePlayers.map((suspect) => {
            const isMe = suspect.uid === currentUid;
            const isSelected = selectedVoteId === suspect.uid;
            const tally = voteTally[suspect.uid] || { count: 0, voters: [] };
            const progressPct = Math.min(100, (tally.count / requiredVotes) * 100);

            return (
              <div
                key={suspect.uid}
                className={`p-3 rounded-xl border transition ${
                  isSelected
                    ? 'bg-red-950/70 border-red-500 shadow-md'
                    : 'bg-stone-950/70 border-stone-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-stone-200">
                      {suspect.displayName}
                    </span>
                    {isMe && (
                      <span className="text-[9px] font-mono uppercase px-1 rounded bg-stone-800 text-stone-400">
                        You
                      </span>
                    )}
                    {suspect.isBot && <Bot className="w-3.5 h-3.5 text-stone-500" />}
                  </div>

                  {isAlive && (
                    <button
                      onClick={() => handleVote(suspect.uid)}
                      disabled={submitting}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                        isSelected
                          ? 'bg-red-700 text-white border border-red-500'
                          : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
                      }`}
                    >
                      {isSelected ? '✓ Voted' : 'Vote Lynch'}
                    </button>
                  )}
                </div>

                {/* Vote Bar Progress */}
                <div className="mt-2 pt-2 border-t border-stone-800/60">
                  <div className="flex justify-between text-[11px] text-stone-400 mb-1">
                    <span>
                      Votes: <strong className="text-stone-200">{tally.count}</strong>
                    </span>
                    {tally.count >= requiredVotes && (
                      <span className="text-red-400 font-bold">Majority Reached!</span>
                    )}
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-stone-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        tally.count >= requiredVotes ? 'bg-red-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  {tally.voters.length > 0 && (
                    <p className="text-[10px] text-stone-500 mt-1 truncate">
                      Voted by: {tally.voters.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Stay execution / skip vote */}
          <div
            className={`p-3 rounded-xl border transition ${
              selectedVoteId === 'skip'
                ? 'bg-amber-950/40 border-amber-500 shadow-md'
                : 'bg-stone-950/70 border-stone-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-xs sm:text-sm text-stone-300">
                  Stay Execution / Dismiss Jury
                </p>
                <p className="text-[11px] text-stone-500">Vote not to eliminate anyone today</p>
              </div>

              {isAlive && (
                <button
                  onClick={() => handleVote('skip')}
                  disabled={submitting}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                    selectedVoteId === 'skip'
                      ? 'bg-amber-600 text-stone-900 border border-amber-400'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
                  }`}
                >
                  {selectedVoteId === 'skip' ? '✓ Voted Skip' : 'Abstain / Skip'}
                </button>
              )}
            </div>

            <div className="mt-2 pt-2 border-t border-stone-800/60">
              <span className="text-[11px] text-stone-400">
                Skip votes: <strong>{voteTally['skip']?.count || 0}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Host resolve bypass */}
      {isHost && (
        <div className="pt-2">
          <button
            onClick={() => {
              playClick();
              onResolveVoting();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium text-xs border border-stone-700 transition"
          >
            Resolve Verdict Now (Host Bypass)
          </button>
        </div>
      )}
    </div>
  );
};
