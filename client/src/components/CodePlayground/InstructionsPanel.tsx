import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Lightbulb } from 'lucide-react';

interface InstructionsPanelProps {
  title: string;
  description: string;
  instructions: string;
  hints: string[];
}

const InstructionsPanel: React.FC<InstructionsPanelProps> = ({
  title,
  description,
  instructions,
  hints,
}) => {
  const [activeTab, setActiveTab] = useState('instructions');
  const [revealedHints, setRevealedHints] = useState<number[]>([]);

  const handleRevealHint = (index: number) => {
    if (!revealedHints.includes(index)) {
      setRevealedHints([...revealedHints, index]);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="hints">Hints</TabsTrigger>
          </TabsList>
          
          <TabsContent value="instructions" className="flex-grow overflow-auto">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: instructions }} />
            </div>
          </TabsContent>
          
          <TabsContent value="hints" className="flex-grow overflow-auto">
            {hints.length > 0 ? (
              <div className="space-y-4">
                {hints.map((hint, index) => (
                  <div key={index} className="border rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Hint {index + 1}</h3>
                      {!revealedHints.includes(index) && (
                        <button
                          onClick={() => handleRevealHint(index)}
                          className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                        >
                          Reveal Hint
                        </button>
                      )}
                    </div>
                    {revealedHints.includes(index) ? (
                      <p className="text-sm">{hint}</p>
                    ) : (
                      <div className="flex items-center justify-center p-4 text-muted-foreground">
                        <Lightbulb className="mr-2 h-4 w-4" />
                        <span>Click to reveal this hint</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No hints available for this challenge</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default InstructionsPanel;
