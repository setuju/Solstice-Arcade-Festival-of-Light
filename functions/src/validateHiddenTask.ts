import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Deploy command: firebase deploy --only functions
export const validateHiddenTask = functions.https.onCall(async (data, context) => {
  // Pastikan user terautentikasi
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  
  const { mode, proof } = data;
  const uid = context.auth.uid;
  
  // Validasi mode dan proof
  let isValid = false;
  let fragmentReward = 0;
  
  try {
      if (mode === 'spectrum' && typeof proof.rotorMoves === 'number' && proof.rotorMoves < 6) {
          isValid = true;
          fragmentReward = 2;
      } else if (mode === 'sumo' && typeof proof.ballsCollected === 'number' && proof.ballsCollected === 0) {
          isValid = true;
          fragmentReward = 3;
      } else if (mode === 'galveston' && typeof proof.beatPattern === 'string' && proof.beatPattern === '3-3-2-2') {
          isValid = true;
          fragmentReward = 2;
      } else if (mode === 'shadowchef' && typeof proof.perfectClear === 'boolean' && typeof proof.blindMode === 'boolean' && proof.perfectClear && proof.blindMode) {
          isValid = true;
          fragmentReward = 4;
      } else if (mode === 'longestsecond' && typeof proof.loopCountAtReport === 'number' && proof.loopCountAtReport === 1) {
          isValid = true;
          fragmentReward = 2;
      }
  } catch(e) {
      return { success: false, message: 'Invalid proof data schema' };
  }
  
  if (isValid) {
    // Update Firestore: tambah fragment dan tandai hidden task selesai
    const userRef = admin.firestore().collection('users').doc(uid);
    
    await admin.firestore().runTransaction(async (t) => {
        const doc = await t.get(userRef);
        if (!doc.exists) throw new functions.https.HttpsError('not-found', 'User doc missing');
        const data = doc.data() || {};
        const hiddenCompleted = data.hiddenTasksCompleted || {};
        
        if (hiddenCompleted[mode]) {
            throw new functions.https.HttpsError('already-exists', 'Hidden task already claimed');
        }
        
        hiddenCompleted[mode] = true;
        
        t.update(userRef, {
            totalFragments: admin.firestore.FieldValue.increment(fragmentReward),
            hiddenTasksCompleted: hiddenCompleted
        });
    });

    return { success: true, fragmentAdded: fragmentReward };
  } else {
    return { success: false, message: 'Hidden task not completed' };
  }
});
