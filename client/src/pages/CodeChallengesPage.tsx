import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Loader2, Code, CheckCircle, Clock, ArrowRight, ArrowLeft, Home } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  language: string;
  estimatedTime: string;
  completed: boolean;
}

const CodeChallengesPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/code/challenges');

        if (!response.ok) {
          throw new Error('Failed to fetch challenges');
        }

        const data = await response.json();
        setChallenges(data);
      } catch (error) {
        console.error('Error fetching challenges:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  const handleChallengeClick = (id: string) => {
    setLocation(`/code-challenges/${id}`);
  };

  const filteredChallenges = challenges.filter((challenge) => {
    if (filter === 'all') return true;
    if (filter === 'completed') return challenge.completed;
    if (filter === 'incomplete') return !challenge.completed;
    return challenge.difficulty === filter;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Loading challenges...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4 flex space-x-2">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Button variant="outline" onClick={handleBack} className="mb-4">
          <Home className="mr-2 h-4 w-4" />
          Home
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Code Challenges</h1>
          <p className="text-muted-foreground">
            Practice your coding skills with these challenges
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'easy' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('easy')}
          >
            Easy
          </Button>
          <Button
            variant={filter === 'medium' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('medium')}
          >
            Medium
          </Button>
          <Button
            variant={filter === 'hard' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('hard')}
          >
            Hard
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
          <Button
            variant={filter === 'incomplete' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('incomplete')}
          >
            Incomplete
          </Button>
        </div>
      </div>

      {filteredChallenges.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No challenges found matching your filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges.map((challenge) => (
            <Card key={challenge.id} className="flex flex-col h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{challenge.title}</CardTitle>
                  {challenge.completed && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <CardDescription>{challenge.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-grow">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className={getDifficultyColor(challenge.difficulty)}>
                    {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                  </Badge>
                  <Badge variant="outline">
                    <Code className="mr-1 h-3 w-3" />
                    {challenge.language}
                  </Badge>
                  <Badge variant="outline">
                    <Clock className="mr-1 h-3 w-3" />
                    {challenge.estimatedTime}
                  </Badge>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleChallengeClick(challenge.id)}
                >
                  {challenge.completed ? 'Review Challenge' : 'Start Challenge'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CodeChallengesPage;
