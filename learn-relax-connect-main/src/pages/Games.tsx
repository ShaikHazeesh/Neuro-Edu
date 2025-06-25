import React, { useState } from 'react';
import { games, gameCategories } from '@/config/games';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Play } from 'lucide-react';

const Games = () => {
  const [selectedGame, setSelectedGame] = useState<typeof games[0] | null>(null);
  const [showGameDialog, setShowGameDialog] = useState(false);

  const handlePlayGame = (game: typeof games[0]) => {
    setSelectedGame(game);
    if (game.isExternal) {
      // Open external games in a new tab
      window.open(game.url, '_blank', 'noopener,noreferrer');
    } else {
      // Show dialog for internal games
      setShowGameDialog(true);
    }
  };

  return (
    <div className="container mx-auto py-8 animate-fade-in">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Wellness Games</h1>
        <p className="text-gray-600">
          Take a break and enjoy our collection of games designed to reduce stress,
          improve focus, and support your mental wellbeing.
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="flex flex-wrap justify-center mb-8">
          <TabsTrigger value="all">All Games</TabsTrigger>
          {gameCategories.map(category => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map(game => (
              <GameCard key={game.id} game={game} onPlay={handlePlayGame} />
            ))}
          </div>
        </TabsContent>

        {gameCategories.map(category => (
          <TabsContent key={category.id} value={category.id} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games
                .filter(game => game.category === category.id)
                .map(game => (
                  <GameCard key={game.id} game={game} onPlay={handlePlayGame} />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Game Dialog for internal games */}
      <Dialog open={showGameDialog} onOpenChange={setShowGameDialog}>
        {selectedGame && !selectedGame.isExternal && (
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>{selectedGame.title}</DialogTitle>
              <DialogDescription>{selectedGame.description}</DialogDescription>
            </DialogHeader>
            <div className="flex-1 w-full h-full min-h-[500px]">
              <iframe
                src={selectedGame.url}
                className="w-full h-full rounded-lg"
                title={selectedGame.title}
                allowFullScreen
              />
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

interface GameCardProps {
  game: typeof games[0];
  onPlay: (game: typeof games[0]) => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onPlay }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video relative overflow-hidden">
        <img
          src={game.thumbnail}
          alt={game.title}
          className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
        />
      </div>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{game.title}</span>
          {game.provider && (
            <Badge variant="secondary" className="text-xs">
              {game.provider}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{game.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className="text-sm font-medium">Benefits:</p>
          <ul className="text-sm text-gray-500 list-disc list-inside">
            {game.benefits.map((benefit, index) => (
              <li key={index}>{benefit}</li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-wellness-blue hover:bg-wellness-blue/90"
          onClick={() => onPlay(game)}
        >
          {game.isExternal ? (
            <>
              Play on {game.provider} <ExternalLink className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Play Now <Play className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Games;
