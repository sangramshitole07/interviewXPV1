'use client'

import { useState, useEffect } from 'react'
import { useCopilotAction, useCopilotReadable, useCopilotChat } from '@copilotkit/react-core'
import { CopilotTextarea } from '@copilotkit/react-textarea'
import { CopilotChat } from '@copilotkit/react-ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Bot, User, Send, Lightbulb, SkipForward, Code, CheckCircle, MessageSquare } from 'lucide-react'

interface QuestionData {
  question: string
  type: 'mcq' | 'code_snippet' | 'code_completion' | 'textual' | 'rating'
  options?: string[]
  codeSnippet?: string
  expectedCompletion?: string
  difficulty: string
  tags: string[]
}

interface CopilotInterviewChatProps {
  currentQuestion: string
  questionData?: QuestionData
  focusedTechnology?: string
  onResponseSubmit: (response: string) => void
  onHintRequest: () => void
  onSkipQuestion: () => void
  sessionProgress: {
    currentQuestion: number
    totalQuestions: number
    averageScore: number
  }
}

export default function CopilotInterviewChat({
  currentQuestion,
  questionData,
  focusedTechnology,
  onResponseSubmit,
  onHintRequest,
  onSkipQuestion,
  sessionProgress
}: CopilotInterviewChatProps) {
  const [response, setResponse] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMCQOption, setSelectedMCQOption] = useState<string>('')
  const [showCopilotChat, setShowCopilotChat] = useState(false)

  // Make interview context readable by Copilot
  useCopilotReadable({
    description: 'Current interview session context and question details',
    value: {
      currentQuestion,
      questionData,
      focusedTechnology,
      progress: sessionProgress,
      interviewType: 'technical_interview',
      questionType: questionData?.type || 'textual'
    }
  })

  // Copilot action for MCQ assistance
  useCopilotAction({
    name: 'helpWithMCQ',
    description: 'Provide hints for multiple choice questions without giving away the answer',
    parameters: [
      {
        name: 'question',
        type: 'string',
        description: 'The MCQ question'
      },
      {
        name: 'options',
        type: 'string',
        description: 'The available options'
      }
    ],
    handler: async ({ question, options }) => {
      return `For this multiple choice question, consider:
1. Read each option carefully
2. Eliminate obviously incorrect answers first
3. Look for keywords in the question that match the options
4. Think about the fundamental concepts being tested
5. Consider edge cases or common misconceptions

The question is testing your understanding of core concepts in ${focusedTechnology}.`
    }
  })

  // Copilot action for code completion assistance
  useCopilotAction({
    name: 'helpWithCodeCompletion',
    description: 'Provide guidance for code completion questions',
    parameters: [
      {
        name: 'codeSnippet',
        type: 'string',
        description: 'The partial code snippet'
      },
      {
        name: 'technology',
        type: 'string',
        description: 'The programming language or technology'
      }
    ],
    handler: async ({ codeSnippet, technology }) => {
      return `For this code completion in ${technology}:
1. Analyze the existing code structure and patterns
2. Consider the variable types and function signatures
3. Think about what the code is trying to accomplish
4. Follow the established coding style and conventions
5. Consider error handling and edge cases

Look at the context clues in the surrounding code to determine the expected completion.`
    }
  })

  // Copilot action for code snippet analysis
  useCopilotAction({
    name: 'analyzeCodeSnippet',
    description: 'Help analyze and debug code snippets',
    parameters: [
      {
        name: 'code',
        type: 'string',
        description: 'The code snippet to analyze'
      }
    ],
    handler: async ({ code }) => {
      return `When analyzing this code snippet:
1. Trace through the execution step by step
2. Look for potential bugs or issues
3. Consider the input/output behavior
4. Check for syntax errors or logical problems
5. Think about performance implications
6. Consider best practices and code quality

Focus on understanding what the code does and identifying any issues.`
    }
  })

  // Copilot action for generating code examples
  useCopilotAction({
    name: 'generateCodeExample',
    description: 'Generate relevant code examples for the current topic',
    parameters: [
      {
        name: 'topic',
        type: 'string',
        description: 'The technology or concept to demonstrate'
      },
      {
        name: 'difficulty',
        type: 'string',
        description: 'The difficulty level'
      }
    ],
    handler: async ({ topic, difficulty }) => {
      return `I can help you understand ${topic} concepts with examples. Consider:
1. Start with basic syntax and structure
2. Show practical use cases
3. Demonstrate best practices
4. Include error handling where appropriate
5. Explain the reasoning behind the implementation

Would you like me to explain any specific aspect of ${topic}?`
    }
  })

  const handleSubmit = async () => {
    let finalResponse = response

    // Handle different question types
    if (questionData?.type === 'mcq' && selectedMCQOption) {
      finalResponse = `Selected option: ${selectedMCQOption}`
    }

    if (!finalResponse.trim()) return
    
    setIsSubmitting(true)
    try {
      await onResponseSubmit(finalResponse)
      setResponse('')
      setSelectedMCQOption('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderQuestionInterface = () => {
    if (!questionData) return null

    switch (questionData.type) {
      case 'mcq':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium text-blue-900 mb-1">Multiple Choice Question:</p>
                  <p className="text-blue-800">{questionData.question}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="font-medium text-gray-700">Select your answer:</p>
              {questionData.options?.map((option, index) => (
                <Button
                  key={index}
                  variant={selectedMCQOption === option ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto p-4"
                  onClick={() => setSelectedMCQOption(option)}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )

      case 'code_snippet':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <div className="flex items-start gap-3">
                <Code className="h-5 w-5 text-purple-600 mt-1" />
                <div>
                  <p className="font-medium text-purple-900 mb-1">Code Analysis Question:</p>
                  <p className="text-purple-800">{questionData.question}</p>
                </div>
              </div>
            </div>
            
            {questionData.codeSnippet && (
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
                  <code>{questionData.codeSnippet}</code>
                </pre>
              </div>
            )}
          </div>
        )

      case 'code_completion':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="flex items-start gap-3">
                <Code className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-green-900 mb-1">Code Completion:</p>
                  <p className="text-green-800">{questionData.question}</p>
                </div>
              </div>
            </div>
            
            {questionData.codeSnippet && (
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
                  <code>{questionData.codeSnippet}</code>
                </pre>
                <div className="mt-2 text-yellow-400 text-sm">
                  // Complete the code above
                </div>
              </div>
            )}
          </div>
        )

      case 'rating':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-orange-600 mt-1" />
                <div>
                  <p className="font-medium text-orange-900 mb-1">Self Assessment:</p>
                  <p className="text-orange-800">{questionData.question}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-6 gap-2">
              {questionData.options?.slice(0, 10).map((option, index) => (
                <Button
                  key={index}
                  variant={selectedMCQOption === option ? "default" : "outline"}
                  className="aspect-square"
                  onClick={() => setSelectedMCQOption(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
            
            {questionData.options?.includes('Skip Subject') && (
              <Button
                variant={selectedMCQOption === 'Skip Subject' ? "destructive" : "outline"}
                className="w-full"
                onClick={() => setSelectedMCQOption('Skip Subject')}
              >
                Skip This Subject
              </Button>
            )}
          </div>
        )

      default:
        return (
          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <p className="font-medium text-blue-900 mb-1">Interview Question:</p>
                <p className="text-blue-800">{questionData.question}</p>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Question Display */}
      <Card className="flex-shrink-0">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              AI Interview Assistant
            </CardTitle>
            <div className="flex items-center gap-2">
              {focusedTechnology && (
                <Badge className="bg-orange-500 text-white">
                  🎯 {focusedTechnology}
                </Badge>
              )}
              <Badge variant="outline">
                Q{sessionProgress.currentQuestion}/{sessionProgress.totalQuestions}
              </Badge>
              <Badge variant="secondary">
                {questionData?.type?.toUpperCase() || 'TEXT'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderQuestionInterface()}
        </CardContent>
      </Card>

      {/* Response Interface */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Your Response:</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onHintRequest}
                className="text-xs"
              >
                <Lightbulb className="h-3 w-3 mr-1" />
                Hint
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onSkipQuestion}
                className="text-xs"
              >
                <SkipForward className="h-3 w-3 mr-1" />
                Skip
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCopilotChat(!showCopilotChat)}
                className="text-xs"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                AI Chat
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Copilot Chat Interface */}
          {showCopilotChat && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <CopilotChat
                instructions={`You are an AI interview coach helping with ${focusedTechnology || 'technical'} interview questions. 
                Current question type: ${questionData?.type || 'textual'}
                Question: ${currentQuestion}
                
                Provide helpful guidance without giving direct answers. Help the user think through the problem, understand concepts, and structure their response effectively.`}
                labels={{
                  title: "Interview Coach",
                  initial: `Hi! I'm here to help you with this ${questionData?.type || 'interview'} question about ${focusedTechnology}. I can provide hints, explain concepts, or help you structure your answer. What would you like help with?`,
                }}
                className="h-64"
              />
            </div>
          )}

          {/* Response Input */}
          {questionData?.type !== 'mcq' && questionData?.type !== 'rating' && (
            <div className="flex-1">
              <CopilotTextarea
                className="min-h-[150px] resize-none border-2 border-gray-200 focus:border-blue-400 rounded-lg p-4"
                value={response}
                onValueChange={setResponse}
                placeholder={`${questionData?.type === 'code_completion' 
                  ? 'Complete the code above...' 
                  : questionData?.type === 'code_snippet'
                  ? 'Analyze the code and explain what it does, any issues, or improvements...'
                  : `Share your thoughts about ${focusedTechnology || 'the question'}...`}

💡 Pro tip: I can help you with:
- Structuring your response
- Explaining technical concepts  
- Providing code examples
- Suggesting improvements

Just ask me for help!`}
                autosuggestionsConfig={{
                  textareaPurpose: `Help the user answer a ${questionData?.type || 'technical'} interview question about ${focusedTechnology}. 
                  Question: "${currentQuestion}"
                  
                  Provide suggestions that:
                  1. Help structure responses using best practices
                  2. Suggest technical details and examples
                  3. Recommend industry standards and patterns
                  4. Help explain concepts clearly
                  5. Suggest code snippets when appropriate
                  
                  Keep suggestions concise and interview-appropriate.`,
                  chatApiConfigs: {
                    suggestionsApiConfig: {
                      forwardedParams: {
                        max_tokens: 100,
                      },
                    },
                  },
                }}
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              AI-powered suggestions active
            </div>
            <Button
              onClick={handleSubmit}
              disabled={
                (!response.trim() && !selectedMCQOption) || isSubmitting
              }
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Response
                </>
              )}
            </Button>
          </div>

          {/* Performance Indicator */}
          <Separator />
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Session Progress: {sessionProgress.currentQuestion}/{sessionProgress.totalQuestions}</span>
            <Badge variant="outline">
              Avg Score: {sessionProgress.averageScore}%
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}