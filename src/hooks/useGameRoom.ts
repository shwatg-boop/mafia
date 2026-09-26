import { useState, useEffect, useCallback, useRef } from 'react';
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { RoomData, PlayerData, ChatMessage, RoomSettings } from '../types/game';
import { assignRoles, getRecommendedMafiaCount, ROLE_DETAILS } from '../utils/roles';
import {
  playGunshot,
  playGavel,
  playDawnChime,
  playMysteryReveal,
  playVictoryFanfare,
} from '../audio/sounds';

const BOT_NAMES = [
  'Don Carmine',
  'Salieri',
  'Vito Corleone',
  'Sophia Moretti',
  'Inspector Vance',
  'Elena Russo',
  'Luca Brasi',
  'Marco Falco',
  'Giulia Rossi',
  'Antonio Bianchi',
];

export function useGameRoom(currentUid?: string, currentDisplayName?: string, photoURL?: string) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Keep track of previous status to trigger dramatic sounds
  const prevStatusRef = useRef<string | null>(null);

  // Subscribe to room doc
  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setPlayers([]);
      setMessages([]);
      return;
    }

    const roomRef = doc(db, 'rooms', roomId);
    const unsubRoom = onSnapshot(
      roomRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as RoomData;
          setRoom(data);

          // Phase change sound triggers
          if (prevStatusRef.current !== data.status) {
            if (data.status === 'role_reveal') {
              playMysteryReveal();
            } else if (data.status === 'day_announcement') {
              playDawnChime();
            } else if (data.status === 'voting') {
              playGavel();
            } else if (data.status === 'game_over') {
              playVictoryFanfare();
            }
            prevStatusRef.current = data.status;
          }
        } else {
          setRoom(null);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `rooms/${roomId}`);
      }
    );

    // Subscribe to players
    const playersRef = collection(db, 'rooms', roomId, 'players');
    const unsubPlayers = onSnapshot(
      playersRef,
      (querySnap) => {
        const pList: PlayerData[] = [];
        querySnap.forEach((d) => {
          pList.push(d.data() as PlayerData);
        });
        // Sort host first, then alphabetically
        pList.sort((a, b) => {
          if (a.isHost) return -1;
          if (b.isHost) return 1;
          return a.displayName.localeCompare(b.displayName);
        });
        setPlayers(pList);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `rooms/${roomId}/players`);
      }
    );

    // Subscribe to recent messages
    const msgsRef = collection(db, 'rooms', roomId, 'messages');
    const msgsQuery = query(msgsRef, orderBy('createdAt', 'asc'), limit(80));
    const unsubMsgs = onSnapshot(
      msgsQuery,
      (querySnap) => {
        const mList: ChatMessage[] = [];
        querySnap.forEach((d) => {
          mList.push(d.data() as ChatMessage);
        });
        setMessages(mList);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `rooms/${roomId}/messages`);
      }
    );

    return () => {
      unsubRoom();
      unsubPlayers();
      unsubMsgs();
    };
  }, [roomId]);

  // Generate 6-letter memorable room code
  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Create room
  const createRoom = async (settings?: Partial<RoomSettings>) => {
    if (!currentUid) throw new Error('You must be signed in to host a game.');
    setLoading(true);
    setError(null);

    const newCode = generateRoomCode();
    const roomRef = doc(db, 'rooms', newCode);

    const roomPayload: RoomData = {
      roomId: newCode,
      hostId: currentUid,
      hostName: currentDisplayName || 'The Host',
      status: 'lobby',
      phaseNumber: 1,
      dayNumber: 1,
      winner: null,
      mafiaCount: settings?.mafiaCount || 1,
      discussionDurationSec: settings?.discussionDurationSec || 60,
      nightDurationSec: settings?.nightDurationSec || 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(roomRef, roomPayload);

      // Add Host as player
      const hostPlayerRef = doc(db, 'rooms', newCode, 'players', currentUid);
      const hostPlayer: PlayerData = {
        uid: currentUid,
        displayName: currentDisplayName || 'The Host',
        photoURL: photoURL || '',
        isHost: true,
        isAlive: true,
        isBot: false,
        isReady: true,
        joinedAt: new Date().toISOString(),
      };
      await setDoc(hostPlayerRef, hostPlayer);

      // Initial system welcome
      const msgRef = doc(collection(db, 'rooms', newCode, 'messages'));
      await setDoc(msgRef, {
        id: msgRef.id,
        senderId: 'system',
        senderName: 'Town Crier',
        channel: 'system',
        text: `Room ${newCode} opened. Share the link or add bot suspects to begin Mafia vs Villagers!`,
        createdAt: new Date().toISOString(),
      });

      setRoomId(newCode);
      return newCode;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `rooms/${newCode}`);
    } finally {
      setLoading(false);
    }
  };

  // Join existing room
  const joinRoom = async (targetCode: string) => {
    if (!currentUid) throw new Error('Sign in with Google to join.');
    setLoading(true);
    setError(null);

    const cleanCode = targetCode.trim().toUpperCase();
    const roomRef = doc(db, 'rooms', cleanCode);

    try {
      const snap = await getDoc(roomRef);
      if (!snap.exists()) {
        throw new Error(`Room "${cleanCode}" was not found. Please verify the code.`);
      }

      const rData = snap.data() as RoomData;
      const playerRef = doc(db, 'rooms', cleanCode, 'players', currentUid);
      const playerSnap = await getDoc(playerRef);

      if (!playerSnap.exists() && rData.status !== 'lobby') {
        throw new Error('This game is already underway. You can join the next round.');
      }

      // Check player limit (max 16)
      const existingPlayers = await getDocs(collection(db, 'rooms', cleanCode, 'players'));
      if (!playerSnap.exists() && existingPlayers.size >= 16) {
        throw new Error('This room is currently full (16 players maximum).');
      }

      // Join or reconnect
      const playerData: PlayerData = playerSnap.exists()
        ? (playerSnap.data() as PlayerData)
        : {
            uid: currentUid,
            displayName: currentDisplayName || 'Player',
            photoURL: photoURL || '',
            isHost: false,
            isAlive: true,
            isBot: false,
            isReady: false,
            joinedAt: new Date().toISOString(),
          };

      playerData.displayName = currentDisplayName || playerData.displayName;
      if (photoURL) playerData.photoURL = photoURL;

      await setDoc(playerRef, playerData, { merge: true });

      if (!playerSnap.exists()) {
        const msgRef = doc(collection(db, 'rooms', cleanCode, 'messages'));
        await setDoc(msgRef, {
          id: msgRef.id,
          senderId: 'system',
          senderName: 'Town Crier',
          channel: 'system',
          text: `${playerData.displayName} arrived at the town square.`,
          createdAt: new Date().toISOString(),
        });
      }

      setRoomId(cleanCode);
      return cleanCode;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to join room';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Leave room
  const leaveRoom = async () => {
    if (!roomId || !currentUid) return;
    try {
      const playerRef = doc(db, 'rooms', roomId, 'players', currentUid);
      await deleteDoc(playerRef);
      setRoomId(null);
    } catch (err) {
      console.error('Leave room error:', err);
      setRoomId(null);
    }
  };

  // Update room settings (Host only)
  const updateSettings = async (settings: Partial<RoomData>) => {
    if (!roomId) return;
    try {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        ...settings,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rooms/${roomId}`);
    }
  };

  // Add a Bot suspect
  const addBotPlayer = async () => {
    if (!roomId) return;
    try {
      const existingNames = new Set(players.map((p) => p.displayName));
      const availableName =
        BOT_NAMES.find((name) => !existingNames.has(name)) || `Suspect #${players.length + 1}`;
      const botUid = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const botRef = doc(db, 'rooms', roomId, 'players', botUid);
      await setDoc(botRef, {
        uid: botUid,
        displayName: availableName,
        photoURL: '',
        isHost: false,
        isAlive: true,
        isBot: true,
        isReady: true,
        joinedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `rooms/${roomId}/players/bot`);
    }
  };

  // Remove a Bot suspect
  const removeBotPlayer = async (botUid: string) => {
    if (!roomId) return;
    try {
      const botRef = doc(db, 'rooms', roomId, 'players', botUid);
      await deleteDoc(botRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `rooms/${roomId}/players/${botUid}`);
    }
  };

  // Toggle ready status in lobby
  const toggleReady = async () => {
    if (!roomId || !currentUid) return;
    const me = players.find((p) => p.uid === currentUid);
    if (!me) return;

    try {
      const playerRef = doc(db, 'rooms', roomId, 'players', currentUid);
      await updateDoc(playerRef, {
        isReady: !me.isReady,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rooms/${roomId}/players/${currentUid}`);
    }
  };

  // Start the Game (Host only)
  const startGame = async () => {
    if (!roomId || !room) return;
    if (players.length < 3) {
      throw new Error('A minimum of 3 players (or bots) is required to start Mafia.');
    }

    try {
      // 1. Assign roles (only mafia and villager)
      const playerIds = players.map((p) => p.uid);
      const roleAssignments = assignRoles(playerIds, {
        mafiaCount: room.mafiaCount || getRecommendedMafiaCount(players.length),
      });

      // 2. Update players in subcollection
      for (const p of players) {
        const role = roleAssignments[p.uid];
        const team = ROLE_DETAILS[role].team;
        const pRef = doc(db, 'rooms', roomId, 'players', p.uid);
        await updateDoc(pRef, {
          role,
          team,
          isAlive: true,
          nightTargetId: '',
          voteTargetId: '',
        });
      }

      // 3. Update room state to 'role_reveal'
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        status: 'role_reveal',
        phaseNumber: 1,
        dayNumber: 1,
        winner: null,
        lastEliminatedName: '',
        lastEliminatedRole: '',
        lastNightSummary: '',
        phaseDeadline: Date.now() + 10000, // 10 seconds to view secret identity
        updatedAt: new Date().toISOString(),
      });

      // System notification
      const msgRef = doc(collection(db, 'rooms', roomId, 'messages'));
      await setDoc(msgRef, {
        id: msgRef.id,
        senderId: 'system',
        senderName: 'The Syndicate',
        channel: 'system',
        text: 'Roles have been assigned in secret. Guard your screen carefully!',
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rooms/${roomId}`);
    }
  };

  // Advance from Role Reveal to Night 1
  const advanceToNight = async () => {
    if (!roomId || !room) return;
    try {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        status: 'night',
        phaseDeadline: Date.now() + (room.nightDurationSec || 30) * 1000,
        updatedAt: new Date().toISOString(),
      });

      triggerBotNightActions();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rooms/${roomId}`);
    }
  };

  // Bot AI Night Actions (Only Mafia bots perform kills)
  const triggerBotNightActions = async () => {
    if (!roomId) return;
    const botMafiosi = players.filter((p) => p.isBot && p.isAlive && p.role === 'mafia');
    const aliveVillagers = players.filter((p) => p.isAlive && p.role !== 'mafia');

    if (aliveVillagers.length === 0) return;

    // Pick a shared or common victim for bots
    const chosen = aliveVillagers[Math.floor(Math.random() * aliveVillagers.length)];

    for (const bot of botMafiosi) {
      const bRef = doc(db, 'rooms', roomId, 'players', bot.uid);
      await updateDoc(bRef, { nightTargetId: chosen.uid });
    }
  };

  // Submit Night Action (Mafia Player)
  const submitNightAction = async (targetId: string) => {
    if (!roomId || !currentUid) return;
    const me = players.find((p) => p.uid === currentUid);
    if (!me || !me.isAlive || me.role !== 'mafia') return;

    try {
      const pRef = doc(db, 'rooms', roomId, 'players', currentUid);
      await updateDoc(pRef, { nightTargetId: targetId });

      // Check if all alive Mafia members have picked their target
      checkNightResolution();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rooms/${roomId}/players/${currentUid}`);
    }
  };

  // Check if night actions are complete
  const checkNightResolution = useCallback(async () => {
    if (!roomId || !room || room.status !== 'night') return;

    const pSnap = await getDocs(collection(db, 'rooms', roomId, 'players'));
    const freshPlayers: PlayerData[] = [];
    pSnap.forEach((d) => freshPlayers.push(d.data() as PlayerData));

    const aliveMafia = freshPlayers.filter((p) => p.isAlive && p.role === 'mafia');
    const allMafiaSubmitted = aliveMafia.every((p) => Boolean(p.nightTargetId));

    if (allMafiaSubmitted && aliveMafia.length > 0) {
      resolveNight(freshPlayers);
    }
  }, [roomId, room]);

  // Resolve Night Phase
  const resolveNight = async (currentPlayers?: PlayerData[]) => {
    if (!roomId || !room) return;
    const pList = currentPlayers || players;
    const alivePlayers = pList.filter((p) => p.isAlive);

    // 1. Tally Mafia targets
    const mafiaVotes: { [targetId: string]: number } = {};
    pList
      .filter((p) => p.isAlive && p.role === 'mafia' && p.nightTargetId)
      .forEach((m) => {
        mafiaVotes[m.nightTargetId!] = (mafiaVotes[m.nightTargetId!] || 0) + 1;
      });

    let mafiaTargetId: string | null = null;
    let maxVotes = 0;
    Object.entries(mafiaVotes).forEach(([tid, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        mafiaTargetId = tid;
      }
    });

    let eliminatedPlayer: PlayerData | null = null;
    let summary = '';

    if (mafiaTargetId) {
      const victim = pList.find((p) => p.uid === mafiaTargetId);
      if (victim) {
        eliminatedPlayer = victim;
        summary = `Gunfire shattered the midnight quiet. ${victim.displayName} was found eliminated in the alleyway.`;
        playGunshot();

        const victimRef = doc(db, 'rooms', roomId, 'players', victim.uid);
        await updateDoc(victimRef, { isAlive: false });
      }
    } else {
      summary = 'A quiet night settled over the city. No gunshots were heard.';
    }

    // Reset night targets for next night
    for (const p of pList) {
      const pRef = doc(db, 'rooms', roomId, 'players', p.uid);
      await updateDoc(pRef, { nightTargetId: '' });
    }

    // Check Win Condition:
    // Town wins if all Mafia are dead.
    // Mafia wins if remaining Mafia >= remaining Villagers (parity/majority).
    const remainingAlive = alivePlayers.filter(
      (p) => (eliminatedPlayer ? p.uid !== eliminatedPlayer.uid : true)
    );
    const mafiaRemaining = remainingAlive.filter((p) => p.role === 'mafia').length;
    const townRemaining = remainingAlive.filter((p) => p.role === 'villager').length;

    let winner: 'town' | 'mafia' | null = null;
    if (mafiaRemaining === 0) {
      winner = 'town';
    } else if (mafiaRemaining >= townRemaining) {
      winner = 'mafia';
    }

    const roomRef = doc(db, 'rooms', roomId);
    if (winner) {
      await updateDoc(roomRef, {
        status: 'game_over',
        winner,
        lastNightSummary: summary,
        lastEliminatedName: eliminatedPlayer?.displayName || '',
        lastEliminatedRole: eliminatedPlayer?.role || '',
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Advance to morning newspaper announcement
      await updateDoc(roomRef, {
        status: 'day_announcement',
        lastNightSummary: summary,
        lastEliminatedName: eliminatedPlayer?.displayName || '',
        lastEliminatedRole: eliminatedPlayer?.role || '',
        phaseDeadline: Date.now() + 8000, // 8 seconds morning newspaper
        updatedAt: new Date().toISOString(),
      });
    }

    const msgRef = doc(collection(db, 'rooms', roomId, 'messages'));
    await setDoc(msgRef, {
      id: msgRef.id,
      senderId: 'system',
      senderName: 'Daily Inquirer',
      channel: 'system',
      text: summary,
      createdAt: new Date().toISOString(),
    });
  };

  // Advance from Day Announcement to Discussion
  const advanceToDiscussion = async () => {
    if (!roomId || !room) return;
    try {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        status: 'day_discussion',
        phaseDeadline: Date.now() + (room.discussionDurationSec || 60) * 1000,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rooms/${roomId}`);
    }
  };

  // Advance to Voting Phase
  const advanceToVoting = async () => {
    if (!roomId) return;
    try {
      // Clear votes
      for (const p of players) {
        const pRef = doc(db, 'rooms', roomId, 'players', p.uid);
        await updateDoc(pRef, { voteTargetId: '' });
      }

      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        status: 'voting',
        phaseDeadline: Date.now() + 40000, // 40 seconds to cast ballots
        updatedAt: new Date().toISOString(),
      });

      triggerBotVotes();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rooms/${roomId}`);
    }
  };

  // Bot AI Voting Actions
  const triggerBotVotes = async () => {
    if (!roomId) return;
    const botPlayers = players.filter((p) => p.isBot && p.isAlive);
    const aliveTargets = players.filter((p) => p.isAlive);

    botPlayers.forEach((bot, idx) => {
      setTimeout(async () => {
        if (!roomId) return;
        // 80% vote for a non-self suspect, 20% skip
        let targetId = 'skip';
        if (Math.random() < 0.8) {
          const suspects = aliveTargets.filter((p) => p.uid !== bot.uid);
          if (suspects.length > 0) {
            targetId = suspects[Math.floor(Math.random() * suspects.length)].uid;
          }
        }
        const bRef = doc(db, 'rooms', roomId, 'players', bot.uid);
        await updateDoc(bRef, { voteTargetId: targetId });
      }, 1500 + idx * 1000);
    });
  };

  // Cast Vote (Player)
  const submitVote = async (targetId: string) => {
    if (!roomId || !currentUid) return;
    const me = players.find((p) => p.uid === currentUid);
    if (!me || !me.isAlive) return;

    try {
      const pRef = doc(db, 'rooms', roomId, 'players', currentUid);
      await updateDoc(pRef, { voteTargetId: targetId });

      checkVotingResolution();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rooms/${roomId}/players/${currentUid}`);
    }
  };

  // Check if voting resolution condition met
  const checkVotingResolution = useCallback(async () => {
    if (!roomId || !room || room.status !== 'voting') return;

    const pSnap = await getDocs(collection(db, 'rooms', roomId, 'players'));
    const freshPlayers: PlayerData[] = [];
    pSnap.forEach((d) => freshPlayers.push(d.data() as PlayerData));

    const alive = freshPlayers.filter((p) => p.isAlive);
    const allVoted = alive.every((p) => Boolean(p.voteTargetId));

    if (allVoted && alive.length > 0) {
      resolveVoting(freshPlayers);
    }
  }, [roomId, room]);

  // Resolve Voting Phase (Lynch trial)
  const resolveVoting = async (currentPlayers?: PlayerData[]) => {
    if (!roomId || !room) return;
    const pList = currentPlayers || players;
    const alivePlayers = pList.filter((p) => p.isAlive);

    // Count votes
    const voteCounts: { [targetId: string]: number } = {};
    pList
      .filter((p) => p.isAlive && p.voteTargetId)
      .forEach((p) => {
        voteCounts[p.voteTargetId!] = (voteCounts[p.voteTargetId!] || 0) + 1;
      });

    let topTargetId: string | null = null;
    let highestVotes = 0;
    let isTie = false;

    Object.entries(voteCounts).forEach(([tid, count]) => {
      if (count > highestVotes) {
        highestVotes = count;
        topTargetId = tid;
        isTie = false;
      } else if (count === highestVotes && count > 0) {
        isTie = true;
      }
    });

    let executedPlayer: PlayerData | null = null;
    let trialSummary = '';

    // Majority needed (more than half of living players)
    const requiredVotes = Math.floor(alivePlayers.length / 2) + 1;

    if (topTargetId && topTargetId !== 'skip' && !isTie && highestVotes >= requiredVotes) {
      executedPlayer = pList.find((p) => p.uid === topTargetId) || null;
      if (executedPlayer) {
        playGavel();
        trialSummary = `By majority conviction (${highestVotes} votes), the town condemned ${executedPlayer.displayName} to execution!`;

        const pRef = doc(db, 'rooms', roomId, 'players', executedPlayer.uid);
        await updateDoc(pRef, { isAlive: false });
      }
    } else {
      trialSummary =
        topTargetId === 'skip'
          ? 'The citizens voted to stay execution. No one was lynched today.'
          : isTie
          ? 'The votes resulted in a deadlock tie. The jury dismissed without an execution.'
          : 'Insufficient votes to reach a guilty verdict. The town disperses into the evening.';
    }

    // Reset votes
    for (const p of pList) {
      const pRef = doc(db, 'rooms', roomId, 'players', p.uid);
      await updateDoc(pRef, { voteTargetId: '' });
    }

    // Check Win Condition
    const remainingAlive = alivePlayers.filter(
      (p) => (executedPlayer ? p.uid !== executedPlayer.uid : true)
    );
    const mafiaRemaining = remainingAlive.filter((p) => p.role === 'mafia').length;
    const townRemaining = remainingAlive.filter((p) => p.role === 'villager').length;

    let winner: 'town' | 'mafia' | null = null;
    if (mafiaRemaining === 0) {
      winner = 'town';
    } else if (mafiaRemaining >= townRemaining) {
      winner = 'mafia';
    }

    const roomRef = doc(db, 'rooms', roomId);
    if (winner) {
      await updateDoc(roomRef, {
        status: 'game_over',
        winner,
        lastEliminatedName: executedPlayer?.displayName || '',
        lastEliminatedRole: executedPlayer?.role || '',
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Advance to next night cycle
      await updateDoc(roomRef, {
        status: 'night',
        dayNumber: (room.dayNumber || 1) + 1,
        phaseDeadline: Date.now() + (room.nightDurationSec || 30) * 1000,
        lastEliminatedName: executedPlayer?.displayName || '',
        lastEliminatedRole: executedPlayer?.role || '',
        updatedAt: new Date().toISOString(),
      });

      triggerBotNightActions();
    }

    // Announce trial outcome in chat
    const msgRef = doc(collection(db, 'rooms', roomId, 'messages'));
    await setDoc(msgRef, {
      id: msgRef.id,
      senderId: 'system',
      senderName: 'The Court',
      channel: 'system',
      text: trialSummary,
      createdAt: new Date().toISOString(),
    });
  };

  // Send Chat Message
  const sendMessage = async (text: string, channel: 'town' | 'mafia') => {
    if (!roomId || !currentUid) return;
    const trimmed = text.trim().slice(0, 400);
    if (!trimmed) return;

    try {
      const msgRef = doc(collection(db, 'rooms', roomId, 'messages'));
      const newMsg: ChatMessage = {
        id: msgRef.id,
        senderId: currentUid,
        senderName: currentDisplayName || 'Player',
        channel,
        text: trimmed,
        createdAt: new Date().toISOString(),
      };
      await setDoc(msgRef, newMsg);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `rooms/${roomId}/messages`);
    }
  };

  // Restart match in same room (Host only)
  const restartGame = async () => {
    if (!roomId) return;
    try {
      // Reset players
      for (const p of players) {
        const pRef = doc(db, 'rooms', roomId, 'players', p.uid);
        await updateDoc(pRef, {
          isAlive: true,
          role: '',
          team: '',
          nightTargetId: '',
          voteTargetId: '',
          isReady: p.isHost,
        });
      }

      // Reset room to lobby
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        status: 'lobby',
        phaseNumber: 1,
        dayNumber: 1,
        winner: null,
        lastEliminatedName: '',
        lastEliminatedRole: '',
        lastNightSummary: '',
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rooms/${roomId}`);
    }
  };

  return {
    roomId,
    room,
    players,
    messages,
    loading,
    error,
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
  };
}
