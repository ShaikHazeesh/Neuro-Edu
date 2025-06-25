import React, { useState, useEffect } from 'react';
import { useStreak } from '@/context/streak-context';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const StreakDebugger: React.FC = () => {
  const { streak, updateStreak, lastStreakUpdate, forceShowStreakPopup, debugStreak } = useStreak();
  const [customStreak, setCustomStreak] = useState<string>('');
  const [debugResult, setDebugResult] = useState<string>('');
  const [apiResponse, setApiResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Update custom streak input when streak changes
  useEffect(() => {
    setCustomStreak(streak.toString());
  }, [streak]);

  const handleGetServerStreak = async () => {
    try {
      setLoading(true);
      setApiResponse('Loading...');
      
      const response = await fetch('/api/user/progress');
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.stats && typeof data.stats.streak === 'number') {
        setApiResponse(JSON.stringify({
          serverStreak: data.stats.streak,
          localStreak: streak,
          match: data.stats.streak === streak
        }, null, 2));
      } else {
        setApiResponse(JSON.stringify({
          error: 'Server response does not contain streak information',
          fullResponse: data
        }, null, 2));
      }
    } catch (error) {
      setApiResponse(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomStreakChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomStreak(e.target.value.replace(/[^0-9]/g, ''));
  };

  const handleSetStreak = () => {
    const newStreak = parseInt(customStreak);
    if (!isNaN(newStreak)) {
      updateStreak(newStreak);
      setDebugResult(`Set streak to ${newStreak}`);
    } else {
      setDebugResult('Invalid streak value');
    }
  };

  const handleServerUpdate = async () => {
    try {
      setLoading(true);
      setApiResponse('Updating streak on server...');
      
      const newStreak = parseInt(customStreak);
      if (isNaN(newStreak)) {
        throw new Error('Invalid streak value');
      }
      
      const response = await fetch('/api/debug/update-streak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          streak: newStreak,
          force: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      setApiResponse(JSON.stringify(result, null, 2));
      
      // Update local streak to match
      updateStreak(result.streak);
      setDebugResult(`Server streak updated to ${result.streak}`);
    } catch (error) {
      setApiResponse(`Error: ${error instanceof Error ? error.message : String(error)}`);
      setDebugResult('Failed to update server streak');
    } finally {
      setLoading(false);
    }
  };

  const handleDebugInfo = () => {
    const info = debugStreak();
    setDebugResult(JSON.stringify(info, null, 2));
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Streak Debugger
          <Badge variant={streak > 0 ? "default" : "outline"}>
            Current: {streak}
          </Badge>
        </CardTitle>
        <CardDescription>
          Test and debug streak functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastStreakUpdate ? new Date(lastStreakUpdate).toLocaleString() : 'Never'}
          </p>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="custom-streak">Set Custom Streak</Label>
          <div className="flex gap-2">
            <Input
              id="custom-streak"
              type="number"
              min="0"
              value={customStreak}
              onChange={handleCustomStreakChange}
            />
            <Button onClick={handleSetStreak}>
              Set Local
            </Button>
            <Button variant="secondary" onClick={handleServerUpdate}>
              Set Server
            </Button>
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label>Test Functions</Label>
          <div className="flex gap-2">
            <Button onClick={forceShowStreakPopup} variant="outline">
              Show Popup
            </Button>
            <Button onClick={handleGetServerStreak} variant="outline">
              Get Server Streak
            </Button>
            <Button onClick={handleDebugInfo} variant="outline">
              Debug Info
            </Button>
          </div>
        </div>
        
        {debugResult && (
          <div className="mt-4">
            <Label>Debug Result</Label>
            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto max-h-24">
              {debugResult}
            </pre>
          </div>
        )}
        
        {apiResponse && (
          <div className="mt-4">
            <Label>API Response</Label>
            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto max-h-40">
              {apiResponse}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-gray-500">
          Troubleshooting streak synchronization issues
        </p>
      </CardFooter>
    </Card>
  );
};

export default StreakDebugger; 