import { WeaviateService, InterviewQuestion, StudentResponse } from '../weaviate';
import { InterviewChains, ResponseEvaluation, GeneratedQuestion, QuestionType } from '../langchain/chains';

export interface SkillRating {
  topic: string;
  rating: number; // 1-10 scale
  category: 'languages' | 'frameworks' | 'ai_tools';
}

export interface QuestionWithType extends GeneratedQuestion {
  type: QuestionType;
  options?: string[];
  codeSnippet?: string;
  expectedCompletion?: string;
}

export interface InterviewSession {
  sessionId: string;
  studentId: string;
  startTime: Date;
  currentQuestion: number;
  totalQuestions: number;
  focusedTechnology?: string;
  skillRatings: SkillRating[];
  responses: StudentResponse[];
  currentQuestionData?: QuestionWithType;
  averageScore: number;
  status: 'active' | 'completed' | 'paused';
  subjectRatings: Record<string, number>;
  skippedSubjects: string[];
}

export interface InterviewConfig {
  totalQuestions: number;
  adaptiveDifficulty: boolean;
  focusMode: boolean;
  allowVoiceInput: boolean;
  allowCanvasInput: boolean;
}

export class InterviewManager {
  private weaviateService: WeaviateService;
  private chains: InterviewChains;
  private sessions: Map<string, InterviewSession> = new Map();

  constructor() {
    this.weaviateService = new WeaviateService();
    this.chains = new InterviewChains();
  }

  async initializeSession(
    studentId: string,
    skillRatings: SkillRating[],
    config: InterviewConfig = {
      totalQuestions: 10,
      adaptiveDifficulty: true,
      focusMode: false,
      allowVoiceInput: true,
      allowCanvasInput: true,
    }
  ): Promise<InterviewSession> {
    const sessionId = `session_${studentId}_${Date.now()}`;
    
    const session: InterviewSession = {
      sessionId,
      studentId,
      startTime: new Date(),
      currentQuestion: 1,
      totalQuestions: config.totalQuestions,
      skillRatings,
      responses: [],
      averageScore: 0,
      status: 'active',
      subjectRatings: {},
      skippedSubjects: [],
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  async getNextQuestion(sessionId: string, focusedTechnology?: string): Promise<QuestionWithType | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') {
      return null;
    }

    // Update focused technology if provided
    if (focusedTechnology) {
      session.focusedTechnology = focusedTechnology;
    }

    // Determine which technology to focus on
    const targetTechnology = session.focusedTechnology || this.selectNextTechnology(session);
    
    // Get skill rating for the target technology
    const skillRating = session.skillRatings.find(sr => sr.topic === targetTechnology)?.rating || 5;
    
    // Determine difficulty based on performance and skill rating
    const difficulty = this.calculateDifficulty(session, skillRating);
    
    // Check if we need to ask for subject rating first
    if (!session.subjectRatings[targetTechnology]) {
      const ratingQuestion: QuestionWithType = {
        question: `Before we start with ${targetTechnology}, please rate your proficiency level from 1-10. Do you want to skip this subject?`,
        expectedAnswer: 'Self-assessment rating and skip preference',
        difficulty: 'beginner' as const,
        tags: ['self-assessment', targetTechnology],
        type: 'rating' as QuestionType,
        options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Skip Subject']
      };
      session.currentQuestionData = ratingQuestion;
      return ratingQuestion;
    } else {
      // Generate adaptive question based on performance
      let question: QuestionWithType;
      
      if (session.responses.length >= 2) {
        const recentScores = session.responses.slice(-3).map(r => r.score);
        const averageScore = session.responses.reduce((sum, r) => sum + r.score, 0) / session.responses.length;
        
        question = await this.chains.generateAdaptiveQuestion(
          targetTechnology,
          difficulty,
          averageScore,
          recentScores,
          skillRating
        );
      } else {
        const previousQuestions = session.responses.map(r => `Q${session.responses.indexOf(r) + 1}`);
        question = await this.chains.generateQuestion(targetTechnology, difficulty, skillRating, previousQuestions);
      }
      
      session.currentQuestionData = question;
      return question;
    }
  }

  async submitResponse(
    sessionId: string,
    questionId: string,
    response: string,
    responseType: 'text' | 'voice' | 'canvas' = 'text'
  ): Promise<ResponseEvaluation | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') {
      return null;
    }

    // Handle subject rating responses
    if (session.currentQuestionData?.type === 'rating') {
      const currentTopic = session.focusedTechnology || this.selectNextTechnology(session);
      
      if (response.toLowerCase().includes('skip')) {
        session.skippedSubjects.push(currentTopic);
        // Move to next subject
        const nextQuestion = await this.getNextQuestion(sessionId);
        return {
          score: 0,
          feedback: `${currentTopic} has been skipped. Moving to the next subject.`,
          strengths: [],
          improvements: [],
        };
      } else {
        // Extract rating from response
        const rating = parseInt(response.match(/\d+/)?.[0] || '5');
        session.subjectRatings[currentTopic] = rating;
        
        // Get first actual question for this subject
        const nextQuestion = await this.getNextQuestion(sessionId, currentTopic);
        return {
          score: 100,
          feedback: `Thank you for rating your ${currentTopic} skills as ${rating}/10. Let's begin with the questions!`,
          strengths: ['Self-assessment completed'],
          improvements: [],
        };
      }
    }

    // Get the current question details (in a real implementation, you'd store this)
    const currentTopic = session.focusedTechnology || this.selectNextTechnology(session);
    const skillRating = session.skillRatings.find(sr => sr.topic === currentTopic)?.rating || 5;
    const difficulty = this.calculateDifficulty(session, skillRating);
    
    // Use the stored question data
    const questionData = session.currentQuestionData;
    const mockQuestion = questionData?.question || `Interview question about ${currentTopic}`;
    const mockExpectedAnswer = questionData?.expectedAnswer || `Expected answer covering key concepts of ${currentTopic}`;

    // Evaluate the response
    const evaluation = await this.chains.evaluateResponse(
      mockQuestion,
      response,
      mockExpectedAnswer,
      currentTopic,
      difficulty
      questionData?.type || 'textual'
    );

    // Store the response
    const studentResponse: StudentResponse = {
      studentId: session.studentId,
      questionId,
      response,
      score: evaluation.score,
      feedback: evaluation.feedback,
      timestamp: new Date(),
      responseType,
    };

    session.responses.push(studentResponse);
    
    // Update average score
    session.averageScore = session.responses.reduce((sum, r) => sum + r.score, 0) / session.responses.length;
    
    // Store in Weaviate
    await this.weaviateService.storeStudentResponse(studentResponse);
    
    // Advance to next question
    session.currentQuestion++;
    
    // Check if session is complete
    if (session.currentQuestion > session.totalQuestions) {
      session.status = 'completed';
    }

    return evaluation;
  }

  async getSessionProgress(sessionId: string): Promise<{
    currentQuestion: number;
    totalQuestions: number;
    averageScore: number;
    technologyScores: Record<string, number>;
    status: string;
  } | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Calculate technology-specific scores
    const technologyScores: Record<string, number> = {};
    session.skillRatings.forEach(sr => {
      const techResponses = session.responses.filter(r => 
        // In a real implementation, you'd have better topic tracking
        r.response.toLowerCase().includes(sr.topic.toLowerCase())
      );
      
      if (techResponses.length > 0) {
        technologyScores[sr.topic] = techResponses.reduce((sum, r) => sum + r.score, 0) / techResponses.length;
      } else {
        technologyScores[sr.topic] = 0;
      }
    });

    return {
      currentQuestion: session.currentQuestion,
      totalQuestions: session.totalQuestions,
      averageScore: session.averageScore,
      technologyScores,
      status: session.status,
    };
  }

  async endSession(sessionId: string): Promise<InterviewSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.status = 'completed';
    return session;
  }

  async getStudentHistory(studentId: string): Promise<StudentResponse[]> {
    return await this.weaviateService.getStudentHistory(studentId);
  }

  async handleSubjectSkip(sessionId: string, subject: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    session.skippedSubjects.push(subject);
    return true;
  }

  async setSubjectRating(sessionId: string, subject: string, rating: number): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    session.subjectRatings[subject] = rating;
    return true;
  }

  private selectNextTechnology(session: InterviewSession): string {
    // Filter out skipped subjects
    const technologies = session.skillRatings
      .map(sr => sr.topic)
      .filter(tech => !session.skippedSubjects.includes(tech));
    
    if (technologies.length === 0) {
      // All subjects skipped, end session
      return '';
    }
    
    const currentIndex = (session.currentQuestion - 1) % technologies.length;
    return technologies[currentIndex];
  }

  private calculateDifficulty(session: InterviewSession, skillRating: number): 'beginner' | 'intermediate' | 'advanced' {
    // Base difficulty on skill rating and performance
    let baseDifficulty: 'beginner' | 'intermediate' | 'advanced';
    
    if (skillRating <= 3) {
      baseDifficulty = 'beginner';
    } else if (skillRating <= 7) {
      baseDifficulty = 'intermediate';
    } else {
      baseDifficulty = 'advanced';
    }

    // Adjust based on recent performance
    if (session.responses.length >= 2) {
      const recentAverage = session.responses.slice(-2).reduce((sum, r) => sum + r.score, 0) / 2;
      
      if (recentAverage > 85 && baseDifficulty !== 'advanced') {
        // Increase difficulty
        return baseDifficulty === 'beginner' ? 'intermediate' : 'advanced';
      } else if (recentAverage < 60 && baseDifficulty !== 'beginner') {
        // Decrease difficulty
        return baseDifficulty === 'advanced' ? 'intermediate' : 'beginner';
      }
    }

    return baseDifficulty;
  }

  // Utility method to seed questions in Weaviate
  async seedQuestions() {
    const sampleQuestions: InterviewQuestion[] = [
      {
        id: 'js_1',
        topic: 'JavaScript',
        difficulty: 'beginner',
        question: 'Explain the difference between let, const, and var in JavaScript.',
        expectedAnswer: 'let and const are block-scoped, var is function-scoped. const cannot be reassigned.',
        tags: ['variables', 'scope', 'fundamentals'],
        category: 'technical'
      },
      {
        id: 'react_1',
        topic: 'React',
        difficulty: 'intermediate',
        question: 'How do React hooks work and what problems do they solve?',
        expectedAnswer: 'Hooks allow functional components to use state and lifecycle methods, solving code reuse and component complexity issues.',
        tags: ['hooks', 'state', 'lifecycle'],
        category: 'technical'
      },
      {
        id: 'python_1',
        topic: 'Python',
        difficulty: 'advanced',
        question: 'Explain Python\'s GIL and its impact on multithreading.',
        expectedAnswer: 'Global Interpreter Lock prevents true parallelism in CPU-bound tasks, but allows I/O-bound concurrency.',
        tags: ['GIL', 'threading', 'performance'],
        category: 'technical'
      }
    ];

    for (const question of sampleQuestions) {
      await this.weaviateService.storeQuestion(question);
    }
  }
}