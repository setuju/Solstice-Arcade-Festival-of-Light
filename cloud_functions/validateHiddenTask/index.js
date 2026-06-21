const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.validateHiddenTask = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.status(204).send('');
        return;
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;

        const { modeId, proofData } = req.body;
        
        let valid = false;
        let bonus = 0;

        if (modeId === 'spectrum_perfect' && proofData.rotorMoves < 6) { valid = true; bonus = 2; }
        if (modeId === 'sumo_no_ball' && proofData.ballsCollected === 0) { valid = true; bonus = 3; }
        if (modeId === 'galveston_wade' && proofData.beatPattern === "3-3-2-2") { valid = true; bonus = 2; }
        if (modeId === 'shadowchef_blind' && proofData.isBlind === true && proofData.mistakes === 0) { valid = true; bonus = 4; }
        if (modeId === 'longestsecond_firstloop' && proofData.loopCount <= 1) { valid = true; bonus = 2; }

        if (!valid) {
            return res.status(400).json({ error: 'Invalid proof or criteria not met.' });
        }

        const db = admin.firestore();
        const userRef = db.collection('users').doc(userId);
        
        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            if (!doc.exists) throw new Error("User not found");
            
            const data = doc.data();
            const hiddenTasks = data.hiddenTasksCompleted || {};
            
            if (hiddenTasks[modeId]) {
                throw new Error("Task already claimed");
            }

            hiddenTasks[modeId] = true;
            let totalHidden = Object.keys(hiddenTasks).length;
            let addFragments = bonus;
            
            if (totalHidden === 5) addFragments += 1;

            t.update(userRef, {
                hiddenTasksCompleted: hiddenTasks,
                totalFragments: admin.firestore.FieldValue.increment(addFragments)
            });
        });

        res.json({ success: true, fragmentAdded: bonus });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
