const ROTORS = {
  I: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', // Rotor I wiring
  II: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', // Rotor II wiring
  III: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', // Rotor III wiring
};

const REFLECTOR_B = 'YRUHQSLDPXNGOKMIEBFZCWVJAT';
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function createEnigma(rotorPositions: [number, number, number]) {
  // Simple internal state array for rotors I, II, III
  const positions = [...rotorPositions];

  // Helper to get letter index
  const charToIndex = (c: string) => c.charCodeAt(0) - 65;
  const indexToChar = (i: number) => String.fromCharCode((i % 26 + 26) % 26 + 65);

  const passThroughRotor = (cIndex: number, wiring: string, offset: number, forward: boolean) => {
    let shiftedIn = (cIndex + offset) % 26;
    let mapped = 0;
    
    if (forward) {
      mapped = charToIndex(wiring[shiftedIn]);
    } else {
      mapped = wiring.indexOf(indexToChar(shiftedIn));
    }
    
    return (mapped - offset + 26) % 26;
  };

  const stepRotors = () => {
    // Simple stepping (no complex notch logic for game puzzle)
    positions[2] = (positions[2] + 1) % 26;
    if (positions[2] === 0) {
      positions[1] = (positions[1] + 1) % 26;
      if (positions[1] === 0) {
        positions[0] = (positions[0] + 1) % 26;
      }
    }
  };

  const encryptLetter = (c: string): string => {
    c = c.toUpperCase();
    if (!/[A-Z]/.test(c)) return c;

    stepRotors();
    let cIndex = charToIndex(c);

    // Forward pass: Rotor III -> II -> I
    cIndex = passThroughRotor(cIndex, ROTORS.III, positions[2], true);
    cIndex = passThroughRotor(cIndex, ROTORS.II, positions[1], true);
    cIndex = passThroughRotor(cIndex, ROTORS.I, positions[0], true);

    // Reflector
    cIndex = charToIndex(REFLECTOR_B[cIndex]);

    // Backward pass: Rotor I -> II -> III
    cIndex = passThroughRotor(cIndex, ROTORS.I, positions[0], false);
    cIndex = passThroughRotor(cIndex, ROTORS.II, positions[1], false);
    cIndex = passThroughRotor(cIndex, ROTORS.III, positions[2], false);

    return indexToChar(cIndex);
  };

  const encryptMessage = (text: string): string => {
    return text.split('').map(encryptLetter).join('');
  };

  return {
    encryptLetter,
    encryptMessage,
    getPositions: () => [...positions]
  };
}
