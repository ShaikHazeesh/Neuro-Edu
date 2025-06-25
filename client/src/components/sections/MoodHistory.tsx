import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";

interface MoodEntry {
  id: number;
  userId: number;
  mood: string;
  journal: string | null;
  createdAt: string;
}

const MoodHistory = () => {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMoodEntries = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await axios.get<MoodEntry[]>("/api/mood");
      setMoodEntries(response.data);
    } catch (err) {
      console.error("Error fetching mood entries:", err);
      setError("Failed to load your mood history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMoodEntries();
  }, []);

  const getMoodEmoji = (mood: string) => {
    switch (mood.toLowerCase()) {
      case "good":
        return "😊";
      case "okay":
        return "😐";
      case "struggling":
        return "😔";
      default:
        return "❓";
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood.toLowerCase()) {
      case "good":
        return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300";
      case "okay":
        return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300";
      case "struggling":
        return "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric"
    }).format(date);
  };

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 p-6 rounded-standard shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-outfit font-semibold">Your Mood History</h3>
        <button
          onClick={fetchMoodEntries}
          className="p-2 text-primary hover:text-primary-dark"
          aria-label="Refresh"
        >
          <span className="material-icons">refresh</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-standard">
          {error}
        </div>
      ) : moodEntries.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <span className="material-icons text-5xl mb-2">sentiment_neutral</span>
          <p>No mood entries yet. Start tracking your mood today!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {moodEntries.map((entry) => (
            <motion.div
              key={entry.id}
              className="border border-gray-100 dark:border-gray-700 rounded-standard p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{getMoodEmoji(entry.mood)}</span>
                  <div>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getMoodColor(entry.mood)}`}>
                      {entry.mood}
                    </span>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(entry.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
              
              {entry.journal && (
                <div className="mt-3 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-standard text-sm">
                  {entry.journal}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MoodHistory; 