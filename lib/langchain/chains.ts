import { ChatGroq } from '@langchain/groq';
import { PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

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

export type ResponseEvaluation = z.infer<typeof responseEvaluationSchema>;

// Question generation schema
const questionGenerationSchema = z.object({
  question: z.string().describe('The interview question'),
  expectedAnswer: z.string().describe('Key points expected in a good answer'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe('Question difficulty level'),
  tags: z.array(z.string()).describe('Relevant tags for the question'),
});

export type GeneratedQuestion = z.infer<typeof questionGenerationSchema>;

export class InterviewChains {
  private evaluationChain: RunnableSequence;
  private questionGenerationChain: RunnableSequence;
  private adaptiveQuestionChain: RunnableSequence;

  constructor() {
    // Response evaluation chain
    const evaluationParser = StructuredOutputParser.fromZodSchema(responseEvaluationSchema);
    const evaluationPrompt = PromptTemplate.fromTemplate(`
You are an expert technical interviewer evaluating a candidate's response to an interview question.

Question: {question}
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
    const questionParser = StructuredOutputParser.fromZodSchema(questionGenerationSchema);
    const questionPrompt = PromptTemplate.fromTemplate(`
Generate a {difficulty} level interview question for {topic}.

Requirements:
- Question should be appropriate for {difficulty} level
- Focus on {topic} specifically
- Include practical application if possible
- Avoid overly theoretical questions for beginner level
- For advanced level, include system design or complex scenarios

Previous questions asked: {previousQuestions}
Student's skill level in {topic}: {skillRating}/10

{format_instructions}
`);

    this.questionGenerationChain = RunnableSequence.from([
      questionPrompt,
      llm,
      questionParser,
    ]);

    // Adaptive question chain (adjusts difficulty based on performance)
    const adaptivePrompt = PromptTemplate.fromTemplate(`
Based on the student's performance history, generate the next appropriate question.

Student Performance Summary:
- Average Score: {averageScore}
- Recent Scores: {recentScores}
- Current Topic: {topic}
- Current Difficulty: {currentDifficulty}
- Skill Self-Rating: {skillRating}/10

Performance Analysis:
- If average score > 85: Increase difficulty or introduce advanced concepts
- If average score 60-85: Maintain current difficulty, vary question types
- If average score < 60: Decrease difficulty or provide foundational questions

Generate an appropriate next question that challenges the student appropriately.

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
    difficulty: string
  ): Promise<ResponseEvaluation> {
    try {
      const result = await this.evaluationChain.invoke({
        question,
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
        format_instructions: StructuredOutputParser.fromZodSchema(questionGenerationSchema).getFormatInstructions(),
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
        format_instructions: StructuredOutputParser.fromZodSchema(questionGenerationSchema).getFormatInstructions(),
      });

      return result as GeneratedQuestion;
    } catch (error) {
      console.error('Error generating adaptive question:', error);
      // Fallback to regular question generation
      return this.generateQuestion(topic, currentDifficulty as any, skillRating);
    }
  }
}