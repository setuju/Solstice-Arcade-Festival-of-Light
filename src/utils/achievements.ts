export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
  SUMO_MASTER: { id: 'sumo_master', title: 'Sumo Master', description: 'Win 10 rounds of Sumo', icon: '🏆' },
  GALVESTON_EXPLORER: { id: 'galveston_explorer', title: 'Galveston Explorer', description: 'Find all family members', icon: '🔎' },
  SHADOW_MASTER: { id: 'shadow_master', title: 'Shadow Master', description: 'Clear 5 levels of Shadow Chef', icon: '🔪' },
  TEMPORAL_ARCHITECT: { id: 'temporal_architect', title: 'Temporal Architect', description: 'Survive in Longest Second', icon: '⌛' }
};

export const checkAchievements = (gameData: any, alreadyUnlocked: string[]): Achievement | null => {
  if (!gameData) return null;

  // Sumo Master: roundsP1 + roundsP2 >= 10 (needs to be tracked in gameData?)
  // Assume gameData tracks total rounds... for now use a placeholder logic
  
  if (!alreadyUnlocked.includes(ACHIEVEMENTS.GALVESTON_EXPLORER.id) && gameData.galvestonFamilyFound >= 4) {
      return ACHIEVEMENTS.GALVESTON_EXPLORER;
  }
  
  if (!alreadyUnlocked.includes(ACHIEVEMENTS.SHADOW_MASTER.id) && gameData.shadowChefLevelCompleted >= 5) {
      return ACHIEVEMENTS.SHADOW_MASTER;
  }
  
  if (!alreadyUnlocked.includes(ACHIEVEMENTS.TEMPORAL_ARCHITECT.id) && gameData.longestAnomalyFound) {
      return ACHIEVEMENTS.TEMPORAL_ARCHITECT;
  }

  return null;
};
