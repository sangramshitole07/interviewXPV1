import weaviate from 'weaviate-ts-client';
import type { WeaviateClient } from 'weaviate-ts-client';

let client: WeaviateClient | null = null;

export function getWeaviateClient(): WeaviateClient {
  if (!client) {
    client = weaviate.client({
      scheme: 'https',
      host: process.env.WEAVIATE_URL?.replace('https://', '') || 'localhost:8080',
      apiKey: process.env.WEAVIATE_API_KEY ? new weaviate.ApiKey(process.env.WEAVIATE_API_KEY) : undefined,
      headers: {
        ...(process.env.GROQ_API_KEY && { 'X-Groq-Api-Key': process.env.GROQ_API_KEY }),
      },
    });
  }
  return client;
}

export interface InterviewQuestion {
  id: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  question: string;
  expectedAnswer?: string;
  tags: string[];
  category: 'technical' | 'behavioral' | 'system_design';
}

export interface StudentResponse {
  studentId: string;
  questionId: string;
  response: string;
  score: number;
  feedback: string;
  timestamp: Date;
  responseType: 'text' | 'voice' | 'canvas';
}

export class WeaviateService {
  private client: WeaviateClient;

  constructor() {
    this.client = getWeaviateClient();
  }

  async initializeSchema() {
    try {
      // Create InterviewQuestions class
      const questionSchema = {
        class: 'InterviewQuestion',
        description: 'Interview questions with difficulty and topic information',
        properties: [
          {
            name: 'topic',
            dataType: ['text'],
            description: 'The topic/technology this question covers'
          },
          {
            name: 'difficulty',
            dataType: ['text'],
            description: 'Difficulty level: beginner, intermediate, advanced'
          },
          {
            name: 'question',
            dataType: ['text'],
            description: 'The actual interview question'
          },
          {
            name: 'expectedAnswer',
            dataType: ['text'],
            description: 'Expected answer or key points'
          },
          {
            name: 'tags',
            dataType: ['text[]'],
            description: 'Tags for categorization'
          },
          {
            name: 'category',
            dataType: ['text'],
            description: 'Question category: technical, behavioral, system_design'
          }
        ],
        vectorizer: 'text2vec-openai'
      };

      // Create StudentResponses class
      const responseSchema = {
        class: 'StudentResponse',
        description: 'Student responses to interview questions with scores and feedback',
        properties: [
          {
            name: 'studentId',
            dataType: ['text'],
            description: 'Unique identifier for the student'
          },
          {
            name: 'questionId',
            dataType: ['text'],
            description: 'Reference to the interview question'
          },
          {
            name: 'response',
            dataType: ['text'],
            description: 'Student\'s response to the question'
          },
          {
            name: 'score',
            dataType: ['number'],
            description: 'Score given to the response (0-100)'
          },
          {
            name: 'feedback',
            dataType: ['text'],
            description: 'Detailed feedback on the response'
          },
          {
            name: 'responseType',
            dataType: ['text'],
            description: 'Type of response: text, voice, canvas'
          }
        ],
        vectorizer: 'text2vec-openai'
      };

      await this.client.schema.classCreator().withClass(questionSchema).do();
      await this.client.schema.classCreator().withClass(responseSchema).do();
      
      console.log('Weaviate schema initialized successfully');
    } catch (error) {
      console.error('Error initializing Weaviate schema:', error);
    }
  }

  async storeQuestion(question: InterviewQuestion) {
    try {
      const result = await this.client.data
        .creator()
        .withClassName('InterviewQuestion')
        .withProperties({
          topic: question.topic,
          difficulty: question.difficulty,
          question: question.question,
          expectedAnswer: question.expectedAnswer,
          tags: question.tags,
          category: question.category
        })
        .do();
      
      return result;
    } catch (error) {
      console.error('Error storing question:', error);
      throw error;
    }
  }

  async getQuestionsByTopicAndDifficulty(topic: string, difficulty: string, limit: number = 5) {
    try {
      const result = await this.client.graphql
        .get()
        .withClassName('InterviewQuestion')
        .withFields('topic difficulty question expectedAnswer tags category')
        .withWhere({
          operator: 'And',
          operands: [
            {
              path: ['topic'],
              operator: 'Equal',
              valueText: topic
            },
            {
              path: ['difficulty'],
              operator: 'Equal',
              valueText: difficulty
            }
          ]
        })
        .withLimit(limit)
        .do();

      return result.data?.Get?.InterviewQuestion || [];
    } catch (error) {
      console.error('Error fetching questions:', error);
      return [];
    }
  }

  async storeStudentResponse(response: StudentResponse) {
    try {
      const result = await this.client.data
        .creator()
        .withClassName('StudentResponse')
        .withProperties({
          studentId: response.studentId,
          questionId: response.questionId,
          response: response.response,
          score: response.score,
          feedback: response.feedback,
          responseType: response.responseType
        })
        .do();
      
      return result;
    } catch (error) {
      console.error('Error storing student response:', error);
      throw error;
    }
  }

  async getStudentHistory(studentId: string, limit: number = 20) {
    try {
      const result = await this.client.graphql
        .get()
        .withClassName('StudentResponse')
        .withFields('questionId response score feedback responseType')
        .withWhere({
          path: ['studentId'],
          operator: 'Equal',
          valueText: studentId
        })
        .withLimit(limit)
        .do();

      return result.data?.Get?.StudentResponse || [];
    } catch (error) {
      console.error('Error fetching student history:', error);
      return [];
    }
  }

  async searchSimilarQuestions(queryText: string, topic?: string, limit: number = 5) {
    try {
      let whereClause = undefined;
      if (topic) {
        whereClause = {
          path: ['topic'],
          operator: 'Equal',
          valueText: topic
        };
      }

      const result = await this.client.graphql
        .get()
        .withClassName('InterviewQuestion')
        .withFields('topic difficulty question expectedAnswer tags category')
        .withNearText({ concepts: [queryText] })
        .withWhere(whereClause)
        .withLimit(limit)
        .do();

      return result.data?.Get?.InterviewQuestion || [];
    } catch (error) {
      console.error('Error searching similar questions:', error);
      return [];
    }
  }
}