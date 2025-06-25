import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import MeditationPlayer from '@/components/MeditationPlayer';
import MeditationService, { type Meditation } from '@/services/MeditationService';
import { useData } from '@/contexts/DataContext';

const Meditations: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeditation, setSelectedMeditation] = useState<Meditation | null>(null);
  const { getMeditationProgress } = useData();
  const meditations = MeditationService.getInstance().getAllMeditations();

  const filteredMeditations = meditations.filter(meditation =>
    meditation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meditation.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meditation.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Meditation Sessions</h1>
        <p className="text-gray-600 max-w-2xl">
          Take a moment to relax and center yourself with these guided meditations.
          Regular practice can help reduce stress and improve your mental wellbeing.
        </p>
      </header>

      <div className="mb-8 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search meditations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {selectedMeditation && (
        <div className="mb-8">
          <MeditationPlayer
            meditation={selectedMeditation}
            onComplete={() => setSelectedMeditation(null)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMeditations.length > 0 ? (
          filteredMeditations.map(meditation => {
            const progress = getMeditationProgress(meditation.id);
            return (
              <Card
                key={meditation.id}
                className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                onClick={() => setSelectedMeditation(meditation)}
              >
                <div className="aspect-video relative">
                  <img
                    src={meditation.thumbnail}
                    alt={meditation.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-primary/80 text-primary-foreground backdrop-blur-sm text-xs px-2 py-1 rounded-full">
                    {meditation.duration} min
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{meditation.title}</CardTitle>
                  <p className="text-sm text-gray-600">{meditation.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {meditation.category}
                    </span>
                    {progress && (
                      <span className="text-xs text-gray-500">
                        Last practiced: {new Date(progress.lastPracticed).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500">No meditations found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Meditations;
