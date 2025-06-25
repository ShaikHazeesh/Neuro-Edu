import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Game } from '@/contexts/DataContext';
import { Pencil, Trash2, Play, ExternalLink } from 'lucide-react';

export default function AdminGames() {
  const { games, addGame, updateGame, deleteGame } = useData();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPlayDialogOpen, setIsPlayDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    thumbnail: '',
    category: '',
    benefits: [] as string[],
    isExternal: false,
    provider: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      url: '',
      thumbnail: '',
      category: '',
      benefits: [],
      isExternal: false,
      provider: ''
    });
    setSelectedGame(null);
  };

  const handleAddGame = async () => {
    try {
      // Convert benefits string to array if needed
      const gameData = {
        ...formData,
        benefits: typeof formData.benefits === 'string' 
          ? formData.benefits.split(',').map(b => b.trim())
          : formData.benefits
      };
      await addGame(gameData);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error adding game:', error);
    }
  };

  const handleEditGame = async () => {
    if (!selectedGame) return;
    try {
      // Convert benefits string to array if needed
      const gameData = {
        ...formData,
        benefits: typeof formData.benefits === 'string'
          ? formData.benefits.split(',').map(b => b.trim())
          : formData.benefits
      };
      await updateGame(selectedGame.id, gameData);
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error updating game:', error);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    try {
      await deleteGame(gameId);
    } catch (error) {
      console.error('Error deleting game:', error);
    }
  };

  const openEditDialog = (game: Game) => {
    setSelectedGame(game);
    setFormData({
      title: game.title,
      description: game.description,
      url: game.url,
      thumbnail: game.thumbnail,
      category: game.category,
      benefits: game.benefits,
      isExternal: game.isExternal,
      provider: game.provider || ''
    });
    setIsEditDialogOpen(true);
  };

  const handlePlayGame = (game: Game) => {
    setSelectedGame(game);
    if (game.isExternal) {
      // Open external games in a new tab
      window.open(game.url, '_blank', 'noopener,noreferrer');
    } else {
      // Show dialog for internal games
      setIsPlayDialogOpen(true);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Games</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add New Game</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Game</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                name="title"
                placeholder="Game Title"
                value={formData.title}
                onChange={handleInputChange}
              />
              <Textarea
                name="description"
                placeholder="Game Description"
                value={formData.description}
                onChange={handleInputChange}
              />
              <Input
                name="url"
                placeholder="Game URL"
                value={formData.url}
                onChange={handleInputChange}
              />
              <Input
                name="thumbnail"
                placeholder="Thumbnail URL"
                value={formData.thumbnail}
                onChange={handleInputChange}
              />
              <Input
                name="category"
                placeholder="Category"
                value={formData.category}
                onChange={handleInputChange}
              />
              <Textarea
                name="benefits"
                placeholder="Benefits (comma-separated)"
                value={Array.isArray(formData.benefits) ? formData.benefits.join(', ') : formData.benefits}
                onChange={handleInputChange}
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isExternal"
                  name="isExternal"
                  checked={formData.isExternal}
                  onChange={(e) => setFormData(prev => ({ ...prev, isExternal: e.target.checked }))}
                />
                <label htmlFor="isExternal">External Game</label>
              </div>
              {formData.isExternal && (
                <Input
                  name="provider"
                  placeholder="Provider (e.g., Poki, CrazyGames)"
                  value={formData.provider}
                  onChange={handleInputChange}
                />
              )}
              <Button onClick={handleAddGame}>Add Game</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {games.map((game) => (
            <TableRow key={game.id}>
              <TableCell>{game.title}</TableCell>
              <TableCell>{game.description}</TableCell>
              <TableCell>{game.category}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePlayGame(game)}
                  >
                    {game.isExternal ? (
                      <ExternalLink className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEditDialog(game)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteGame(game.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Game</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              name="title"
              placeholder="Game Title"
              value={formData.title}
              onChange={handleInputChange}
            />
            <Textarea
              name="description"
              placeholder="Game Description"
              value={formData.description}
              onChange={handleInputChange}
            />
            <Input
              name="url"
              placeholder="Game URL"
              value={formData.url}
              onChange={handleInputChange}
            />
            <Input
              name="thumbnail"
              placeholder="Thumbnail URL"
              value={formData.thumbnail}
              onChange={handleInputChange}
            />
            <Input
              name="category"
              placeholder="Category"
              value={formData.category}
              onChange={handleInputChange}
            />
            <Textarea
              name="benefits"
              placeholder="Benefits (comma-separated)"
              value={Array.isArray(formData.benefits) ? formData.benefits.join(', ') : formData.benefits}
              onChange={handleInputChange}
            />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editIsExternal"
                name="isExternal"
                checked={formData.isExternal}
                onChange={(e) => setFormData(prev => ({ ...prev, isExternal: e.target.checked }))}
              />
              <label htmlFor="editIsExternal">External Game</label>
            </div>
            {formData.isExternal && (
              <Input
                name="provider"
                placeholder="Provider (e.g., Poki, CrazyGames)"
                value={formData.provider}
                onChange={handleInputChange}
              />
            )}
            <Button onClick={handleEditGame}>Update Game</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Game Dialog for internal games */}
      <Dialog open={isPlayDialogOpen} onOpenChange={setIsPlayDialogOpen}>
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
}