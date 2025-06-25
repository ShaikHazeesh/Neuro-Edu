import { toast } from '@/components/ui/use-toast';

export interface Meditation {
  id: string;
  title: string;
  description: string;
  duration: number;
  audioUrl: string;
  thumbnail: string;
  category: string;
}

export const MEDITATIONS: Meditation[] = [
  {
    id: 'breathing-1',
    title: 'Mindful Breathing',
    description: 'A gentle introduction to mindful breathing techniques to help you relax and center yourself.',
    duration: 5,
    audioUrl: '/meditations/breathing.mp3',
    thumbnail: '/images/meditations/breathing.svg',
    category: 'Breathing'
  },
  {
    id: 'relaxation-1',
    title: 'Progressive Relaxation',
    description: 'Guide your body into a state of deep relaxation by progressively releasing tension.',
    duration: 10,
    audioUrl: '/meditations/relax.mp3',
    thumbnail: '/images/meditations/relaxation.svg',
    category: 'Relaxation'
  },
  {
    id: 'focus-1',
    title: 'Study Focus',
    description: 'Enhance your concentration and mental clarity for better study sessions.',
    duration: 15,
    audioUrl: '/meditations/study_focus.mp3',
    thumbnail: '/images/meditations/focus.svg',
    category: 'Focus'
  }
];

class MeditationService {
  private static instance: MeditationService;
  private currentAudio: HTMLAudioElement | null = null;

  private constructor() {}

  static getInstance(): MeditationService {
    if (!MeditationService.instance) {
      MeditationService.instance = new MeditationService();
    }
    return MeditationService.instance;
  }

  getAllMeditations(): Meditation[] {
    return MEDITATIONS;
  }

  getMeditationById(id: string): Meditation | undefined {
    return MEDITATIONS.find(m => m.id === id);
  }

  async playMeditation(meditation: Meditation): Promise<void> {
    try {
      // Stop any currently playing meditation
      this.stopCurrentMeditation();

      // Create new audio element
      this.currentAudio = new Audio(meditation.audioUrl);
      this.currentAudio.preload = 'auto';
      this.currentAudio.volume = 0.5;

      // Return a promise that resolves when the audio is loaded
      return new Promise((resolve, reject) => {
        if (this.currentAudio) {
          this.currentAudio.addEventListener('canplaythrough', () => {
            this.currentAudio?.play().then(resolve).catch(reject);
          }, { once: true });

          this.currentAudio.addEventListener('error', (e) => {
            reject(new Error('Failed to load audio file'));
          }, { once: true });
        } else {
          reject(new Error('Audio element not created'));
        }
      });
    } catch (error) {
      console.error('Failed to play meditation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to play meditation audio. Please try again.",
      });
      throw error;
    }
  }

  stopCurrentMeditation() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  // Clean up resources
  cleanup() {
    this.stopCurrentMeditation();
  }
}

export default MeditationService; 