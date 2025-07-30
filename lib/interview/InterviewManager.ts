import { WeaviateService, InterviewQuestion, StudentResponse } from '../weaviate';
import { InterviewChains, ResponseEvaluation, GeneratedQuestion } from '../langchain/chains';

export interface SkillRating {
  topic: string;
  rating: number; // 1-10 scale
  category: 'languages' | 'frameworks' | 'ai_tools';
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
  averageScore: number;
  status: 'active' | 'completed' | 'paused';
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
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  async getNextQuestion(sessionId: string, focusedTechnology?: string): Promise<GeneratedQuestion | null> {
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
    
    // Check if we should use adaptive questioning
    if (session.responses.length >= 2) {
      const recentScores = session.responses.slice(-3).map(r => r.score);
      const averageScore = session.responses.reduce((sum, r) => sum + r.score, 0) / session.responses.length;
      
      return await this.chains.generateAdaptiveQuestion(
        targetTechnology,
        difficulty,
        averageScore,
        recentScores,
        skillRating
      );
    } else {
      // Generate initial question
      const previousQuestions = session.responses.map(r => `Q${session.responses.indexOf(r) + 1}`);
      return await this.chains.generateQuestion(targetTechnology, difficulty, skillRating, previousQuestions);
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

    // Get the current question details (in a real implementation, you'd store this)
    const currentTopic = session.focusedTechnology || this.selectNextTechnology(session);
    const skillRating = session.skillRatings.find(sr => sr.topic === currentTopic)?.rating || 5;
    const difficulty = this.calculateDifficulty(session, skillRating);
    
    // For demo purposes, create a mock question
    const mockQuestion = `Interview question about ${currentTopic}`;
    const mockExpectedAnswer = `Expected answer covering key concepts of ${currentTopic}`;

    // Evaluate the response
    const evaluation = await this.chains.evaluateResponse(
      mockQuestion,
      response,
      mockExpectedAnswer,
      currentTopic,
      difficulty
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

  private selectNextTechnology(session: InterviewSession): string {
    // If no focused technology, rotate through skill ratings
    const technologies = session.skillRatings.map(sr => sr.topic);
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