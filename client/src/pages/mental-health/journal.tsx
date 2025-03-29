import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layouts/MainLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";
import {
  Smile,
  Meh,
  Frown,
  Calendar,
  CheckCircle,
  Loader2,
  BarChart as BarChartIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";

type MoodEntry = {
  id: number;
  createdAt: Date;
  userId: number;
  mood: string;
  journal: string | null;
};

const moodOptions = [
  { value: "Good", icon: Smile, color: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" },
  { value: "Okay", icon: Meh, color: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" },
  { value: "Struggling", icon: Frown, color: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800" },
];

const MoodJournal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [journalText, setJournalText] = useState("");
  const [activeTab, setActiveTab] = useState("new");

  // Fetch mood entries
  const { data: moodEntries, isLoading: isLoadingEntries } = useQuery<MoodEntry[]>({
    queryKey: ["/api/mood"],
    enabled: !!user,
  });

  // Save new mood entry
  const saveMoodMutation = useMutation({
    mutationFn: async (data: { mood: string; journal: string }) => {
      const res = await apiRequest("POST", "/api/mood", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Mood saved",
        description: "Your mood entry has been recorded",
      });
      setSelectedMood(null);
      setJournalText("");
      setActiveTab("history");
      queryClient.invalidateQueries({ queryKey: ["/api/mood"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/progress"] });
    },
    onError: () => {
      toast({
        title: "Error saving mood",
        description: "There was a problem saving your mood entry",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedMood) {
      toast({
        title: "Please select a mood",
        description: "Select how you're feeling today",
        variant: "destructive",
      });
      return;
    }

    saveMoodMutation.mutate({
      mood: selectedMood,
      journal: journalText,
    });
  };

  // Group entries by date
  const entriesByDate = moodEntries?.reduce((acc: Record<string, MoodEntry[]>, entry) => {
    const date = format(new Date(entry.createdAt), "yyyy-MM-dd");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {}) || {};

  // Sort dates in reverse chronological order
  const sortedDates = Object.keys(entriesByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <MainLayout>
      <div className="py-12 px-4 bg-gradient-to-b from-secondary/10 to-background dark:from-secondary/20 dark:to-darkBg">
        <div className="container mx-auto max-w-4xl">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-outfit font-bold mb-4">Mood Journal</h1>
            <p className="text-lg max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
              Track your emotional wellbeing alongside your learning journey
            </p>
          </motion.div>

          <Card>
            <CardHeader>
              <Tabs defaultValue="new" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="new">New Entry</TabsTrigger>
                  <TabsTrigger value="history">Entry History</TabsTrigger>
                  <TabsTrigger value="analytics"><BarChartIcon className="h-4 w-4 mr-2" /> Analytics</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            
            <TabsContent value="new" className="mt-0">
              <CardContent className="p-6">
                <div className="mb-8">
                  <h2 className="text-xl font-medium mb-4">How are you feeling today?</h2>
                  <div className="grid grid-cols-3 gap-4">
                    {moodOptions.map((option) => (
                      <button
                        key={option.value}
                        className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all ${
                          selectedMood === option.value
                            ? `${option.color} border-current`
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                        onClick={() => setSelectedMood(option.value)}
                      >
                        <option.icon size={36} className={selectedMood === option.value ? "" : "text-gray-500"} />
                        <span className="mt-2 font-medium">{option.value}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="text-xl font-medium mb-4">Journal Entry (Optional)</h2>
                  <Textarea
                    placeholder="How has your day been? What's on your mind as you're learning to code?"
                    className="min-h-[150px]"
                    value={journalText}
                    onChange={(e) => setJournalText(e.target.value)}
                  />
                </div>
              </CardContent>
              
              <CardFooter className="px-6 pb-6 pt-0">
                <Button 
                  className="w-full" 
                  onClick={handleSubmit}
                  disabled={saveMoodMutation.isPending}
                >
                  {saveMoodMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Save Mood Entry
                    </>
                  )}
                </Button>
              </CardFooter>
            </TabsContent>
            
            <TabsContent value="history" className="mt-0">
              <CardContent className="p-6">
                <h2 className="text-xl font-medium mb-4">Your Mood History</h2>
                
                {isLoadingEntries ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : sortedDates.length > 0 ? (
                  <div className="space-y-8">
                    {sortedDates.map(date => (
                      <div key={date} className="border-b pb-4 last:border-0">
                        <div className="flex items-center mb-4">
                          <Calendar className="mr-2 h-5 w-5 text-primary" />
                          <h3 className="font-medium">{format(new Date(date), "EEEE, MMMM d, yyyy")}</h3>
                        </div>
                        
                        <div className="space-y-4 pl-7">
                          {entriesByDate[date].map(entry => {
                            const moodOption = moodOptions.find(o => o.value === entry.mood);
                            const MoodIcon = moodOption?.icon || Meh;
                            
                            return (
                              <div key={entry.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <div className="flex items-center mb-2">
                                  <div className={`p-2 rounded-full mr-2 ${
                                    moodOption ? moodOption.color : "bg-gray-100 dark:bg-gray-700"
                                  }`}>
                                    <MoodIcon className="h-4 w-4" />
                                  </div>
                                  <span className="font-medium">{entry.mood}</span>
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    {format(new Date(entry.createdAt), "h:mm a")}
                                  </span>
                                </div>
                                
                                {entry.journal && (
                                  <div className="mt-2 pl-8 text-sm text-gray-600 dark:text-gray-300">
                                    {entry.journal}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No mood entries yet</p>
                    <Button variant="secondary" onClick={() => setActiveTab("new")}>
                      Create Your First Entry
                    </Button>
                  </div>
                )}
              </CardContent>
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-0">
              <CardContent className="p-6">
                <h2 className="text-xl font-medium mb-4">Mood Analytics</h2>
                
                {isLoadingEntries ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : moodEntries && moodEntries.length > 0 ? (
                  <div className="space-y-8">
                    {/* Mood Distribution */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Mood Distribution</h3>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg h-80">
                        {/* Pie Chart of mood distribution */}
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={(() => {
                                const distribution = moodEntries.reduce((acc: Record<string, number>, entry) => {
                                  acc[entry.mood] = (acc[entry.mood] || 0) + 1;
                                  return acc;
                                }, {});
                                
                                return Object.keys(distribution).map(mood => ({
                                  name: mood,
                                  value: distribution[mood]
                                }));
                              })()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {moodOptions.map((option, index) => {
                                const colors = {
                                  "Good": "#4ade80", // green
                                  "Okay": "#60a5fa", // blue
                                  "Struggling": "#fb923c" // orange
                                };
                                // @ts-ignore - mood is a valid key
                                const color = colors[option.value] || "#9ca3af";
                                return <Cell key={`cell-${index}`} fill={color} />;
                              })}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* Mood Trends Over Time */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Mood Trends (Last 7 Days)</h3>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg h-80">
                        {/* Bar Chart of mood over time */}
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={(() => {
                              // Get last 7 days
                              const endDate = new Date();
                              const startDate = subDays(endDate, 6);
                              
                              // Generate array of all dates in the interval
                              const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
                              
                              // Create data for chart
                              return dateRange.map(date => {
                                // Format date for comparison
                                const dateStr = format(date, "yyyy-MM-dd");
                                
                                // Get mood entries for this date
                                const dayEntries = entriesByDate[dateStr] || [];
                                
                                // Count moods
                                const good = dayEntries.filter(e => e.mood === "Good").length;
                                const okay = dayEntries.filter(e => e.mood === "Okay").length;
                                const struggling = dayEntries.filter(e => e.mood === "Struggling").length;
                                
                                return {
                                  date: format(date, "MM/dd"),
                                  good,
                                  okay,
                                  struggling,
                                  total: dayEntries.length
                                };
                              });
                            })()}
                            margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="good" fill="#4ade80" name="Good" />
                            <Bar dataKey="okay" fill="#60a5fa" name="Okay" />
                            <Bar dataKey="struggling" fill="#fb923c" name="Struggling" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                        <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Entries</h4>
                        <p className="text-3xl font-bold">{moodEntries.length}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                        <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Most Common Mood</h4>
                        <p className="text-3xl font-bold">
                          {(() => {
                            const moodCounts = moodEntries.reduce((acc: Record<string, number>, entry) => {
                              acc[entry.mood] = (acc[entry.mood] || 0) + 1;
                              return acc;
                            }, {});
                            
                            let maxMood = "";
                            let maxCount = 0;
                            
                            Object.entries(moodCounts).forEach(([mood, count]) => {
                              if (count > maxCount) {
                                maxMood = mood;
                                maxCount = count;
                              }
                            });
                            
                            return maxMood;
                          })()}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                        <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Streak</h4>
                        <p className="text-3xl font-bold">
                          {(() => {
                            const today = format(new Date(), "yyyy-MM-dd");
                            const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
                            
                            // If no entry today, streak is 0
                            if (!entriesByDate[today]) return 0;
                            
                            // Otherwise count consecutive days with entries
                            let streak = 1;
                            let currentDate = yesterday;
                            
                            while (entriesByDate[currentDate]) {
                              streak++;
                              currentDate = format(subDays(new Date(currentDate), 1), "yyyy-MM-dd");
                            }
                            
                            return streak;
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No mood data to analyze yet</p>
                    <Button variant="secondary" onClick={() => setActiveTab("new")}>
                      Create Your First Entry
                    </Button>
                  </div>
                )}
              </CardContent>
            </TabsContent>
          </Card>
          
          <div className="mt-12 bg-white dark:bg-gray-800 p-6 rounded-standard shadow-soft">
            <div className="flex items-center mb-4">
              <h3 className="text-xl font-medium">Why Track Your Mood?</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                  <span className="material-icons text-primary">insights</span>
                </div>
                <h4 className="font-medium mb-2">Gain Self-Awareness</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Recognize patterns in how your emotions relate to your learning journey.
                </p>
              </div>
              <div className="flex flex-col">
                <div className="bg-secondary/10 dark:bg-secondary/20 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                  <span className="material-icons text-secondary">trending_up</span>
                </div>
                <h4 className="font-medium mb-2">Track Progress</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  See how your emotional wellbeing improves alongside your coding skills.
                </p>
              </div>
              <div className="flex flex-col">
                <div className="bg-accent/10 dark:bg-accent/20 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                  <span className="material-icons text-accent">psychology</span>
                </div>
                <h4 className="font-medium mb-2">Manage Stress</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Identify what triggers stress or anxiety in your programming studies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MoodJournal;