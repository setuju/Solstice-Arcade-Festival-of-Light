import { executeBrainfuck } from '../utils/brainfuck';
import { createEnigma } from '../utils/enigma';
import { verifyHiddenTask } from '../utils/hiddenTasks';

describe('Utility Functions', () => {

  describe('Brainfuck Interpreter', () => {
    it('should output Hello World', () => {
      const code = '++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.';
      const output = executeBrainfuck(code);
      expect(output).toBe('Hello World!');
    });

    it('should handle addition', () => {
      const code = '++>+++[<+>-]<.'; // 2 + 3 = 5 -> ascii 5
      const output = executeBrainfuck(code);
      expect(output.charCodeAt(0)).toBe(5);
    });
  });

  describe('Enigma Simulator', () => {
    it('should encrypt and decrypt correctly with same settings', () => {
      const enigmaEncrypt = createEnigma([0, 0, 0]);
      const enigmaDecrypt = createEnigma([0, 0, 0]);
      
      const plaintext = "HELLOTURING";
      const ciphertext = enigmaEncrypt.encryptMessage(plaintext);
      
      const decrypted = enigmaDecrypt.encryptMessage(ciphertext);
      expect(decrypted).toBe(plaintext);
      expect(ciphertext).not.toBe(plaintext);
    });
  });

  describe('Hidden Tasks Validation', () => {
    it('should validate spectrum task correctly', () => {
      expect(verifyHiddenTask('spectrum', { rotorMoves: 2 })).toBe(true);
      expect(verifyHiddenTask('spectrum', { rotorMoves: 10 })).toBe(false);
    });

    it('should handle invalid proofs gracefully', () => {
      expect(verifyHiddenTask('spectrum', { wrongKey: 5 })).toBe(false);
      expect(verifyHiddenTask('invalidMode', { rotorMoves: 2 })).toBe(false);
    });
  });

});
