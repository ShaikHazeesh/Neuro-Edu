import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import MainLayout from "@/components/layouts/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { useStreak } from "@/context/streak-context";

// Types
interface Question {
  id: number;
  text: string;
  options: Array<{
    id: string;
    text: string;
  }>;
  correctAnswer: string | string[];
  type: 'single' | 'multiple';
  explanation?: string;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  courseId: number;
  lessonId: number;
  questions: Question[];
  timeLimit?: number; // in minutes
  passingScore: number; // percentage
}

// Sample quizzes for different courses
const pythonQuiz: Quiz = {
  id: 1,
  title: "Python Fundamentals Quiz",
  description: "Test your knowledge of Python basics including variables, data types, and control flow.",
  courseId: 1,
  lessonId: 1,
  questions: [
    {
      id: 1,
      text: "Which of the following is NOT a valid data type in Python?",
      options: [
        { id: "a", text: "Integer" },
        { id: "b", text: "Float" },
        { id: "c", text: "Character" },
        { id: "d", text: "Boolean" }
      ],
      correctAnswer: "c",
      type: "single",
      explanation: "Python does not have a character data type. Strings are used instead, even for single characters."
    },
    {
      id: 2,
      text: "What will be the output of the following code?\n\nx = 10\nif x > 5:\n    print('Greater')\nelse:\n    print('Smaller')",
      options: [
        { id: "a", text: "Greater" },
        { id: "b", text: "Smaller" },
        { id: "c", text: "Error" },
        { id: "d", text: "No output" }
      ],
      correctAnswer: "a",
      type: "single",
      explanation: "Since x (10) is greater than 5, the if condition is true and 'Greater' will be printed."
    },
    {
      id: 3,
      text: "Which of the following are valid ways to create a list in Python? (Select all that apply)",
      options: [
        { id: "a", text: "list = [1, 2, 3]" },
        { id: "b", text: "list = list(1, 2, 3)" },
        { id: "c", text: "list = list([1, 2, 3])" },
        { id: "d", text: "list = (1, 2, 3)" }
      ],
      correctAnswer: ["a", "c"],
      type: "multiple",
      explanation: "Option (a) uses square bracket notation for creating a list. Option (c) converts an iterable (another list) to a list using the list() constructor."
    },
    {
      id: 4,
      text: "What does the 'len()' function do in Python?",
      options: [
        { id: "a", text: "Returns the largest item in an iterable" },
        { id: "b", text: "Returns the length of an object" },
        { id: "c", text: "Returns the smallest item in an iterable" },
        { id: "d", text: "Sorts the items of an iterable" }
      ],
      correctAnswer: "b",
      type: "single",
      explanation: "The len() function returns the number of items in an object like string, list, tuple, dictionary, etc."
    },
    {
      id: 5,
      text: "What is the correct way to open a file named 'data.txt' for reading in Python?",
      options: [
        { id: "a", text: "file = open('data.txt', 'r')" },
        { id: "b", text: "file = open('data.txt', 'w')" },
        { id: "c", text: "file = read('data.txt')" },
        { id: "d", text: "file = open('data.txt')" }
      ],
      correctAnswer: "a",
      type: "single",
      explanation: "To open a file for reading, use the 'r' mode with the open() function. Option (d) also works as 'r' is the default mode, but it's good practice to specify the mode explicitly."
    }
  ],
  passingScore: 70
};

const javascriptQuiz: Quiz = {
  id: 2,
  title: "JavaScript Essentials Quiz",
  description: "Test your knowledge of JavaScript fundamentals including variables, functions, and DOM manipulation.",
  courseId: 2,
  lessonId: 3,
  questions: [
    {
      id: 1,
      text: "Which of the following is used to declare a variable in JavaScript?",
      options: [
        { id: "a", text: "var" },
        { id: "b", text: "let" },
        { id: "c", text: "const" },
        { id: "d", text: "All of the above" }
      ],
      correctAnswer: "d",
      type: "single",
      explanation: "JavaScript has three ways to declare variables: var, let, and const. Each has different scoping rules."
    },
    {
      id: 2,
      text: "What will be the output of the following code?\n\nconsole.log(typeof [])",
      options: [
        { id: "a", text: "array" },
        { id: "b", text: "object" },
        { id: "c", text: "undefined" },
        { id: "d", text: "null" }
      ],
      correctAnswer: "b",
      type: "single",
      explanation: "In JavaScript, arrays are a type of object, so typeof [] returns 'object'."
    },
    {
      id: 3,
      text: "Which of these methods modify the original array? (Select all that apply)",
      options: [
        { id: "a", text: "map()" },
        { id: "b", text: "push()" },
        { id: "c", text: "filter()" },
        { id: "d", text: "sort()" }
      ],
      correctAnswer: ["b", "d"],
      type: "multiple",
      explanation: "push() adds items to the end of an array and sort() sorts the elements, both modifying the original array. map() and filter() create new arrays."
    },
    {
      id: 4,
      text: "What is the correct way to select an element with the id 'demo' using JavaScript?",
      options: [
        { id: "a", text: "document.getElement('demo')" },
        { id: "b", text: "document.getElementByName('demo')" },
        { id: "c", text: "document.getElementById('demo')" },
        { id: "d", text: "document.querySelector('#demo')" }
      ],
      correctAnswer: ["c", "d"],
      type: "multiple",
      explanation: "Both getElementById('demo') and querySelector('#demo') can select an element with the id 'demo'."
    },
    {
      id: 5,
      text: "What is the purpose of the 'this' keyword in JavaScript?",
      options: [
        { id: "a", text: "It refers to the current HTML document" },
        { id: "b", text: "It refers to the object it belongs to" },
        { id: "c", text: "It refers to a specific HTML element" },
        { id: "d", text: "None of the above" }
      ],
      correctAnswer: "b",
      type: "single",
      explanation: "The 'this' keyword refers to the object it belongs to. In a method, 'this' refers to the owner object. The value depends on where it is used and how a function is called."
    }
  ],
  passingScore: 70
};

const webDevQuiz: Quiz = {
  id: 3,
  title: "Web Development Quiz",
  description: "Test your knowledge of HTML, CSS, and responsive design principles.",
  courseId: 3,
  lessonId: 5,
  questions: [
    {
      id: 1,
      text: "Which HTML tag is used to define an unordered list?",
      options: [
        { id: "a", text: "<ol>" },
        { id: "b", text: "<li>" },
        { id: "c", text: "<ul>" },
        { id: "d", text: "<list>" }
      ],
      correctAnswer: "c",
      type: "single",
      explanation: "The <ul> tag is used to define an unordered list. The <li> tag is used for list items within both ordered and unordered lists."
    },
    {
      id: 2,
      text: "Which CSS property is used to specify the space between elements?",
      options: [
        { id: "a", text: "padding" },
        { id: "b", text: "margin" },
        { id: "c", text: "spacing" },
        { id: "d", text: "gap" }
      ],
      correctAnswer: "b",
      type: "single",
      explanation: "The margin property is used to create space around elements, outside of any defined borders."
    },
    {
      id: 3,
      text: "Which of the following are valid ways to select elements in CSS? (Select all that apply)",
      options: [
        { id: "a", text: "#header { }" },
        { id: "b", text: ".container { }" },
        { id: "c", text: "p > a { }" },
        { id: "d", text: "input:focus { }" }
      ],
      correctAnswer: ["a", "b", "c", "d"],
      type: "multiple",
      explanation: "All of these are valid CSS selectors. (a) selects by ID, (b) selects by class, (c) uses a child combinator, and (d) uses a pseudo-class."
    },
    {
      id: 4,
      text: "What is the purpose of media queries in CSS?",
      options: [
        { id: "a", text: "To embed videos and audio in a webpage" },
        { id: "b", text: "To create responsive designs that adapt to different screen sizes" },
        { id: "c", text: "To query a database for media files" },
        { id: "d", text: "To load external media files faster" }
      ],
      correctAnswer: "b",
      type: "single",
      explanation: "Media queries are used to apply different CSS styles for different devices or screen sizes, enabling responsive web design."
    },
    {
      id: 5,
      text: "Which of the following are principles of responsive web design? (Select all that apply)",
      options: [
        { id: "a", text: "Fluid grids" },
        { id: "b", text: "Flexible images" },
        { id: "c", text: "Media queries" },
        { id: "d", text: "Fixed-width layouts" }
      ],
      correctAnswer: ["a", "b", "c"],
      type: "multiple",
      explanation: "The three main components of responsive web design are fluid grids, flexible images, and media queries. Fixed-width layouts are the opposite of what responsive design aims to achieve."
    }
  ],
  passingScore: 70
};

const quizzes = [pythonQuiz, javascriptQuiz, webDevQuiz];

const QuizPage = () => {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const quizId = parseInt(params.id);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [quizDuration, setQuizDuration] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { updateStreak, forceShowStreakPopup } = useStreak();

  // Define quizzes array if it doesn't exist
  const quizzes = [pythonQuiz, javascriptQuiz, webDevQuiz];

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network status: online');
      setNetworkStatus('online');
      toast({
        title: "You're back online",
        description: "Your progress will be synced automatically.",
        variant: "default"
      });
    };

    const handleOffline = () => {
      console.log('Network status: offline');
      setNetworkStatus('offline');
      toast({
        title: "You're offline",
        description: "Don't worry, you can still complete the quiz. Progress will be saved locally.",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial status
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Add function to save pending quiz results to local storage
  const savePendingResult = (quizResult: any) => {
    try {
      const pendingResults = JSON.parse(localStorage.getItem('pendingQuizResults') || '[]');
      pendingResults.push({
        ...quizResult,
        timestamp: new Date().toISOString(),
        quizId: quiz?.id
      });
      localStorage.setItem('pendingQuizResults', JSON.stringify(pendingResults));
      console.log('Saved pending quiz result to local storage');
    } catch (error) {
      console.error('Error saving pending quiz result:', error);
    }
  };

  // Sync pending results when back online
  useEffect(() => {
    if (networkStatus === 'online') {
      const syncPendingResults = async () => {
        try {
          const pendingResults = JSON.parse(localStorage.getItem('pendingQuizResults') || '[]');
          if (pendingResults.length === 0) return;

          console.log(`Syncing ${pendingResults.length} pending quiz results`);

          // Process each pending result
          const newPendingResults = [...pendingResults];

          for (let i = 0; i < pendingResults.length; i++) {
            const result = pendingResults[i];
            try {
              // Attempt to submit the result
              await fetch(`/api/quizzes/${result.quizId}/submit`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(result)
              });

              // Remove from pending if successful
              newPendingResults.splice(i, 1);
              i--; // Adjust index after removal

              console.log(`Successfully synced quiz result for quiz ${result.quizId}`);
            } catch (error) {
              console.error(`Failed to sync quiz result for quiz ${result.quizId}:`, error);
              // Keep in pending results for next attempt
            }
          }

          // Update pending results in storage
          localStorage.setItem('pendingQuizResults', JSON.stringify(newPendingResults));

          if (newPendingResults.length < pendingResults.length) {
            // Some results were synced
            queryClient.invalidateQueries({ queryKey: ['/api/user/progress'] });
            queryClient.invalidateQueries({ queryKey: ['/api/courses'] });

            // Only show toast if some results were synced
            if (newPendingResults.length === 0) {
              toast({
                title: "Sync complete",
                description: "All your quiz results have been synced successfully.",
                variant: "default"
              });
            }
          }
        } catch (error) {
          console.error('Error syncing pending quiz results:', error);
        }
      };

      syncPendingResults();
    }
  }, [networkStatus, queryClient, toast]);

  // Load quiz data
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to take quizzes.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    const fetchQuiz = async () => {
      setLoading(true);
      setError(null);
      try {
        // In a real app, we would fetch from API
        // const response = await fetch(`/api/quizzes/${quizId}`);
        // const data = await response.json();

        // For now, we're using our static data
        const foundQuiz = quizzes.find(q => q.id === quizId);

        if (foundQuiz) {
          setQuiz(foundQuiz);
          if (foundQuiz.timeLimit) {
            setTimeLeft(foundQuiz.timeLimit * 60); // Convert to seconds
          }
          // Set the start time when the quiz loads
          setStartTime(Date.now());
        } else {
          setError("Quiz not found");
          toast({
            title: "Quiz Not Found",
            description: "The requested quiz could not be found.",
            variant: "destructive"
          });
          navigate("/courses");
        }
      } catch (error) {
        console.error("Error fetching quiz:", error);
        setError("Failed to load quiz");
        toast({
          title: "Error",
          description: "Failed to load the quiz. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, navigate, toast, user]);

  // Timer effect
  useEffect(() => {
    if (!timeLeft || timeLeft <= 0 || quizCompleted) return;

    console.log(`Starting quiz timer with ${timeLeft} seconds remaining`);

    const intervalId = setInterval(() => {
      setTimeLeft(prev => {
        // Only proceed if we have a valid timer value
        if (prev === null || prev === undefined) {
          console.log("Timer stopped: null value detected");
          clearInterval(intervalId);
          return 0;
        }

        // If timer reaches zero or less, submit the quiz automatically
        if (prev <= 1) {
          console.log("Timer expired, auto-submitting quiz");
          clearInterval(intervalId);

          // Use a timeout to avoid state update conflicts
          setTimeout(() => {
            handleQuizSubmit();
          }, 0);

          return 0;
        }

        // Otherwise, decrement the timer
        return prev - 1;
      });
    }, 1000);

    // Clean up the interval when component unmounts or dependencies change
    return () => {
      console.log("Clearing quiz timer");
      clearInterval(intervalId);
    };
  }, [timeLeft, quizCompleted]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleOptionChange = (optionId: string) => {
    if (!quiz) return;

    if (quiz.questions[currentQuestion].type === 'single') {
      setSelectedOptions([optionId]);
    } else {
      // For multiple choice
      setSelectedOptions(prev => {
        if (prev.includes(optionId)) {
          return prev.filter(id => id !== optionId);
        } else {
          return [...prev, optionId];
        }
      });
    }
  };

  const handleNextQuestion = () => {
    if (!quiz) return;

    // Validate answer
    if (selectedOptions.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one option.",
        variant: "destructive"
      });
      return;
    }

    // Save answer for current question
    setAnswers(prev => ({
      ...prev,
      [quiz.questions[currentQuestion].id]: selectedOptions
    }));

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);

      // Load previously selected options if available
      const nextQuestionId = quiz.questions[currentQuestion + 1].id;
      const previousAnswers = answers[nextQuestionId];

      if (previousAnswers) {
        setSelectedOptions(Array.isArray(previousAnswers) ? previousAnswers : [previousAnswers]);
      } else {
        setSelectedOptions([]);
      }

      setShowExplanation(false);
    } else {
      handleQuizSubmit();
    }
  };

  const handlePreviousQuestion = () => {
    if (!quiz || currentQuestion <= 0) return;

    setCurrentQuestion(prev => prev - 1);

    // Load previously selected options
    const prevQuestionId = quiz.questions[currentQuestion - 1].id;
    const previousAnswers = answers[prevQuestionId];

    if (previousAnswers) {
      setSelectedOptions(Array.isArray(previousAnswers) ? previousAnswers : [previousAnswers]);
    } else {
      setSelectedOptions([]);
    }

    setShowExplanation(false);
  };

  const calculateScore = () => {
    if (!quiz) return 0;

    let correctAnswers = 0;

    quiz.questions.forEach(question => {
      const userAnswer = answers[question.id];

      if (!userAnswer) return; // Skip unanswered questions

      if (question.type === 'single') {
        if (userAnswer && userAnswer[0] === question.correctAnswer) {
          correctAnswers++;
        }
      } else {
        // Multiple choice - comparing arrays
        if (userAnswer && Array.isArray(userAnswer) && Array.isArray(question.correctAnswer)) {
          const sortedUserAnswer = [...userAnswer].sort();
          const sortedCorrectAnswer = [...question.correctAnswer].sort();

          if (
            sortedUserAnswer.length === sortedCorrectAnswer.length &&
            sortedUserAnswer.every((value, index) => value === sortedCorrectAnswer[index])
          ) {
            correctAnswers++;
          }
        }
      }
    });

    return Math.round((correctAnswers / quiz.questions.length) * 100);
  };

  const saveQuizResult = async (finalScore: number) => {
    if (!quiz) return null;

    try {
      console.log(`Saving quiz result: ID ${quiz.id}, Score ${finalScore}%, Course ${quiz.courseId}`);
      
      // Create a properly typed answer object
      const answersData: Record<string, string[]> = {};
      
      // Ensure all answers are arrays of strings
      Object.entries(answers).forEach(([questionId, options]) => {
        if (Array.isArray(options)) {
          answersData[questionId] = options;
        } else if (options) {
          // Convert single string to array
          answersData[questionId] = [options];
        } else {
          // Handle null/undefined
          answersData[questionId] = [];
        }
      });

      // Create a result object that we'll use for both server and local storage
      const quizResultData = {
        score: finalScore,
        answers: answersData,
        timeTaken: quizDuration
      };

      // Try to save to server first
      let serverResult = null;
      try {
        const response = await fetch(`/api/quizzes/${quiz.id}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(quizResultData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Quiz submission failed: ${response.status} ${response.statusText}`, errorText);
          // Server request failed - will fall back to local storage
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        serverResult = await response.json();
        console.log('Quiz submission successful on server:', serverResult);
        return serverResult;
      } catch (serverError) {
        console.error('Server storage failed, using local storage fallback:', serverError);

        // Save to local storage as fallback
        try {
          // Get existing quiz results from local storage
          const storedResults = localStorage.getItem('quizResults');
          const quizResults = storedResults ? JSON.parse(storedResults) : [];

          // Create a new result entry
          const localResult = {
            id: Date.now(), // Use timestamp as ID
            quizId: quiz.id,
            courseId: quiz.courseId,
            score: finalScore,
            passed: finalScore >= (quiz.passingScore || 70),
            answers: answersData,
            timeTaken: quizDuration,
            createdAt: new Date().toISOString(),
            syncStatus: 'pending' // Mark for future sync
          };
          
          // Add to local storage
          quizResults.push(localResult);
          localStorage.setItem('quizResults', JSON.stringify(quizResults));
          console.log('Quiz result saved to local storage:', localResult);
          
          // Update local progress tracking
          updateLocalProgress(localResult);
          
          // Return a similar structure to what the server would return
          return {
            success: true,
            passed: localResult.passed,
            score: finalScore,
            passingScore: quiz.passingScore || 70,
            streak: 1, // Increment streak locally
            result: localResult,
            progress: 0, // Unknown without server data
            quizzesPassed: 0, // Unknown without server data
            isLocalFallback: true // Mark as from local storage
          };
        } catch (localError) {
          console.error('Error saving to local storage:', localError);
          toast({
            title: "Error saving result",
            description: "We couldn't save your result to local storage",
            variant: "destructive",
          });
          return null;
        }
      }
    } catch (error) {
      console.error('Error in quiz result saving process:', error);
      toast({
        title: "Error submitting quiz",
        description: "Please try again later",
        variant: "destructive",
      });
      return null;
    }
  };

  // Function to update local progress tracking
  const updateLocalProgress = (quizResult: any) => {
    try {
      // Get existing progress data
      const storedProgress = localStorage.getItem('userProgress');
      const progressData = storedProgress ? JSON.parse(storedProgress) : {};

      // Initialize course progress if not exists
      if (!progressData[quizResult.courseId]) {
        progressData[quizResult.courseId] = {
          quizzesPassed: 0,
          quizzesAttempted: 0,
          completedLessons: 0,
          lastUpdated: new Date().toISOString()
        };
        }

      // Update course progress
      const courseProgress = progressData[quizResult.courseId];
      
      // Increment quizzes attempted if this is first attempt for this quiz
      const attemptedQuizIds = new Set(courseProgress.attemptedQuizIds || []);
      if (!attemptedQuizIds.has(quizResult.quizId)) {
        attemptedQuizIds.add(quizResult.quizId);
        courseProgress.quizzesAttempted = attemptedQuizIds.size;
        courseProgress.attemptedQuizIds = Array.from(attemptedQuizIds);
      }
      
      // Increment quizzes passed if passed and not already counted
      if (quizResult.passed) {
        const passedQuizIds = new Set(courseProgress.passedQuizIds || []);
        if (!passedQuizIds.has(quizResult.quizId)) {
          passedQuizIds.add(quizResult.quizId);
          courseProgress.quizzesPassed = passedQuizIds.size;
          courseProgress.passedQuizIds = Array.from(passedQuizIds);
        }
      }
      
      // Update last accessed time
      courseProgress.lastUpdated = new Date().toISOString();
      
      // Save updated progress
      localStorage.setItem('userProgress', JSON.stringify(progressData));
      console.log('Updated local progress tracking:', progressData);
    } catch (error) {
      console.error('Error updating local progress:', error);
    }
  };

  const handleQuizSubmit = async () => {
    if (!quiz) return;

    // Prevent multiple submissions
    if (quizCompleted) return;

    try {
      // Save the current question's answer if not already saved
      if (!answers[quiz.questions[currentQuestion].id]) {
        setAnswers(prev => ({
          ...prev,
          [quiz.questions[currentQuestion].id]: selectedOptions
        }));
      }

      // Calculate the final score
      const finalScore = calculateScore();
      setScore(finalScore);
      setQuizCompleted(true);

      // Save result to the backend
      const result = await saveQuizResult(finalScore);

      if (result) {
        const isPassed = finalScore >= (quiz.passingScore || 70);

        // Update streak only if we have a valid streak value
        if (result.streak !== undefined && result.streak !== null) {
          try {
            console.log(`Updating streak from quiz submission: ${result.streak}`);

            // First update the streak value
            updateStreak(result.streak);

            // Then force the popup to show if the quiz was passed
            if (isPassed) {
              // Small delay to ensure the updateStreak function has completed
              setTimeout(() => {
                console.log('Triggering streak popup animation');
                forceShowStreakPopup();
              }, 500);
            }
          } catch (streakError) {
            console.error("Error updating streak:", streakError);
          }
        }

        // Force refresh course data to update progress
        if (quiz.courseId) {
          try {
            // Invalidate both course and progress queries to ensure UI updates
            queryClient.invalidateQueries({ queryKey: [`/api/courses/${quiz.courseId}`] });
            queryClient.invalidateQueries({ queryKey: ['/api/user/progress'] });
            console.log(`Refreshed course and progress data for course ID: ${quiz.courseId}`);
          } catch (error) {
            console.error("Error refreshing course data:", error);
          }
        }
      } else {
        console.error("Failed to get result from quiz submission");
        toast({
          title: "Warning",
          description: "Quiz was submitted but we couldn't update your progress. Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error in quiz submission:", error);
      toast({
        title: "Error",
        description: "There was a problem submitting your quiz",
        variant: "destructive"
      });
    }
  };

  const getQuestionStatusClass = (index: number) => {
    if (!quiz) return "";
    if (index === currentQuestion) return "bg-primary text-white";
    if (answers[quiz.questions[index].id]) return "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    return "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border";
  };

  // Add time formatting function for the quiz duration display
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSec = seconds % 60;
    return `${minutes}m ${remainingSec}s`;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !quiz) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Quiz Not Found</h1>
          <p className="mb-6">Sorry, we couldn't find the quiz you're looking for.</p>
          <Button onClick={() => navigate("/courses")}>
            Back to Courses
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {networkStatus === 'offline' && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 flex items-center">
            <span className="material-icons mr-2">wifi_off</span>
            <div>
              <p className="font-medium">You're currently offline</p>
              <p className="text-sm">Don't worry, you can still complete the quiz. Your progress will be saved locally and synced when you're back online.</p>
            </div>
          </div>
        )}
        {!quizCompleted ? (
          <div>
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">{quiz.title}</h1>
                <p className="text-gray-600 dark:text-gray-300">{quiz.description}</p>
              </div>
              {timeLeft !== null && (
                <div className="text-lg font-medium bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full">
                  Time left: {formatTime(timeLeft)}
                </div>
              )}
            </div>

            <Card className="mb-6">
              <div className="p-6">
                {/* Quiz progress */}
                <div className="mb-6">
                  <div className="flex justify-between mb-2 text-sm">
                    <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
                    <span>{Math.round(((currentQuestion + 1) / quiz.questions.length) * 100)}% Complete</span>
                  </div>
                  <Progress value={((currentQuestion + 1) / quiz.questions.length) * 100} className="h-2" />
                </div>

                {/* Question navigator (mobile) */}
                <div className="mb-6 overflow-x-auto sm:hidden">
                  <div className="flex space-x-2">
                    {quiz.questions.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentQuestion(index);
                          setSelectedOptions(
                            answers[quiz.questions[index].id] as string[] || []
                          );
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                          getQuestionStatusClass(index)
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current question */}
                <div>
                  <motion.div
                    key={currentQuestion}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-xl font-medium mb-4">
                      {currentQuestion + 1}. {quiz.questions[currentQuestion].text}
                    </h2>

                    {quiz.questions[currentQuestion].type === 'single' ? (
                      <RadioGroup
                        value={selectedOptions[0] || ""}
                        onValueChange={val => setSelectedOptions([val])}
                        className="space-y-3"
                      >
                        {quiz.questions[currentQuestion].options.map(option => (
                          <div
                            key={option.id}
                            className="flex items-center space-x-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                            onClick={() => handleOptionChange(option.id)}
                          >
                            <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                            <Label
                              htmlFor={`option-${option.id}`}
                              className="flex-grow cursor-pointer"
                            >
                              {option.text}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : (
                      <div className="space-y-3">
                        {quiz.questions[currentQuestion].options.map(option => (
                          <div
                            key={option.id}
                            className="flex items-center space-x-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                            onClick={() => handleOptionChange(option.id)}
                          >
                            <Checkbox
                              id={`option-${option.id}`}
                              checked={selectedOptions.includes(option.id)}
                              onCheckedChange={() => handleOptionChange(option.id)}
                            />
                            <Label
                              htmlFor={`option-${option.id}`}
                              className="flex-grow cursor-pointer"
                            >
                              {option.text}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}

                    {showExplanation && quiz.questions[currentQuestion].explanation && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Explanation:</p>
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                          {quiz.questions[currentQuestion].explanation}
                        </p>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>

              <div className="p-4 border-t bg-gray-50 dark:bg-gray-800/50 flex flex-wrap gap-3 justify-between">
                <Button
                  variant="outline"
                  onClick={() => setShowExplanation(!showExplanation)}
                  disabled={!quiz.questions[currentQuestion].explanation}
                >
                  {showExplanation ? "Hide Explanation" : "Show Explanation"}
                </Button>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestion === 0}
                  >
                    Previous
                  </Button>

                  <Button
                    onClick={handleNextQuestion}
                    disabled={selectedOptions.length === 0}
                  >
                    {currentQuestion < quiz.questions.length - 1 ? "Next" : "Submit Quiz"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="overflow-hidden">
                <div className="p-6 text-center bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20">
                  <h1 className="text-2xl font-bold mb-2">Quiz Results</h1>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">{quiz.title}</p>

                  {/* Pass/Fail Status */}
                  <div className={`inline-block px-4 py-2 rounded-full font-medium mb-4 ${score >= (quiz.passingScore || 70) ?
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {score >= (quiz.passingScore || 70) ? 'PASSED' : 'FAILED'} ({score}%)
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-md">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{score}%</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {score >= quiz.passingScore ? "Passed" : "Failed"}
                      </p>
                    </div>
                  </div>

                  <div className="inline-block bg-white dark:bg-gray-800 px-4 py-2 rounded-full text-sm mb-4">
                    Passing score: {quiz.passingScore}%
                  </div>

                  <div className="flex flex-wrap justify-center gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 px-6 py-3 rounded-lg shadow-sm">
                      <p className="text-lg font-bold">{quiz.questions.length}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Questions</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 px-6 py-3 rounded-lg shadow-sm">
                      <p className="text-lg font-bold">
                        {Math.round((score / 100) * quiz.questions.length)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Correct</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 px-6 py-3 rounded-lg shadow-sm">
                      <p className="text-lg font-bold">
                        {quiz.questions.length - Math.round((score / 100) * quiz.questions.length)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Incorrect</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 px-6 py-3 rounded-lg shadow-sm">
                      <p className="text-lg font-bold">
                        {formatDuration(quizDuration)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Time Taken</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 px-6 py-3 rounded-lg shadow-sm">
                      <p className="text-lg font-bold">
                        {quiz.passingScore || 70}%
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Passing Score</p>
                    </div>
                  </div>

                  {/* Course Progress Update */}
                  <div className="mt-4 mb-2 text-sm text-gray-600 dark:text-gray-300">
                    Your course progress has been updated!
                  </div>
                </div>

                <div className="p-6">
                  <h2 className="text-xl font-medium mb-4">Question Review</h2>

                  <div className="space-y-6">
                    {quiz.questions.map((question, index) => {
                      const userAnswer = answers[question.id] as string[];
                      let isCorrect = false;

                      if (question.type === 'single') {
                        isCorrect = userAnswer && userAnswer[0] === question.correctAnswer;
                      } else {
                        // Multiple choice
                        if (userAnswer && Array.isArray(userAnswer) && Array.isArray(question.correctAnswer)) {
                          const sortedUserAnswer = [...userAnswer].sort();
                          const sortedCorrectAnswer = [...question.correctAnswer].sort();

                          isCorrect =
                            sortedUserAnswer.length === sortedCorrectAnswer.length &&
                            sortedUserAnswer.every((value, index) => value === sortedCorrectAnswer[index]);
                        }
                      }

                      return (
                        <div
                          key={question.id}
                          className={`p-4 rounded-lg border ${
                            isCorrect
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800'
                              : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'
                          }`}
                        >
                          <p className="font-medium mb-2">
                            {index + 1}. {question.text}
                          </p>

                          <div className="space-y-2 mb-3">
                            {question.options.map(option => (
                              <div
                                key={option.id}
                                className={`px-3 py-2 text-sm rounded ${
                                  question.type === 'single'
                                    ? option.id === question.correctAnswer
                                      ? 'bg-green-100 dark:bg-green-800/40 text-green-800 dark:text-green-200'
                                      : userAnswer && userAnswer[0] === option.id
                                        ? 'bg-red-100 dark:bg-red-800/40 text-red-800 dark:text-red-200'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                    : Array.isArray(question.correctAnswer) && question.correctAnswer.includes(option.id)
                                      ? 'bg-green-100 dark:bg-green-800/40 text-green-800 dark:text-green-200'
                                      : userAnswer && userAnswer.includes(option.id)
                                        ? 'bg-red-100 dark:bg-red-800/40 text-red-800 dark:text-red-200'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {option.text}
                              </div>
                            ))}
                          </div>

                          {question.explanation && (
                            <div className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                              <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">Explanation:</p>
                              <p className="text-blue-700 dark:text-blue-400">{question.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 border-t bg-gray-50 dark:bg-gray-800/50 flex flex-wrap gap-3 justify-between">
                  <Link to={`/courses/${quiz.courseId}`}>
                    <Button variant="outline">
                      Back to Course
                    </Button>
                  </Link>

                  <Button
                    onClick={() => {
                      setQuizCompleted(false);
                      setCurrentQuestion(0);
                      setAnswers({});
                      setSelectedOptions([]);
                      setShowExplanation(false);
                      if (quiz.timeLimit) {
                        setTimeLeft(quiz.timeLimit * 60);
                      }
                    }}
                  >
                    Retake Quiz
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default QuizPage;