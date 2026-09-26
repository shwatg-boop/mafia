import { GameRole, RoleInfo } from '../types/game';

export const ROLE_DETAILS: Record<GameRole, RoleInfo> = {
  mafia: {
    name: 'Mafia',
    team: 'mafia',
    badgeColor: 'bg-red-950/80 border-red-500 text-red-300',
    icon: 'Skull',
    tagline: 'Syndicate Operative',
    description:
      'You are a member of the secret criminal syndicate. Conspire with fellow Mafia in secret to assassinate a villager each night, and bluff your way through the daytime trials.',
    nightActionDescription: 'Choose an innocent villager to assassinate tonight.',
  },
  villager: {
    name: 'Villager',
    team: 'town',
    badgeColor: 'bg-stone-900 border-amber-500/50 text-amber-200',
    icon: 'Shield',
    tagline: 'Honest Citizen',
    description:
      'You are an honest citizen. You have no night powers—your weapon is keen observation, logic, psychological deduction, and voting solidarity in the daytime trials.',
    nightActionDescription: 'You remain locked in your home while the Mafia prowls the shadows.',
  },
};

/**
 * Calculates optimal mafia count based on player count:
 * 3-5 players: 1 Mafia
 * 6-8 players: 2 Mafia
 * 9-12 players: 3 Mafia
 * 13+ players: 4 Mafia
 */
export function getRecommendedMafiaCount(playerCount: number): number {
  if (playerCount <= 5) return 1;
  if (playerCount <= 8) return 2;
  if (playerCount <= 12) return 3;
  return 4;
}

/**
 * Distribute roles randomly according to player count and host settings
 */
export function assignRoles(
  playerIds: string[],
  settings: {
    mafiaCount?: number;
  }
): { [playerId: string]: GameRole } {
  const count = playerIds.length;
  const rolePool: GameRole[] = [];

  // Safe ceiling: Mafia can never be >= 50% of the lobby at start
  const maxSafeMafia = Math.max(1, Math.floor((count - 1) / 2));
  const desiredMafia = settings.mafiaCount || getRecommendedMafiaCount(count);
  const finalMafiaCount = Math.max(1, Math.min(desiredMafia, maxSafeMafia));

  // Add Mafia
  for (let i = 0; i < finalMafiaCount; i++) {
    rolePool.push('mafia');
  }

  // Remainder are all honest Villagers
  while (rolePool.length < count) {
    rolePool.push('villager');
  }

  // Shuffle role pool with Fisher-Yates
  const shuffledRoles = [...rolePool];
  for (let i = shuffledRoles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledRoles[i], shuffledRoles[j]] = [shuffledRoles[j], shuffledRoles[i]];
  }

  // Assign to players
  const assignments: { [playerId: string]: GameRole } = {};
  playerIds.forEach((id, index) => {
    assignments[id] = shuffledRoles[index] || 'villager';
  });

  return assignments;
}
