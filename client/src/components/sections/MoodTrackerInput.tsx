import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Smile, Meh, Frown } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface MoodTrackerInputProps {
  onMoodSubmitted?: () => void;
}

const moodOptions = [
  { value: "Good", icon: Smile, color: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" },
  { value: "Okay", icon: Meh, color: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" },
  { value: "Struggling", icon: Frown, color: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800" },
];

const MoodTrackerInput: React.FC<MoodTrackerInputProps> = ({ onMoodSubmitted }) => {
  const { toast } = useToast();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [journalText, setJournalText] = useState("");

  // Save new mood entry
  const saveMoodMutation = useMutation({
    mutationFn: async (data: { mood: string; journal: string }) => {
      try {
        const res = await apiRequest("POST", "/api/mood", data);
        return await res.json();
      } catch (error) {
        console.error("Error in mood submission:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Mood saved",
        description: `Your mood entry has been recorded`,
      });
      setSelectedMood(null);
      setJournalText("");
      // Force refetch of mood entries and user progress
      queryClient.invalidateQueries({ queryKey: ["/api/mood"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/progress"] });
      
      // Call the callback if provided
      if (onMoodSubmitted) {
        onMoodSubmitted();
      }
    },
    onError: (error) => {
      console.error("Error saving mood:", error);
      toast({
        title: "Error saving mood",
        description: "There was a problem saving your mood entry",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async () => {
    if (!selectedMood) {
      toast({
        title: "Please select a mood",
        description: "You need to select your current mood before saving.",
        variant: "destructive"
      });
      return;
    }

    try {
      await saveMoodMutation.mutateAsync({
        mood: selectedMood,
        journal: journalText
      });
    } catch (error) {
      console.error("Error saving mood entry:", error);
    }
  };

  return (
    <div className="mood-tracker-input">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">How are you feeling right now?</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {moodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedMood(option.value)}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-colors ${
                selectedMood === option.value 
                  ? option.color
                  : "bg-muted/40 border-muted-foreground/20"
              }`}
            >
              <option.icon className="h-6 w-6 mb-2" />
              <span>{option.value}</span>
            </button>
          ))}
        </div>
        </div>
        
      <div className="mb-6">
        <label htmlFor="journal" className="block text-sm font-medium mb-2">
          What's on your mind? (optional)
          </label>
        <Textarea
            id="journal"
          placeholder="Share how you're feeling..."
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          rows={4}
          className="w-full resize-none"
          />
        </div>
        
      <Button 
        onClick={handleSubmit}
        disabled={!selectedMood || saveMoodMutation.isPending}
        className="w-full"
      >
        {saveMoodMutation.isPending ? "Saving..." : "Submit"}
      </Button>
          </div>
  );
};

export default MoodTrackerInput; 