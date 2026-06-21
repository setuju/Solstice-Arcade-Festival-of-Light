# Solstice Arcade: Festival of Light

![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue) ![Firebase](https://img.shields.io/badge/Firebase-12-orange) ![Vite](https://img.shields.io/badge/Vite-6-purple) ![License](https://img.shields.io/badge/License-MIT-green)

A highly polished, multi-genre retro web game built for the **June Solstice Game Jam 2026**. Experience interactive themes combining Solstice, Pride Month, Juneteenth, Alan Turing's cipher heritage, World Cup football soccer, and international Sushi Day. 

Collect all **14 Starlight Fragments**, solve hidden ciphers, and challenge other operands in the global leaderboard!

---

## 🎮 Game Modes

### 1. Spectrum Architect (Solstice + Pride + Turing)
Unravel ciphers using an interactive enigma-like rotor device. Experience high-fidelity color spectrum mappings where cryptography meets chromatic light calibration.
- **Goal:** Uncover 30 distinct color-clue riddles.

### 2. Solstice Sumo (Pride + World Cup)
A hyper-fast physics canvas battle in a vibrant circle. Push your opponent out of bounds or secure celestial light balls.
- **Goal:** Outmaneuver opponents, maintain circular leverage, and trigger high-speed dashes.

### 3. Echoes of Galveston (Juneteenth + Rhythm)
An interactive synchronized Web Audio beat-tapping rhythm game commemorating emancipation. High-density audio cues aligned with precise millisecond intervals.
- **Goal:** Lock onto matching soundwaves, free the constellation families, and maintain dynamic score multipliers.

### 4. Shadow Chef (Sushi Day + Audio Memory)
An additive memory sequence game where you synthesize audio recipes by hearing cooking sounds. Follow sound clues under perfect clear constraints.
- **Goal:** Correctly reproduce complex recipe sequences without errors to claim perfect clears.

### 5. The Longest Second (Summer Solstice + Time Loop)
A text-driven dialogue-based chronological loop simulation. Talk to NPCs, identify anomalies, and decode secret transmissions.
- **Goal:** Resolve temporal disruptions, isolate anomalies, and break the loop before midnight.

---

## ✨ Features
* **Global Real-Time Leaderboard:** Integrated directly with cloud-native storage counters.
* **Dual Persistence:** Smooth transition between modular Cloud Firestore and localized browser store fallbacks.
* **Multi-Language Adaptor:** Comprehensive localize configurations accommodating 10 languages seamlessly.
* **Alan Turing Cryptographic Tribute:** Triggerable hidden overlay by clicking the central lighthouse 7 times and typing `"TURING"`.
* **Adaptive Orientation Guards:** Full vertical/horizontal responsiveness and dynamic visual warnings.
* **Integrated Security:** Production-grade anti-tamper safeguards, active debugger inhibitors, and asset isolation.

---

## 🛠️ Technology Stack
* **Client Library:** React 18 with TypeScript
* **State Management:** React Context API (`GameContext`) 
* **Database Provider:** Google Cloud Firebase / Firestore 9+
* **Styling Utility:** Tailwind CSS
* **Animations:** Framer Motion (`motion/react`)
* **Sound Engine:** Native Web Audio API Synthesizers

---

## 📂 Project Structure
```text
├── src/
│   ├── components/           # UI views, HUD overlays, active game mode components
│   │   ├── LandingPage.tsx   # Elegant welcome screen & language selection
│   │   ├── ResponsiveHub.tsx # The interactive celestial observatory platform
│   │   ├── Spectrum.tsx      # Turing cryptography color decrypter
│   │   ├── Sumo.tsx          # Dual-player physics boundary game
│   │   ├── Galveston.tsx     # Emancipation-themed rhythm game
│   │   ├── ShadowChef.tsx    # Memory audio recipe game
│   │   ├── LongestSecond.tsx # Chronological anomaly dialogue mystery
│   │   └── ...
│   ├── context/              # Centralized global GameContext with user states
│   ├── i18n/                 # Translation maps for 10 international languages
│   ├── utils/                # Security rules, anti-tamper modules, & ciphers
│   ├── firebase.ts          # Firebase SDK client initialization
│   ├── App.tsx               # Primary single-site view router
│   └── main.tsx              # React mounting entry point
```

---

## 🚀 Local Installation & Run

### Prerequisites
* Node.js (v18 or higher)
* npm (v9 or higher)

### Step-by-Step
1. **Clone & Navigate:**
   ```bash
   git clone https://github.com/your-username/solstice-arcade.git
   cd solstice-arcade
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file in the root directory based on the `.env.example` mapping:
   ```env
   VITE_FIREBASE_API_KEY=YOUR_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID=YOUR_APP_ID
   ```

4. **Boot Development Environment:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## ☁️ Deployment
This project is configured out-of-the-box for production deployment on platforms like Vercel or Cloud Run:
* Assets are optimized via Vite's static delivery pipelines.
* Detailed instructions are located in the `DEPLOYMENT.md` file.

---

## 📜 License
This project is distributed under the **MIT License**. Check the LICENSE file for more info.

---

## 🏆 Credits
Created by **Hard In Soft Out (Jack)** for the June Solstice Celebration Jam.
Special tribute to Alan Turing and the innovators of retro arcade frameworks worldwide.
