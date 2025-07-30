'use client'

import { useState } from 'react'
import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core'
import { CopilotTextarea } from '@copilotkit/react-textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bot, User, Send, Lightbulb, SkipForward } from 'lucide-react'

interface CopilotInterviewChatProps {
  currentQuestion: string
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
  focusedTechnology,
  onResponseSubmit,
  onHintRequest,
  onSkipQuestion,
  sessionProgress
}: CopilotInterviewChatProps) {
  const [response, setResponse] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Make interview context readable by Copilot
  useCopilotReadable({
    description: 'Current interview session context',
    value: {
      currentQuestion,
      focusedTechnology,
      progress: sessionProgress,
      interviewType: 'technical_interview'
    }
  })

  // Copilot action for getting hints
  useCopilotAction({
    name: 'getInterviewHint',
    description: 'Provide a helpful hint for the current interview question',
    parameters: [
      {
        name: 'question',
        type: 'string',
        description: 'The current interview question'
      },
      {
        name: 'technology',
        type: 'string',
        description: 'The technology being discussed'
      }
    ],
    handler: async ({ question, technology }) => {
      onHintRequest()
      return `Here's a hint for the ${technology} question: Consider breaking down the problem into smaller parts and think about real-world applications.`
    }
  })

  // Copilot action for improving responses
  useCopilotAction({
    name: 'improveInterviewResponse',
    description: 'Help improve the user\'s interview response',
    parameters: [
      {
        name: 'currentResponse',
        type: 'string',
        description: 'The user\'s current response draft'
      },
      {
        name: 'question',
        type: 'string',
        description: 'The interview question being answered'
      }
    ],
    handler: async ({ currentResponse, question }) => {
      return `Your response covers the basics well. Consider adding:
1. A specific example from your experience
2. Mention any challenges you faced and how you solved them
3. Discuss the trade-offs or alternatives you considered
4. Connect it to best practices in the industry`
    }
  })

  // Copilot action for technical explanations
  useCopilotAction({
    name: 'explainTechnicalConcept',
    description: 'Explain a technical concept in the context of an interview',
    parameters: [
      {
        name: 'concept',
        type: 'string',
        description: 'The technical concept to explain'
      },
      {
        name: 'level',
        type: 'string',
        description: 'The explanation level (beginner, intermediate, advanced)'
      }
    ],
    handler: async ({ concept, level }) => {
      return `Let me explain ${concept} at a ${level} level for your interview context...`
    }
  })

  const handleSubmit = async () => {
    if (!response.trim()) return
    
    setIsSubmitting(true)
    try {
      await onResponseSubmit(response)
      setResponse('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
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
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Current Question Display */}
        <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-start gap-3">
            <Bot className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <p className="font-medium text-blue-900 mb-1">Current Question:</p>
              <p className="text-blue-800">{currentQuestion}</p>
            </div>
          </div>
        </div>

        {/* Enhanced Response Input with Copilot */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Your Response:
            </label>
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
            </div>
          </div>

          <CopilotTextarea
            className="min-h-[200px] resize-none border-2 border-gray-200 focus:border-blue-400 rounded-lg p-4"
            value={response}
            onValueChange={setResponse}
            placeholder={`Share your thoughts about ${focusedTechnology || 'the question'}... 

💡 Pro tip: Ask me for help! I can:
- Provide hints for the current question
- Help improve your response
- Explain technical concepts
- Suggest examples to include

Just type something like "help me improve this response" or "explain [concept]"`}
            autosuggestionsConfig={{
              textareaPurpose: `You are helping a user answer an interview question about ${focusedTechnology || 'technology'}. The question is: "${currentQuestion}". 
              
              Provide helpful suggestions that:
              1. Help structure their response using STAR method (Situation, Task, Action, Result)
              2. Suggest specific technical details to include
              3. Recommend real-world examples
              4. Help explain complex concepts clearly
              5. Suggest best practices to mention
              
              Keep suggestions concise and interview-appropriate.`,
              chatApiConfigs: {
                suggestionsApiConfig: {
                  forwardedParams: {
                    max_tokens: 50,
                    stop: ['\n'],
                  },
                },
              },
            }}
          />

          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              💬 AI-powered suggestions available as you type
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!response.trim() || isSubmitting}
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
        </div>

        {/* Performance Indicator */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">AI Assistant Active</span>
          </div>
          <Badge variant="outline" className="text-xs">
            Avg Score: {sessionProgress.averageScore}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}