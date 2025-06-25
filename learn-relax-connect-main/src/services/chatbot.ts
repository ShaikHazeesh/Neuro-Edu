interface ChatResponse {
  text: string;
  type: 'info' | 'error' | 'success';
}

const PREDEFINED_RESPONSES: Record<string, string[]> = {
  'course': [
    'To register for a course, please visit the student portal and select "Course Registration".',
    'You can view your current courses in the "My Courses" section of the student dashboard.',
    'The course add/drop deadline is typically within the first two weeks of the semester.'
  ],
  'grades': [
    'Your grades can be viewed in the academic portal under "Grade Report".',
    'If you have questions about a specific grade, please contact your professor directly.',
    'Grade appeals must be submitted within 30 days of grade posting.'
  ],
  'schedule': [
    'Your class schedule is available in the student portal under "My Schedule".',
    'To make changes to your schedule, please contact your academic advisor.',
    'The final exam schedule is posted 4 weeks before the end of the semester.'
  ],
  'payment': [
    'Tuition payments can be made through the financial portal.',
    'Payment plans are available - please contact the bursar\'s office.',
    'The deadline for tuition payment is typically two weeks before the semester starts.'
  ],
};

export class ChatbotService {
  private static findBestMatch(input: string): string {
    const lowercaseInput = input.toLowerCase();
    
    // Check for keyword matches
    for (const [key, responses] of Object.entries(PREDEFINED_RESPONSES)) {
      if (lowercaseInput.includes(key)) {
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }

    // Default response if no match is found
    return "I'm not sure about that. Could you please rephrase your question or contact the admin office for more specific information?";
  }

  static async getResponse(userInput: string): Promise<ChatResponse> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = this.findBestMatch(userInput);
      
      return {
        text: response,
        type: 'success'
      };
    } catch (error) {
      return {
        text: 'Sorry, I encountered an error processing your request. Please try again.',
        type: 'error'
      };
    }
  }
} 