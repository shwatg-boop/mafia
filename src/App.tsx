import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useGameRoom } from './hooks/useGameRoom';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { LobbyView } from './components/LobbyView';
import { RoleRevealModal } from './components/RoleRevealModal';
import { NightPhaseView } from './components/NightPhaseView';
import { DawnAnnouncementView } from './components/DawnAnnouncementView';
import { DayDiscussionView } from './components/DayDiscussionView';
import { VotingPhaseView } from './components/VotingPhaseView';
import { GameOverView } from './components/GameOverView';
import { RulesModal } from './components/RulesModal';
import { ShareModal } from './components/ShareModal';
import { ChatDrawer } from './components/ChatDrawer';
import { playClick } from './audio/sounds';

export default function App() {
  const {
    user,
    loading: authLoading,
    authError,
    displayName,
    loginWithGoogle,
    logout,
    updatePlayerName,
  } = useAuth();

  const {
    roomId,
    room,
    players,
    messages,
    loading: gameLoading,
    error: gameError,
    createRoom,
    joinRoom,
    leaveRoom,
    updateSettings,
    addBotPlayer,
    removeBotPlayer,
    toggleReady,
    startGame,
    advanceToNight,
    submitNightAction,
    resolveNight,
    advanceToDiscussion,
    advanceToVoting,
    submitVote,
    resolveVoting,
    sendMessage,
    restartGame,
  } = useGameRoom(user?.uid, displayName, user?.photoURL || undefined);

  const [showRules, setShowRules] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [initialRoomCode, setInitialRoomCode] = useState<string | null>(null);

  // Extract ?room=CODE from URL if shared
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromQuery = urlParams.get('room');
      if (codeFromQuery) {
        setInitialRoomCode(codeFromQuery.toUpperCase());
      } else {
        // Also check hash #room=CODE
        const hash = window.location.hash;
        if (hash.includes('room=')) {
          const match = hash.match(/room=([A-Za-z0-9]+)/);
          if (match && match[1]) {
            setInitialRoomCode(match[1].toUpperCase());
          }
        }
      }
    }
  }, []);

  // Auto-join if user is signed in and opened an invite link
  useEffect(() => {
    if (user && initialRoomCode && !roomId) {
      joinRoom(initialRoomCode).catch((err) => {
        console.error('Auto join failed:', err);
      });
    }
  }, [user, initialRoomCode, roomId, joinRoom]);

  const currentPlayer = players.find((p) => p.uid === user?.uid);
  const isHost = currentPlayer?.isHost ?? false;
  const isNight = room?.status === 'night';

  // Count unread or active chat
  const chatCount = messages.length;

  return (
    <div className="min-h-screen bg-[#08090d] text-[#e0e2ec] flex flex-col font-sans selection:bg-red-900 selection:text-white">
      {/* Top Header */}
      <Header
        user={user}
        roomId={roomId}
        isHost={isHost}
        onOpenRules={() => setShowRules(true)}
        onOpenShare={() => setShowShare(true)}
        onLogin={loginWithGoogle}
        onLogout={logout}
        onLeaveRoom={leaveRoom}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-4 md:p-6">
        {/* Global errors if any */}
        {(authError || gameError) && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-700/60 text-red-200 text-xs text-center animate-in fade-in">
            {authError || gameError}
          </div>
        )}

        {/* Loading state for initial auth */}
        {authLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
            <p className="text-xs text-stone-400 font-mono tracking-widest uppercase">
              Initializing Syndicate Network...
            </p>
          </div>
        ) : !roomId || !room ? (
          /* Home View: Host or Join */
          <HomeView
            user={user}
            displayName={displayName}
            loading={gameLoading}
            onLogin={loginWithGoogle}
            onUpdateName={updatePlayerName}
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            onOpenRules={() => setShowRules(true)}
            initialRoomCode={initialRoomCode}
          />
        ) : (
          /* In-Room Game States */
          <div>
            {/* 1. Lobby Phase */}
            {room.status === 'lobby' && (
              <LobbyView
                room={room}
                players={players}
                currentUid={user?.uid}
                isHost={isHost}
                onStartGame={startGame}
                onToggleReady={toggleReady}
                onAddBot={addBotPlayer}
                onRemoveBot={removeBotPlayer}
                onUpdateSettings={updateSettings}
                onOpenShare={() => setShowShare(true)}
              />
            )}

            {/* 2. Role Reveal Phase (Modal overlay over active table) */}
            {room.status === 'role_reveal' && currentPlayer && (
              <RoleRevealModal
                player={currentPlayer}
                allPlayers={players}
                isHost={isHost}
                onProceedToNight={advanceToNight}
              />
            )}

            {/* 3. Night Phase */}
            {room.status === 'night' && (
              <NightPhaseView
                room={room}
                players={players}
                currentUid={user?.uid}
                isHost={isHost}
                onSubmitAction={submitNightAction}
                onResolveNight={resolveNight}
                onOpenChat={() => setShowChat(true)}
              />
            )}

            {/* 4. Dawn Announcement Phase */}
            {room.status === 'day_announcement' && (
              <DawnAnnouncementView
                room={room}
                players={players}
                currentUid={user?.uid}
                isHost={isHost}
                onProceedToDiscussion={advanceToDiscussion}
              />
            )}

            {/* 5. Day Discussion Phase */}
            {room.status === 'day_discussion' && (
              <DayDiscussionView
                room={room}
                players={players}
                messages={messages}
                currentUid={user?.uid}
                isHost={isHost}
                onAdvanceToVoting={advanceToVoting}
                onSendMessage={sendMessage}
                onOpenChat={() => setShowChat(true)}
              />
            )}

            {/* 6. Voting / Trial Phase */}
            {room.status === 'voting' && (
              <VotingPhaseView
                room={room}
                players={players}
                currentUid={user?.uid}
                isHost={isHost}
                onSubmitVote={submitVote}
                onResolveVoting={resolveVoting}
              />
            )}

            {/* 7. Game Over Phase */}
            {room.status === 'game_over' && (
              <GameOverView
                room={room}
                players={players}
                currentUid={user?.uid}
                isHost={isHost}
                onRestartGame={restartGame}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating Chat Trigger Button in active room */}
      {roomId && room && room.status !== 'lobby' && (
        <button
          onClick={() => {
            playClick();
            setShowChat(true);
          }}
          className="fixed bottom-4 right-4 z-30 p-3.5 rounded-full bg-gradient-to-r from-red-800 to-stone-900 border border-red-700/60 text-white shadow-2xl active:scale-95 transition flex items-center gap-1.5"
          title="Open Chat"
        >
          <MessageSquare className="w-5 h-5 text-amber-300" />
          <span className="text-xs font-bold font-mono">{chatCount}</span>
        </button>
      )}

      {/* Modals & Drawers */}
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      {roomId && (
        <ShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          roomId={roomId}
        />
      )}

      {roomId && (
        <ChatDrawer
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          messages={messages}
          currentUid={user?.uid}
          player={currentPlayer}
          isNight={isNight}
          onSendMessage={sendMessage}
        />
      )}
    </div>
  );
}
