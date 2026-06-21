export function executeBrainfuck(code: string, input: string = ''): string {
  const MEMORY_SIZE = 30000;
  const memory = new Uint8Array(MEMORY_SIZE);
  let ptr = 0;
  let codePtr = 0;
  let inputPtr = 0;
  let output = '';
  
  let loopCount = 0;
  const MAX_LOOPS = 500000;

  // Precompute jumps for fast execution and [ ] pairing
  const jumpMap = new Map<number, number>();
  const stack: number[] = [];
  
  for (let i = 0; i < code.length; i++) {
    if (code[i] === '[') {
      stack.push(i);
    } else if (code[i] === ']') {
      if (stack.length === 0) throw new Error("Brainfuck Error: Unmatched ']' at " + i);
      const start = stack.pop()!;
      jumpMap.set(start, i);
      jumpMap.set(i, start);
    }
  }
  if (stack.length > 0) {
     throw new Error("Brainfuck Error: Unmatched '[' at " + stack[0]);
  }

  while (codePtr < code.length && loopCount < MAX_LOOPS) {
    loopCount++;
    const instruction = code[codePtr];
    
    switch (instruction) {
      case '>':
        ptr = (ptr + 1) % MEMORY_SIZE;
        break;
      case '<':
        ptr = (ptr - 1 + MEMORY_SIZE) % MEMORY_SIZE;
        break;
      case '+':
        memory[ptr]++;
        break;
      case '-':
        memory[ptr]--;
        break;
      case '.':
        output += String.fromCharCode(memory[ptr]);
        break;
      case ',':
        if (inputPtr < input.length) {
          memory[ptr] = input.charCodeAt(inputPtr++);
        } else {
          memory[ptr] = 0; // EOF behavior
        }
        break;
      case '[':
        if (memory[ptr] === 0) {
          codePtr = jumpMap.get(codePtr)!;
        }
        break;
      case ']':
        if (memory[ptr] !== 0) {
          codePtr = jumpMap.get(codePtr)!;
        }
        break;
      default:
        // Ignore non-brainfuck characters (comments)
        break;
    }
    codePtr++;
  }
  
  if (loopCount >= MAX_LOOPS) {
    console.warn("Brainfuck execution halted: max loops reached");
  }
  
  return output;
}
