import { ChatGroq } from '@langchain/groq';
import { PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

export type QuestionType = 'mcq' | 'code_snippet' | 'code_completion' | 'textual' | 'rating';

// Initialize Groq LLM
const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: 'mixtral-8x7b-32768',
  temperature: 0.7,
});

// Response evaluation schema
const responseEvaluationSchema = z.object({
  score: z.number().min(0).max(100).describe('Score from 0-100 based on answer quality'),
  feedback: z.string().describe('Detailed feedback on the response'),
  strengths: z.array(z.string()).describe('Key strengths in the response'),
  improvements: z.array(z.string()).describe('Areas for improvement'),
  followUpQuestion: z.string().optional().describe('Optional follow-up question'),
});

// Enhanced question generation schema
const enhancedQuestionSchema = z.object({
  question: z.string().describe('The interview question'),
  expectedAnswer: z.string().describe('Key points expected in a good answer'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe('Question difficulty level'),
  tags: z.array(z.string()).describe('Relevant tags for the question'),
  type: z.enum(['mcq', 'code_snippet', 'code_completion', 'textual', 'rating']).describe('Type of question'),
  options: z.array(z.string()).optional().describe('Multiple choice options (for MCQ type)'),
  codeSnippet: z.string().optional().describe('Code snippet (for code-related questions)'),
  expectedCompletion: z.string().optional().describe('Expected code completion'),
});

export type ResponseEvaluation = z.infer<typeof responseEvaluationSchema>;

export type GeneratedQuestion = z.infer<typeof enhancedQuestionSchema>;

export class InterviewChains {
  private evaluationChain: RunnableSequence;
  private questionGenerationChain: RunnableSequence;
  private adaptiveQuestionChain: RunnableSequence;

  constructor() {
    // Response evaluation chain
    const evaluationParser = StructuredOutputParser.fromZodSchema(responseEvaluationSchema);
    const evaluationPrompt = PromptTemplate.fromTemplate(`
You are an expert technical interviewer evaluating a candidate's response.

Question: {question}
Question Type: {questionType}
Expected Answer Key Points: {expectedAnswer}
Candidate's Response: {response}
Topic: {topic}
Difficulty Level: {difficulty}

Evaluate the response based on:
1. Technical accuracy and depth
2. Communication clarity
3. Problem-solving approach
4. Completeness of answer
5. Understanding of concepts

Provide a score from 0-100 and detailed feedback.

{format_instructions}
`);

    this.evaluationChain = RunnableSequence.from([
      evaluationPrompt,
      llm,
      evaluationParser,
    ]);

    // Question generation chain
    const questionParser = StructuredOutputParser.fromZodSchema(enhancedQuestionSchema);
    const questionPrompt = PromptTemplate.fromTemplate(`
Generate a {difficulty} level interview question for {topic}.

Requirements:
- Question type should vary: MCQ (25%), Code Snippet (25%), Code Completion (25%), Textual (25%)
- For MCQ: Provide 4 options with one correct answer
- For Code Snippet: Include a short code example to analyze/debug
- For Code Completion: Provide partial code that needs completion
- For Textual: Traditional interview questions requiring explanation
- Difficulty: {difficulty} level appropriate for {topic}
- Student's self-rated skill level: {skillRating}/10

Previous questions asked: {previousQuestions}
{format_instructions}
`);

    this.questionGenerationChain = RunnableSequence.from([
      questionPrompt,
      llm,
      questionParser,
    ]);

    // Adaptive question chain (adjusts difficulty based on performance)
    const adaptivePrompt = PromptTemplate.fromTemplate(`
Generate an adaptive interview question based on performance history.

Student Performance Summary:
- Average Score: {averageScore}
- Recent Scores: {recentScores}
- Current Topic: {topic}
- Current Difficulty: {currentDifficulty}
- Skill Self-Rating: {skillRating}/10

Adaptive Logic:
- Score > 85: Increase difficulty, use advanced concepts
- Score 60-85: Maintain difficulty, vary question types  
- Score < 60: Decrease difficulty, focus on fundamentals

Question Type Distribution: MCQ (25%), Code Snippet (25%), Code Completion (25%), Textual (25%)

{format_instructions}
`);

    this.adaptiveQuestionChain = RunnableSequence.from([
      adaptivePrompt,
      llm,
      questionParser,
    ]);
  }

  async evaluateResponse(
    question: string,
    response: string,
    expectedAnswer: string,
    topic: string,
    difficulty: string,
    questionType: QuestionType = 'textual'
  ): Promise<ResponseEvaluation> {
    try {
      const result = await this.evaluationChain.invoke({
        question,
        questionType,
        response,
        expectedAnswer,
        topic,
        difficulty,
        format_instructions: StructuredOutputParser.fromZodSchema(responseEvaluationSchema).getFormatInstructions(),
      });

      return result as ResponseEvaluation;
    } catch (error) {
      console.error('Error evaluating response:', error);
      // Fallback evaluation
      return {
        score: 50,
        feedback: 'Unable to evaluate response at this time. Please try again.',
        strengths: [],
        improvements: ['Please provide more detailed response'],
      };
    }
  }

  async generateQuestion(
    topic: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    skillRating: number,
    previousQuestions: string[] = []
  ): Promise<GeneratedQuestion> {
    try {
      const result = await this.questionGenerationChain.invoke({
        topic,
        difficulty,
        skillRating,
        previousQuestions: previousQuestions.join(', '),
        format_instructions: StructuredOutputParser.fromZodSchema(enhancedQuestionSchema).getFormatInstructions(),
      });

      return result as GeneratedQuestion;
    } catch (error) {
      console.error('Error generating question:', error);
      // Fallback question
      return {
        question: `Tell me about your experience with ${topic} and how you've used it in projects.`,
        expectedAnswer: `Should discuss practical experience, specific examples, and understanding of ${topic} concepts.`,
        difficulty,
        tags: [topic, 'experience', 'practical'],
        type: 'textual' as QuestionType,
      };
    }
  }

  async generateAdaptiveQuestion(
    topic: string,
    currentDifficulty: string,
    averageScore: number,
    recentScores: number[],
    skillRating: number
  ): Promise<GeneratedQuestion> {
    try {
      const result = await this.adaptiveQuestionChain.invoke({
        topic,
        currentDifficulty,
        averageScore,
        recentScores: recentScores.join(', '),
        skillRating,
        format_instructions: StructuredOutputParser.fromZodSchema(enhancedQuestionSchema).getFormatInstructions(),
      });

      return result as GeneratedQuestion;
    } catch (error) {
      console.error('Error generating adaptive question:', error);
      // Fallback to regular question generation
      return this.generateQuestion(topic, currentDifficulty as any, skillRating);
    }
  }
}