import fs from 'fs';
import path from 'path';

// Define the keys to add for English and Indonesian
const newTranslations = {
  en: {
    // ResponsiveHub
    'hub.platform.spectrum': 'Spectrum',
    'hub.platform.galveston': 'Galveston',
    'hub.platform.sumo': 'Sumo',
    'hub.platform.shadowchef': 'Shadow Chef',
    'hub.platform.longestsecond': 'Longest Second',
    'hub.platform.locked': 'SECURE MORE FRAGMENTS',
    'hub.fragmentsInfo': '{count}/14 FRAGMENTS',
    'hub.greeting': 'Operative {displayName}',
    'hub.ready': 'SYSTEM READY',
    'turing.title': 'SYSTEM OVERRIDE',
    'turing.greeting': 'Greetings, Operative.',
    'turing.body': 'Before machines could think, I dreamed of them playing chess. Now, they run universes. The cipher you broke... it was never about the message. It was about proving that even in the darkest encryption, a human mind can find a pattern. Keep looking for patterns. The solstice light depends on it.',
    'turing.signoff': '- A.T.',

    // Tutorial
    'tutorial.welcome': 'Welcome to Solstice Arcade',
    'tutorial.description': 'A multi-dimensional mission designed to test human resilience during the longest and shortest days of the year. There are 5 dimensions, and each holds 2 Starlight Fragments. Furthermore, each dimension also hides a <span class="text-purple-400 font-bold animate-pulse">Hidden Task</span> which yields 2 additional fragments if solved.',
    'tutorial.objective': 'Your ultimate objective is to gather all 14 Starlight Fragments.',
    'tutorial.controls': 'Controls & Interaction',
    'tutorial.controls.desktop': 'Use your mouse for most puzzles. Some modes utilize Keyboard (Arrow keys & Space).',
    'tutorial.controls.touch': 'Touch controls are fully supported (Virtual Joysticks will automatically appear when needed).',
    'tutorial.secret': 'Top Secret',
    'tutorial.secret.hint': 'Sometimes, destroying something repeatedly is the key. Look to the beacon tower.',
    'tutorial.start': 'START MISSION',

    // UserProfile
    'profile.title': 'OPERATIVE PROFILE',
    'profile.totalFragments': 'TOTAL FRAGMENTS:',
    'profile.status': 'STATUS: ACTIVE',
    'profile.modes.spectrum': 'Spectrum',
    'profile.modes.sumo': 'Sumo',
    'profile.modes.galveston': 'Galveston',
    'profile.modes.shadowchef': 'ShadowChef',
    'profile.modes.longestsecond': 'Longest Sec',
    'profile.modes.hint.spectrum': 'Complete cipher in < 8 moves.',
    'profile.modes.hint.sumo': 'Survive > 45s without taking push damage.',
    'profile.modes.hint.galveston': 'Memorize patterns without making a single mistake.',
    'profile.modes.hint.shadowchef': 'Complete level 5 in blind mode.',
    'profile.modes.hint.longestsecond': 'Report anomaly directly on loop 1.',
    'profile.close': 'CLOSE',

    // Spectrum
    'spectrum.terminal': 'TERMINAL_ACCESS',
    'spectrum.moves': 'MOVES: {m} / {max}',
    'spectrum.decodeMessage': 'DECODE MESSAGE',
    'spectrum.decoding': 'DECODING...',
    'spectrum.win': 'ACCESS GRANTED',
    'spectrum.loose': 'SECURITY LOCKDOWN. RESETTING...',
    'spectrum.easterEgg': '>> TURING EXCEPTION TRIGGERED <<',
    'spectrum.easterBody': 'I proposed that a machine might learn from experience. You have learned the system. Well done, operative.',
    'spectrum.confirm': 'Are you sure?',
    'spectrum.reset': 'RESET',

    // Sumo
    'sumo.time': 'Time: {t}s',
    'sumo.start': 'START',
    'sumo.winMessage': 'SURVIVED: {t}s',
    'sumo.playAgain': 'AGAIN',
    'sumo.survived1': 'FIRST LIGHT!',
    'sumo.survived2': 'SHADOW DANCER!',
    'sumo.survived3': 'ECLIPSE MASTER!',
    'sumo.clickToContinue': 'Click to continue',

    // Galveston
    'galveston.title': 'ECHOES OF GALVESTON',
    'galveston.findFamily': 'FIND 4 FAMILY MEMBERS',
    'galveston.freedomFound': 'FREEDOM FOUND!',
    'galveston.copyBeat': 'COPY THE BEAT PATTERN!',
    'galveston.noTrace': 'NO TRACE',
    'galveston.listen': 'LISTEN...',
    'galveston.memoryConnected': 'MEMORY CONNECTED!',
    'galveston.patternMismatch': 'PATTERN MISMATCH. TIME -5s',
    'galveston.milestone2': 'ECHOES OF THE PAST!',
    'galveston.milestone4': 'FREEDOM FOUND!',
    'galveston.clickToContinue': 'Click to continue',
    'galveston.familyFound': 'Family Found',
    'galveston.timeUp': 'TIME IS UP',
    'galveston.tryAgain': 'Try Again',
    'galveston.tapArea': 'TAP AREA (or press SPACE)',

    // ShadowChef
    'shadowchef.title': 'SHADOW CHEF',
    'shadowchef.level': 'LEVEL',
    'shadowchef.memorize': 'MEMORIZE...',
    'shadowchef.yourTurn': 'YOUR TURN',
    'shadowchef.incorrect': 'INCORRECT! REPEATING LEVEL...',
    'shadowchef.masterChef': 'MASTER CHEF! SECURING FRAGMENTS...',
    'shadowchef.correct': 'CORRECT!',
    'shadowchef.milestone3': 'FLAVOR MASTER!',
    'shadowchef.milestone5': 'SHADOW LEGEND!',
    'shadowchef.clickToContinue': 'Click to continue',
    'shadowchef.levelsCompleted': 'Levels Completed',
    'shadowchef.mistakes': 'Mistakes',
    'shadowchef.start': 'Start Service',
    'shadowchef.ingRice': 'RICE',
    'shadowchef.ingFish': 'FISH',
    'shadowchef.ingSeaweed': 'SEAWEED',
    'shadowchef.blindModeOn': 'BLIND MODE: ON',
    'shadowchef.blindModeOff': 'BLIND MODE: OFF',
    'shadowchef.audioOn': 'Audio On',
    'shadowchef.audioOff': 'Enable Audio',

    // LongestSecond
    'longestsecond.findAnomaly': 'FIND THE TIME ANOMALY',
    'longestsecond.anomalyDialog': 'Today feels strange...',
    'longestsecond.normalDialog': 'Hello, good morning.',
    'longestsecond.approachFirst': 'Approach and click/E an NPC first.',
    'longestsecond.winMessage': 'Time revealed! Returning to Hub.',
    'longestsecond.timeLoops': 'Time keeps looping... Try again?',
    'longestsecond.wrong': 'WRONG!',
    'longestsecond.anomalyMoved': 'Loop starting. Anomaly moved.',
    'longestsecond.milestone5': 'TIME BENDER!',
    'longestsecond.milestone10': 'TEMPORAL ARCHITECT!',
    'longestsecond.clickToContinue': 'Click to continue',
    'longestsecond.loopsSurvived': 'Loops Survived',
    'longestsecond.attempts': 'Attempts',
    'longestsecond.instruction': 'Use WASD to move, click/E to interact',
    'longestsecond.loop': 'Loop',
    'longestsecond.targetStatus': 'Target Status',
    'longestsecond.npcSelected': 'NPC #{id} Selected',
    'longestsecond.noTarget': 'No target yet.',
    'longestsecond.reportAnomaly': 'REPORT ANOMALY',
    'longestsecond.retryTime': 'RETRY TIME',

    // AuthModal
    'auth.noFirebase': 'Firebase not configured. Use Demo Login.',
    'auth.invalidEmail': 'Invalid email.',
    'auth.passwordShort': 'Password must be at least 6 characters.',
    'auth.passwordMismatch': 'Password confirmation does not match.',
    'auth.nameRequired': 'Name is required.',
    'auth.userNotFound': 'User not found.',
    'auth.wrongPassword': 'Wrong password.',
    'auth.invalidCredential': 'Invalid credential.',
    'auth.emailInUse': 'Email already registered.',
    'auth.operationNotAllowed': 'Email/Password login not enabled on Firebase.',
    'auth.weakPassword': 'Weak password (min. 6 characters).',
    'auth.unknownError': 'An error occurred.',
    'auth.register': 'Register',
    'auth.login': 'Log In',
    'auth.access': 'Access Solstice Arcade',
    'auth.fullName': 'Full Name',
    'auth.email': 'Email',
    'auth.passwordPlaceholder': 'Password (min 6 char)',
    'auth.confirmPassword': 'Confirm Password',
    'auth.processing': 'Processing...',
    'auth.registerBtn': 'Register',
    'auth.loginBtn': 'Log in',
    'auth.haveAccount': 'Already have an account? Log in here',
    'auth.noAccount': 'No account? Register here',
    'auth.demoLogin': 'Demo Login',

    // AdminModal
    'admin.triggering': 'Triggering workflow...',
    'admin.success': 'Success! Leaderboard workflow dispatched.',
    'admin.failed': 'Failed to trigger workflow.',
    'admin.title': 'Admin Console',
    'admin.description': 'Force GitHub Actions to fetch Firestore scores and commit to leaderboard.json.',
    'admin.forceUpdate': 'Force Leaderboard Update',

    // Cinematic
    'cinematic.default': 'A new story begins...',
    'cinematic.clickContinue': 'Click to continue',
    'cinematic.clickSkip': 'Click to skip',
    'cinematic.spectrum': 'Alan Turing cracked the Enigma code, saving millions of lives. But the world was not ready for his true colors. On the longest ray this year, we reassemble the shattered spectrum.',
    'cinematic.galveston': 'June 19, 1865. The news of freedom finally arrived in Galveston, Texas. But for those separated from their families, a new journey begins. Listen to the ancestral rhythms. They are calling you home.',
    'cinematic.sumo': 'Since thousands of years ago, at the solstice, sumo wrestlers fight not for violence — but to balance light and shadow. Now it is your turn.',
    'cinematic.shadowchef': 'In the dark, other senses light up. The first blind chef in Tokyo created sushi that needs no eyes — only heart and ears. International Sushi Day is when we celebrate all flavors.',
    'cinematic.longestsecond': 'Within every longest second, lies an opportunity to change. Time is never linear — it loops, like an endless rainbow.',

    // VictoryAnimation
    'victory.epilogue1': 'We are all light on the longest day.',
    'victory.epilogue2': 'Both the seen and the hidden.',
    'victory.credits1': 'Created for June Solstice Game Jam 2026',
    'victory.credits2': 'Developer: Jack / Hard In Soft Out',
    'victory.playAgain': 'Play Again',
    'victory.backToHub': 'Back to Hub',

    // GameHeader
    'header.reset': 'Reset Progress',

    // Common fallback
    'common.confirm': 'Are you sure?',
  },
  id: {
    // ResponsiveHub
    'hub.platform.spectrum': 'Spectrum',
    'hub.platform.galveston': 'Galveston',
    'hub.platform.sumo': 'Sumo',
    'hub.platform.shadowchef': 'Shadow Chef',
    'hub.platform.longestsecond': 'Longest Second',
    'hub.platform.locked': 'AMANKAN LEBIH BANYAK FRAGMEN',
    'hub.fragmentsInfo': '{count}/14 FRAGMEN',
    'hub.greeting': 'Operatif {displayName}',
    'hub.ready': 'SISTEM SIAP',
    'turing.title': 'SISTEM OVERRIDE',
    'turing.greeting': 'Salam, Operatif.',
    'turing.body': 'Sebelum mesin bisa berpikir, saya bermimpi mereka bermain catur. Sekarang, mereka menjalankan alam semesta. Sandi yang kau pecahkan... bukan tentang pesannya. Ini tentang membuktikan bahwa bahkan dalam enkripsi tergelap, pikiran manusia dapat menemukan pola. Teruslah mencari pola. Cahaya solstice bergantung pada itu.',
    'turing.signoff': '- A.T.',

    // Tutorial
    'tutorial.welcome': 'Selamat Datang di Solstice Arcade',
    'tutorial.description': 'Sebuah misi multi-dimensi yang dirancang untuk menguji ketahanan manusia di hari-hari terpanjang dan terpendek dalam setahun. Terdapat 5 dimensi, masing-masing menyimpan 2 Starlight Fragments. Selain itu, setiap dimensi menyimpan <span class="text-purple-400 font-bold animate-pulse">Tugas Tersembunyi</span> yang memberi 2 fragmen ekstra jika diselesaikan.',
    'tutorial.objective': 'Tujuan akhir Anda adalah mengumpulkan semua 14 Starlight Fragments.',
    'tutorial.controls': 'Kontrol & Interaksi',
    'tutorial.controls.desktop': 'Gunakan mouse untuk sebagian besar puzzle. Beberapa mode memerlukan Keyboard (Arah & Spasi).',
    'tutorial.controls.touch': 'Kontrol sentuh didukung penuh (Virtual Joystick akan otomatis muncul).',
    'tutorial.secret': 'Sangat Rahasia',
    'tutorial.secret.hint': 'Terkadang, menghancurkan sesuatu berulang kali adalah kuncinya. Perhatikan menara pemancar.',
    'tutorial.start': 'MULAI MISI',

    // UserProfile
    'profile.title': 'PROFIL OPERATIF',
    'profile.totalFragments': 'TOTAL FRAGMEN:',
    'profile.status': 'STATUS: AKTIF',
    'profile.modes.spectrum': 'Spectrum',
    'profile.modes.sumo': 'Sumo',
    'profile.modes.galveston': 'Galveston',
    'profile.modes.shadowchef': 'ShadowChef',
    'profile.modes.longestsecond': 'Longest Sec',
    'profile.modes.hint.spectrum': 'Selesaikan sandi dalam < 8 langkah.',
    'profile.modes.hint.sumo': 'Bertahan > 45d tanpa terkena dorongan.',
    'profile.modes.hint.galveston': 'Hafalkan pola tanpa sekalipun salah.',
    'profile.modes.hint.shadowchef': 'Selesaikan level 5 dengan mata tertutup.',
    'profile.modes.hint.longestsecond': 'Laporkan anomali langsung di loop 1.',
    'profile.close': 'TUTUP',

    // Spectrum
    'spectrum.terminal': 'TERMINAL_AKSES',
    'spectrum.moves': 'LANGKAH: {m} / {max}',
    'spectrum.decodeMessage': 'DEKODE PESAN',
    'spectrum.decoding': 'MENDEKODE...',
    'spectrum.win': 'AKSES DIBERIKAN',
    'spectrum.loose': 'KEAMANAN TERKUNCI. MENGULANG...',
    'spectrum.easterEgg': '>> PENGECUALIAN TURING TERPICU <<',
    'spectrum.easterBody': 'Saya pernah mengusulkan bahwa mesin mungkin belajar dari pengalaman. Anda telah mempelajari sistem ini. Kerja bagus, operatif.',
    'spectrum.confirm': 'Apakah anda yakin?',
    'spectrum.reset': 'RESET',

    // Sumo
    'sumo.time': 'Waktu: {t}s',
    'sumo.start': 'MULAI',
    'sumo.winMessage': 'BERTAHAN: {t}s',
    'sumo.playAgain': 'LAGI',
    'sumo.survived1': 'CAHAYA PERTAMA!',
    'sumo.survived2': 'PENARI BAYANGAN!',
    'sumo.survived3': 'MASTER GERHANA!',
    'sumo.clickToContinue': 'Klik untuk lanjut',

    // Galveston
    'galveston.title': 'ECHOES OF GALVESTON',
    'galveston.findFamily': 'TEMUKAN 4 ANGGOTA KELUARGA',
    'galveston.freedomFound': 'KEBEBASAN DITEMUKAN!',
    'galveston.copyBeat': 'TIRU POLA KETUKAN!',
    'galveston.noTrace': 'TIDAK ADA JEJAK',
    'galveston.listen': 'DENGARKAN...',
    'galveston.memoryConnected': 'MEMORI TERSAMBUNG!',
    'galveston.patternMismatch': 'POLA TIDAK COCOK. WAKTU -5s',
    'galveston.milestone2': 'ECHOES OF THE PAST!',
    'galveston.milestone4': 'FREEDOM FOUND!',
    'galveston.clickToContinue': 'Klik untuk lanjut',
    'galveston.familyFound': 'Keluarga Ditemukan',
    'galveston.timeUp': 'WAKTU HABIS',
    'galveston.tryAgain': 'Coba Lagi',
    'galveston.tapArea': 'TAP AREA (atau spasi)',

    // ShadowChef
    'shadowchef.title': 'SHADOW CHEF',
    'shadowchef.level': 'LEVEL',
    'shadowchef.memorize': 'HAFAKAN...',
    'shadowchef.yourTurn': 'GILIRANMU',
    'shadowchef.incorrect': 'SALAH! MENGULANG LEVEL...',
    'shadowchef.masterChef': 'MASTER CHEF! MENGAMANKAN FRAGMEN...',
    'shadowchef.correct': 'BENAR!',
    'shadowchef.milestone3': 'FLAVOR MASTER!',
    'shadowchef.milestone5': 'SHADOW LEGEND!',
    'shadowchef.clickToContinue': 'Klik untuk lanjut',
    'shadowchef.levelsCompleted': 'Level Selesai',
    'shadowchef.mistakes': 'Kesalahan',
    'shadowchef.start': 'Mulai Servis',
    'shadowchef.ingRice': 'NASI',
    'shadowchef.ingFish': 'IKAN',
    'shadowchef.ingSeaweed': 'RUMPUT LAUT',
    'shadowchef.blindModeOn': 'MODE BUTA: ON',
    'shadowchef.blindModeOff': 'MODE BUTA: OFF',
    'shadowchef.audioOn': 'Audio Aktif',
    'shadowchef.audioOff': 'Aktifkan Audio',

    // LongestSecond
    'longestsecond.findAnomaly': 'TEMUKAN ANOMALI WAKTU',
    'longestsecond.anomalyDialog': 'Hari ini terasa aneh...',
    'longestsecond.normalDialog': 'Halo, selamat pagi.',
    'longestsecond.approachFirst': 'Dekati dan klik/E NPC terlebih dahulu.',
    'longestsecond.winMessage': 'Waktu terungkap! Kembali ke Hub.',
    'longestsecond.timeLoops': 'Waktu terus berulang... Coba lagi?',
    'longestsecond.wrong': 'SALAH!',
    'longestsecond.anomalyMoved': 'Loop dimulai. Anomali berpindah.',
    'longestsecond.milestone5': 'TIME BENDER!',
    'longestsecond.milestone10': 'TEMPORAL ARCHITECT!',
    'longestsecond.clickToContinue': 'Klik untuk lanjut',
    'longestsecond.loopsSurvived': 'Loop Dilalui',
    'longestsecond.attempts': 'Percobaan',
    'longestsecond.instruction': 'Gunakan WASD untuk gerak, E interaksi',
    'longestsecond.loop': 'Loop',
    'longestsecond.targetStatus': 'Status Target',
    'longestsecond.npcSelected': 'NPC #{id} Dipilih',
    'longestsecond.noTarget': 'Belum ada target.',
    'longestsecond.reportAnomaly': 'LAPORKAN ANOMALI',
    'longestsecond.retryTime': 'ULANGI WAKTU',

    // AuthModal
    'auth.noFirebase': 'Firebase tidak terkonfigurasi. Gunakan Demo Login.',
    'auth.invalidEmail': 'Email tidak valid.',
    'auth.passwordShort': 'Password minimal 6 karakter.',
    'auth.passwordMismatch': 'Konfirmasi password tidak cocok.',
    'auth.nameRequired': 'Nama harus diisi.',
    'auth.userNotFound': 'User tidak ditemukan.',
    'auth.wrongPassword': 'Password salah.',
    'auth.invalidCredential': 'Kredensial tidak valid.',
    'auth.emailInUse': 'Email sudah terdaftar.',
    'auth.operationNotAllowed': 'Login Email/Password belum diaktifkan.',
    'auth.weakPassword': 'Password terlalu lemah.',
    'auth.unknownError': 'Terjadi kesalahan.',
    'auth.register': 'Registrasi',
    'auth.login': 'Login',
    'auth.access': 'Akses Solstice Arcade',
    'auth.fullName': 'Nama Lengkap',
    'auth.email': 'Email',
    'auth.passwordPlaceholder': 'Password (min. 6 kar)',
    'auth.confirmPassword': 'Konfirmasi Password',
    'auth.processing': 'Memproses...',
    'auth.registerBtn': 'Daftar',
    'auth.loginBtn': 'Masuk',
    'auth.haveAccount': 'Sudah punya akun? Login di sini',
    'auth.noAccount': 'Belum punya akun? Daftar di sini',
    'auth.demoLogin': 'Demo Login',

    // AdminModal
    'admin.triggering': 'Memicu workflow...',
    'admin.success': 'Berhasil! Workflow leaderboard dipicu.',
    'admin.failed': 'Gagal memicu workflow.',
    'admin.title': 'Konsol Admin',
    'admin.description': 'Paksa GitHub Actions untuk mengambil skor Firestore dan me-write ke leaderboard.json.',
    'admin.forceUpdate': 'Force Peringkat Update',

    // Cinematic
    'cinematic.default': 'Sebuah cerita baru dimulai...',
    'cinematic.clickContinue': 'Klik untuk melanjutkan',
    'cinematic.clickSkip': 'Klik untuk skip',
    'cinematic.spectrum': 'Alan Turing memecahkan kode Enigma, menyelamatkan jutaan nyawa. Tapi dunia belum siap menerima warna aslinya. Di sinar terpanjang tahun ini, kita merakit kembali spektrum yang sempat pecah.',
    'cinematic.galveston': '19 Juni 1865. Kabar kebebasan akhirnya tiba di Galveston, Texas. Tapi bagi mereka yang terpisah dari keluarga, perjalanan baru dimulai. Dengarkan irama leluhur. Mereka memanggilmu pulang.',
    'cinematic.sumo': 'Sejak ribuan tahun lalu, di titik balik matahari, para pegulat sumo bertarung bukan untuk kekerasan — tapi untuk menyeimbangkan cahaya dan bayangan. Sekarang giliranmu.',
    'cinematic.shadowchef': 'Dalam gelap, indra lain menjadi terang. Koki tuna netra pertama di Tokyo menciptakan sushi yang tak butuh mata — hanya hati dan telinga. Hari Sushi Internasional adalah saat kita merayakan semua rasa.',
    'cinematic.longestsecond': 'Dalam setiap detik terpanjang, tersimpan kesempatan untuk berubah. Waktu tidak pernah linear — ia melingkar, seperti pelangi yang tak berujung.',

    // VictoryAnimation
    'victory.epilogue1': 'Kita semua adalah cahaya di hari terpanjang.',
    'victory.epilogue2': 'Baik yang terlihat maupun yang tersembunyi.',
    'victory.credits1': 'Diciptakan untuk June Solstice Game Jam 2026',
    'victory.credits2': 'Developer: Jack / Hard In Soft Out',
    'victory.playAgain': 'Main Lagi',
    'victory.backToHub': 'Kembali ke Hub',

    // GameHeader
    'header.reset': 'Reset Progress',

    // ResponsiveLeaderboard
    'leaderboard.topOperatives': 'Top Operatives',
    'leaderboard.unavailable': 'Leaderboard sementara tidak tersedia. Periksa koneksimu.',
    'leaderboard.noData': 'Belum ada data.',
    'leaderboard.lastUpdate': 'Pembaruan terakhir',
    'leaderboard.syncing': 'SINKRONISASI...',
    'leaderboard.refresh': 'SEGARKAN',

    // Common
    'common.confirm': 'Apakah anda yakin?',
  }
};

const transFileStr = fs.readFileSync(path.resolve(process.cwd(), 'src/i18n/translations.ts'), 'utf-8');

const regex = /export const translations: Record<string, Record<string, string>> = (\{[\s\S]*?\});/;

const match = transFileStr.match(regex);
if (match) {
  let trans = eval("(" + match[1] + ")");
  Object.keys(newTranslations.en).forEach(k => trans.en[k] = newTranslations.en[k]);
  Object.keys(newTranslations.id).forEach(k => trans.id[k] = newTranslations.id[k]);

  // also add english to leaderboard
  trans.en['leaderboard.topOperatives'] = 'Top Operatives';
  trans.en['leaderboard.unavailable'] = 'Leaderboard temporarily unavailable. Check your connection.';
  trans.en['leaderboard.noData'] = 'No data yet.';
  trans.en['leaderboard.lastUpdate'] = 'Last update';
  trans.en['leaderboard.syncing'] = 'SYNCING...';
  trans.en['leaderboard.refresh'] = 'REFRESH';

  const newFileStr = "export const translations: Record<string, Record<string, string>> = " + JSON.stringify(trans, null, 2) + ";\n";
  fs.writeFileSync(path.resolve(process.cwd(), 'src/i18n/translations.ts'), newFileStr);
  console.log('Successfully updated translations.ts with the new keys.');
} else {
  console.error('Failed to parse translations.ts');
}
