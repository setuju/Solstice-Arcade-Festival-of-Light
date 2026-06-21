export const hiddenTasks = {
  spectrum: { condition: (rotorMoves: number) => rotorMoves < 6, fragmentReward: 2 },
  sumo: { condition: (ballsCollected: number) => ballsCollected === 0, fragmentReward: 3 },
  galveston: { condition: (beatPattern: string) => beatPattern === '3-3-2-2', fragmentReward: 2 },
  shadowchef: { condition: (perfectClear: boolean, blindMode: boolean) => perfectClear && blindMode, fragmentReward: 4 },
  longestsecond: { condition: (loopCountAtReport: number) => loopCountAtReport === 1, fragmentReward: 2 }
};

export function verifyHiddenTask(modeId: string, proof: any): boolean {
  try {
    switch (modeId) {
      case 'spectrum':
        if (typeof proof.rotorMoves === 'number') {
          return hiddenTasks.spectrum.condition(proof.rotorMoves);
        }
        break;
      case 'sumo':
        if (typeof proof.ballsCollected === 'number') {
          return hiddenTasks.sumo.condition(proof.ballsCollected);
        }
        break;
      case 'galveston':
        if (typeof proof.beatPattern === 'string') {
          return hiddenTasks.galveston.condition(proof.beatPattern);
        }
        break;
      case 'shadowchef':
        if (typeof proof.perfectClear === 'boolean' && typeof proof.blindMode === 'boolean') {
          return hiddenTasks.shadowchef.condition(proof.perfectClear, proof.blindMode);
        }
        break;
      case 'longestsecond':
        if (typeof proof.loopCountAtReport === 'number') {
          return hiddenTasks.longestsecond.condition(proof.loopCountAtReport);
        }
        break;
    }
  } catch (error) {
    console.error("Hidden task eval error:", error);
  }
  return false;
}
