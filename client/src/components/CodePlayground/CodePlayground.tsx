import React, { useState, useEffect } from 'react';
import CodeEditor from './CodeEditor';
import TestCaseRunner from './TestCaseRunner';
import InstructionsPanel from './InstructionsPanel';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Play, Save, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Info } from 'lucide-react';

interface CodePlaygroundProps {
  challenge: {
    id: string;
    title: string;
    description: string;
    instructions: string;
    defaultCode: string;
    language: string;
    testCases: Array<{
      id: string;
      input: string;
      expectedOutput: string;
      description: string;
    }>;
    hints: string[];
  };
}

const CodePlayground: React.FC<CodePlaygroundProps> = ({ challenge }) => {
  const [code, setCode] = useState(challenge.defaultCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<Array<{ id: string; passed: boolean; output: string }>>([]);
  const [activeTab, setActiveTab] = useState('editor');
  const [showModuleAlert, setShowModuleAlert] = useState(false);

  // Check if code contains CommonJS syntax and show alert
  useEffect(() => {
    if (code.includes('module.exports')) {
      setShowModuleAlert(true);
    } else {
      setShowModuleAlert(false);
    }
  }, [code]);

  const handleCodeChange = (value: string | undefined) => {
    setCode(value || '');
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('Running code...');

    try {
      const response = await fetch('/api/code/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language: challenge.language,
          input: '',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setOutput(data.output || 'No output');
      } else {
        setOutput(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      const response = await fetch(`/api/code/test/${challenge.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language: challenge.language,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResults(data.results);
      } else {
        setOutput(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSave = async () => {
    try {
      await fetch(`/api/code/save/${challenge.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
        }),
      });

      // Show success message
      setOutput('Code saved successfully!');
    } catch (error) {
      setOutput(`Error saving code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleReset = () => {
    setCode(challenge.defaultCode);
    setOutput('Code reset to default');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* Instructions Panel */}
      <div className="lg:col-span-1">
        <InstructionsPanel
          title={challenge.title}
          description={challenge.description}
          instructions={challenge.instructions}
          hints={challenge.hints}
        />
      </div>

      {/* Code Editor and Output */}
      <div className="lg:col-span-2">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle>{challenge.title}</CardTitle>
            <CardDescription>
              Language: {challenge.language}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-grow p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="mb-4">
                <TabsTrigger value="editor">Code Editor</TabsTrigger>
                <TabsTrigger value="output">Output</TabsTrigger>
                <TabsTrigger value="tests">Test Cases</TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="flex-grow">
                {showModuleAlert && (
                  <Alert variant="warning" className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertTitle>ES Module Syntax Required</AlertTitle>
                    <AlertDescription>
                      This project uses ES modules. Your code with <code>module.exports</code> will be automatically converted to <code>export default</code> syntax.
                    </AlertDescription>
                  </Alert>
                )}
                <CodeEditor
                  defaultLanguage={challenge.language}
                  defaultValue={challenge.defaultCode}
                  onChange={handleCodeChange}
                  height="calc(100vh - 300px)"
                />
              </TabsContent>

              <TabsContent value="output" className="flex-grow">
                <div className="bg-gray-900 text-gray-100 p-4 rounded-md h-full overflow-auto font-mono whitespace-pre-wrap">
                  {output || 'Run your code to see output here'}
                </div>
              </TabsContent>

              <TabsContent value="tests" className="flex-grow">
                <TestCaseRunner
                  testCases={challenge.testCases}
                  results={testResults}
                />
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="border-t pt-4 flex justify-between">
            <div className="flex gap-2">
              <Button onClick={handleRun} disabled={isRunning}>
                <Play className="mr-2 h-4 w-4" />
                Run Code
              </Button>
              <Button onClick={handleRunTests} disabled={isRunning} variant="secondary">
                <Play className="mr-2 h-4 w-4" />
                Run Tests
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleReset} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button onClick={handleSave} variant="outline">
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default CodePlayground;
