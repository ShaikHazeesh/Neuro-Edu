import React, { useState } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  description: string;
}

interface TestResult {
  id: string;
  passed: boolean;
  output: string;
}

interface TestCaseRunnerProps {
  testCases: TestCase[];
  results: TestResult[];
}

const TestCaseRunner: React.FC<TestCaseRunnerProps> = ({ testCases, results }) => {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const getResultForTest = (testId: string) => {
    return results.find((result) => result.id === testId);
  };

  const passedCount = results.filter((result) => result.passed).length;
  const totalCount = testCases.length;
  const progress = totalCount > 0 ? (passedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {results.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between mb-1 text-sm">
            <span>
              {passedCount} of {totalCount} tests passing
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-green-600 h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Test cases */}
      <div className="space-y-2">
        {testCases.map((testCase) => {
          const result = getResultForTest(testCase.id);
          const isOpen = openItems.includes(testCase.id);
          
          return (
            <Collapsible
              key={testCase.id}
              open={isOpen}
              onOpenChange={() => toggleItem(testCase.id)}
              className="border rounded-md overflow-hidden"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left">
                <div className="flex items-center">
                  {result ? (
                    result.passed ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    )
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300 mr-2" />
                  )}
                  <span>{testCase.description}</span>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="p-4 pt-0 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Input:</h4>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto">
                        {testCase.input || '(No input)'}
                      </pre>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Expected Output:</h4>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto">
                        {testCase.expectedOutput}
                      </pre>
                    </div>
                  </div>
                  
                  {result && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Your Output:</h4>
                      <pre className={`p-2 rounded text-xs overflow-auto ${
                        result.passed 
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                          : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                      }`}>
                        {result.output || '(No output)'}
                      </pre>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
        
        {testCases.length === 0 && (
          <div className="text-center p-4 text-muted-foreground">
            No test cases available for this challenge
          </div>
        )}
      </div>
    </div>
  );
};

export default TestCaseRunner;
