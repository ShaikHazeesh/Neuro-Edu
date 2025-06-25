import { Router } from 'express';
import { db } from './db';
import { z } from 'zod';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';

const execAsync = promisify(exec);

const router = Router();

// Schema for code execution request
const codeExecutionSchema = z.object({
  code: z.string(),
  language: z.string(),
  input: z.string().optional(),
});

// Schema for code testing request
const codeTestingSchema = z.object({
  code: z.string(),
  language: z.string(),
});

// Schema for code saving request
const codeSavingSchema = z.object({
  code: z.string(),
});

// Mock challenges data (replace with database in production)
const challenges = [
  {
    id: '1',
    title: 'Sum of Two Numbers',
    description: 'Write a function to add two numbers',
    instructions: `
      <p>Write a function called <code>sum</code> that takes two parameters <code>a</code> and <code>b</code> and returns their sum.</p>
      <h3>Example:</h3>
      <pre>
      Input: a = 5, b = 3
      Output: 8
      </pre>
    `,
    defaultCode: 'function sum(a, b) {\n  // Write your code here\n}\n\nexport default sum;',
    language: 'javascript',
    difficulty: 'easy',
    estimatedTime: '5 min',
    completed: false,
    testCases: [
      {
        id: '1-1',
        input: 'a = 5, b = 3',
        expectedOutput: '8',
        description: 'Basic addition with positive numbers',
      },
      {
        id: '1-2',
        input: 'a = -1, b = 1',
        expectedOutput: '0',
        description: 'Addition with negative and positive numbers',
      },
      {
        id: '1-3',
        input: 'a = 0, b = 0',
        expectedOutput: '0',
        description: 'Addition with zeros',
      },
    ],
    hints: [
      'Use the + operator to add the two numbers',
      'Make sure to return the result of the addition',
    ],
  },
  {
    id: '2',
    title: 'Reverse a String',
    description: 'Write a function to reverse a string',
    instructions: `
      <p>Write a function called <code>reverseString</code> that takes a string parameter <code>str</code> and returns the string reversed.</p>
      <h3>Example:</h3>
      <pre>
      Input: str = "hello"
      Output: "olleh"
      </pre>
    `,
    defaultCode: 'function reverseString(str) {\n  // Write your code here\n}\n\nexport default reverseString;',
    language: 'javascript',
    difficulty: 'easy',
    estimatedTime: '10 min',
    completed: false,
    testCases: [
      {
        id: '2-1',
        input: 'str = "hello"',
        expectedOutput: '"olleh"',
        description: 'Basic string reversal',
      },
      {
        id: '2-2',
        input: 'str = ""',
        expectedOutput: '""',
        description: 'Empty string',
      },
      {
        id: '2-3',
        input: 'str = "a"',
        expectedOutput: '"a"',
        description: 'Single character',
      },
    ],
    hints: [
      'You can convert the string to an array using split("")',
      'Use the reverse() method on arrays',
      'Convert the array back to a string using join("")',
    ],
  },
  {
    id: '3',
    title: 'FizzBuzz',
    description: 'Implement the classic FizzBuzz problem',
    instructions: `
      <p>Write a function called <code>fizzBuzz</code> that takes a number <code>n</code> and returns an array of strings from 1 to n where:</p>
      <ul>
        <li>For multiples of 3, use "Fizz" instead of the number</li>
        <li>For multiples of 5, use "Buzz" instead of the number</li>
        <li>For multiples of both 3 and 5, use "FizzBuzz" instead of the number</li>
        <li>For all other numbers, use the number itself as a string</li>
      </ul>
      <h3>Example:</h3>
      <pre>
      Input: n = 5
      Output: ["1", "2", "Fizz", "4", "Buzz"]
      </pre>
    `,
    defaultCode: 'function fizzBuzz(n) {\n  // Write your code here\n}\n\nexport default fizzBuzz;',
    language: 'javascript',
    difficulty: 'medium',
    estimatedTime: '15 min',
    completed: false,
    testCases: [
      {
        id: '3-1',
        input: 'n = 5',
        expectedOutput: '["1", "2", "Fizz", "4", "Buzz"]',
        description: 'Basic FizzBuzz up to 5',
      },
      {
        id: '3-2',
        input: 'n = 15',
        expectedOutput: '["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"]',
        description: 'FizzBuzz up to 15 (includes FizzBuzz)',
      },
      {
        id: '3-3',
        input: 'n = 1',
        expectedOutput: '["1"]',
        description: 'FizzBuzz with n = 1',
      },
    ],
    hints: [
      'Use a loop to iterate from 1 to n',
      'Use the modulo operator (%) to check if a number is divisible by 3 or 5',
      'Check for multiples of both 3 and 5 first, then check for multiples of 3, then multiples of 5',
    ],
  },
];

// Get all challenges
router.get('/challenges', (req, res) => {
  // In a real implementation, fetch from database
  const userId = req.session.userId;

  // Return challenges with minimal information
  const challengesList = challenges.map(challenge => ({
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    difficulty: challenge.difficulty,
    language: challenge.language,
    estimatedTime: challenge.estimatedTime,
    completed: challenge.completed,
  }));

  res.json(challengesList);
});

// Get a specific challenge
router.get('/challenges/:id', (req, res) => {
  const { id } = req.params;
  const challenge = challenges.find(c => c.id === id);

  if (!challenge) {
    return res.status(404).json({ error: 'Challenge not found' });
  }

  res.json(challenge);
});

// Execute code
router.post('/run', async (req, res) => {
  try {
    const { code, language, input } = codeExecutionSchema.parse(req.body);

    // Create a temporary directory for code execution
    const tempDir = path.join(process.cwd(), 'temp', uuidv4());
    await fs.mkdir(tempDir, { recursive: true });

    let filePath, command, output;

    switch (language) {
      case 'javascript':
        filePath = path.join(tempDir, 'code.js');
        // Convert CommonJS module.exports to ES module export default if needed
        const esModuleCode = code.replace(/module\.exports\s*=\s*(\w+);?/g, 'export default $1;');
        await fs.writeFile(filePath, esModuleCode);

        try {
          // Use --input-type=module flag to ensure Node treats the file as an ES module
          const { stdout, stderr } = await execAsync(`node --input-type=module ${filePath}`, {
            timeout: 5000, // 5 second timeout
          });

          output = stdout || stderr;
        } catch (error) {
          output = error.message;
        }
        break;

      case 'python':
        filePath = path.join(tempDir, 'code.py');
        await fs.writeFile(filePath, code);

        try {
          const { stdout, stderr } = await execAsync(`python ${filePath}`, {
            timeout: 5000, // 5 second timeout
          });

          output = stdout || stderr;
        } catch (error) {
          output = error.message;
        }
        break;

      default:
        return res.status(400).json({ error: 'Unsupported language' });
    }

    // Clean up temporary files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }

    res.json({ output });
  } catch (error) {
    console.error('Error executing code:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }

    res.status(500).json({ error: 'Failed to execute code' });
  }
});

// Test code against test cases
router.post('/test/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, language } = codeTestingSchema.parse(req.body);

    const challenge = challenges.find(c => c.id === id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Create a temporary directory for code execution
    const tempDir = path.join(process.cwd(), 'temp', uuidv4());
    await fs.mkdir(tempDir, { recursive: true });

    let filePath, testFilePath;
    const results = [];

    switch (language) {
      case 'javascript':
        filePath = path.join(tempDir, 'solution.js'); // Keep .js extension for ES modules
        // Convert CommonJS module.exports to ES module export default if needed
        const esModuleCode = code.replace(/module\.exports\s*=\s*(\w+);?/g, 'export default $1;');
        await fs.writeFile(filePath, esModuleCode);

        // For each test case, create a test file and run it
        for (const testCase of challenge.testCases) {
          testFilePath = path.join(tempDir, `test-${testCase.id}.js`);

          // Create test file content
          const testFileContent = `
            import solution from './solution.js';

            try {
              // Parse input and expected output based on the challenge
              ${getTestLogic(challenge.id, testCase)}
            } catch (error) {
              console.error(error.message);
              process.exit(1);
            }
          `;

          await fs.writeFile(testFilePath, testFileContent);

          try {
            // Use --input-type=module flag to ensure Node treats the file as an ES module
            const { stdout, stderr } = await execAsync(`node --input-type=module ${testFilePath}`, {
              timeout: 5000, // 5 second timeout
            });

            const output = stdout || stderr;
            const passed = !stderr && !output.includes('AssertionError') && !output.includes('Error:');

            results.push({
              id: testCase.id,
              passed,
              output: output.trim(),
            });
          } catch (error) {
            results.push({
              id: testCase.id,
              passed: false,
              output: error.message,
            });
          }
        }
        break;

      // Add support for other languages here

      default:
        return res.status(400).json({ error: 'Unsupported language' });
    }

    // Clean up temporary files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }

    res.json({ results });
  } catch (error) {
    console.error('Error testing code:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }

    res.status(500).json({ error: 'Failed to test code' });
  }
});

// Save code solution
router.post('/save/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { code } = codeSavingSchema.parse(req.body);
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const challenge = challenges.find(c => c.id === id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // In a real implementation, save to database
    // For now, just return success
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving code:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }

    res.status(500).json({ error: 'Failed to save code' });
  }
});

// Helper function to generate test logic based on challenge ID
function getTestLogic(challengeId: string, testCase: any): string {
  switch (challengeId) {
    case '1': // Sum of Two Numbers
      return `
        const [a, b] = "${testCase.input}".split(',').map(part => {
          const [_, value] = part.trim().split('=');
          return parseInt(value.trim());
        });

        const result = solution(a, b);
        const expected = ${testCase.expectedOutput};

        if (result !== expected) {
          throw new Error(\`Expected \${expected}, but got \${result}\`);
        }

        console.log(\`Test passed: \${a} + \${b} = \${result}\`);
      `;

    case '2': // Reverse a String
      return `
        const str = "${testCase.input}".split('=')[1].trim().replace(/"/g, '');

        const result = solution(str);
        const expected = ${testCase.expectedOutput};

        if (result !== expected.replace(/"/g, '')) {
          throw new Error(\`Expected "\${expected.replace(/"/g, '')}", but got "\${result}"\`);
        }

        console.log(\`Test passed: "\${str}" reversed is "\${result}"\`);
      `;

    case '3': // FizzBuzz
      return `
        const n = parseInt("${testCase.input}".split('=')[1].trim());

        const result = solution(n);
        const expected = ${testCase.expectedOutput};

        if (JSON.stringify(result) !== JSON.stringify(expected)) {
          throw new Error(\`Expected \${JSON.stringify(expected)}, but got \${JSON.stringify(result)}\`);
        }

        console.log(\`Test passed: FizzBuzz up to \${n}\`);
      `;

    default:
      return `
        console.log("No specific test logic for this challenge. Using generic comparison.");
        const result = solution();
        console.log(\`Result: \${result}\`);
      `;
  }
}

export default router;
