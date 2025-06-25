import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import CodePlayground from '../components/CodePlayground/CodePlayground';
import { Button } from '../components/ui/button';
import { ArrowLeft, Loader2, Home } from 'lucide-react';

const CodeChallengePage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const params = useParams();
  const challengeId = params.id;

  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/code/challenges/${challengeId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch challenge');
        }

        const data = await response.json();
        setChallenge(data);
      } catch (error) {
        console.error('Error fetching challenge:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (challengeId) {
      fetchChallenge();
    }
  }, [challengeId]);

  const handleBack = () => {
    setLocation('/code-challenges');
  };

  const handleHome = () => {
    setLocation('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Loading challenge...</p>
        </div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="mb-6">{error || 'Challenge not found'}</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Challenges
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="mb-4 flex space-x-2">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Challenges
        </Button>

        <Button variant="outline" onClick={handleHome} className="mb-4">
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </div>

      <CodePlayground challenge={challenge} />
    </div>
  );
};

export default CodeChallengePage;
