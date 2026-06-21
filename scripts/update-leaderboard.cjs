const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

async function main() {
  try {
    const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountRaw) {
      console.log("No FIREBASE_SERVICE_ACCOUNT provided, skipping update for local dev.");
      return;
    }
    
    const serviceAccount = JSON.parse(serviceAccountRaw);

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    const db = admin.firestore();
    const usersRef = db.collection("users");
    
    // Get top 100 users by fragments
    const snapshot = await usersRef
      .orderBy("totalFragments", "desc")
      .limit(100)
      .get();

    const scores = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.totalFragments > 0) {
        scores.push({
          username: data.username || "Anonymous",
          totalFragments: data.totalFragments,
          completedModesCount: Object.keys(data.completedModes || {}).filter(k => data.completedModes[k]).length
        });
      }
    });

    const outputData = {
      lastUpdated: new Date().toISOString(),
      scores: scores
    };

    const targetDir = path.join(__dirname, "..", "data");
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetPath = path.join(targetDir, "leaderboard.json");
    fs.writeFileSync(targetPath, JSON.stringify(outputData, null, 2));

    console.log("Leaderboard successfully updated.");
  } catch (error) {
    console.error("Error updating leaderboard:", error);
    process.exit(1);
  }
}

main();
