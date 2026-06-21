# Solstice Arcade: Festival of Light – Submission for June Solstice Game Jam 2026

**Play the game:** [Deploy URL here]  
**Source code:** [GitHub Repo URL here]

## 🎮 Game Description
"Solstice Arcade: Festival of Light" is an interactive web experience celebrating humanity's diversity under the light of the longest day. Serving as an anthology of 5 mini-games, users solve puzzles and complete challenges honoring distinct cultural, historical, and mathematical milestones around the solstice, including Juneteenth, international sushi day, the World Cup, and Alan Turing's monumental contributions.

## ✨ Key Features
- 5 unique mini-games (Spectrum, Galveston, Sumo, ShadowChef, LongestSecond).
- Cinematic historical intros preceding each game mode.
- Hidden tasks & Starlight Fragments designed to reward exploratory interactions.
- Easter egg "The Shadow of Turing" (Enigma skin and TTS monologue).
- Leaderboard (updated via GitHub Actions + Firestore).
- 4-layer security architecture (Brainfuck parser, Enigma simulator, server validation, client countermeasures).

## 🔐 Security & Anti-Cheat
We implemented a robust 4-layer security mechanism designed out of respect for Alan Turing's cryptographic legacy:
1. **Brainfuck Obfuscation Engine**: Encodes payloads on the fly using a pure TypeScript interpreter.
2. **Enigma M3 Simulator**: Encrypts offline progression flags through classic multi-rotor permutations.
3. **Server Validation**: Cloud functions ensure hidden task proofs are completely deterministic and immutable.
4. **Client Countermeasures**: Blocks developer tools shortcuts, detects headless browser bots, and dynamically evades simplistic state rewrites.

## 🤖 Google AI Usage (Gemini API)
- **Dialog Curator**: Used to process user feedback and contextualize narrative events in the hub.
- Designed with high-performance guardrails using the prompt API for creative dialogue generation in-engine.

## 🏆 Best Ode to Alan Turing
- **Enigma cipher**: Recreated accurate wiring sets for an Enigma M3 model, serving as a core puzzle component in the "Spectrum" mode.
- **Brainfuck interpreter**: A nod to computational architecture and esolangs, directly verifying Turing completeness.
- **Easter egg "The Shadow of Turing"**: Clicking the hub menhir 7 times securely unlocks an immersive "Enigma" UI skin and triggers a poignant spoken monologue.

## 🛠️ Tech Stack
- React 18 + TypeScript
- Vite + Tailwind CSS
- Firebase (Auth, Firestore, Cloud Functions)
- Web Audio API (beat detection, sound synthesis in Galveston mode)
- Canvas API (rendering the Hub, Sumo, LongestSecond)
- GitHub Actions (leaderboard sync via automated chron-jobs)

## 🧪 Testing & Quality
- **Unit Testing**: Developed Vitest suites targeting the Brainfuck interpreter, Enigma engine, and validation logics to rigorously guarantee operational security.
- **Component Testing**: Setup skeleton test architectures using React Testing Library.
- **E2E Testing**: Established Playwright workflows mocking interactions from authentication to hub traversal.

## 📸 Screenshots / Video Demo
[Insert YouTube or GIF link here]

## 👨💻 Credits
Developer: Jack / Hard In Soft Out - [dev.to/ggle_in](https://dev.to/ggle_in)
