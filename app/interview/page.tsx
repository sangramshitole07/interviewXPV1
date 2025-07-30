'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import SkillRatingSlider from '@/components/interview/SkillRatingSlider'
import InterviewCanvas from '@/components/interview/InterviewCanvas'
import CopilotInterviewChat from '@/components/interview/CopilotInterviewChat'
import { CopilotPopup } from '@copilotkit/react-ui'
import { 
  Brain, 
  Send, 
  Mic, 
  MicOff, 
  Clock, 
  User,
  Bot,
  Code,
  MessageSquare,
  BarChart3,
  ArrowLeft,
  Volume2,
  Sparkles,
  Lightbulb,
  SkipForward,
  X,
  Maximize,
  Minimize,
  Palette,
  Settings
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { SkillRating } from '@/lib/interview/InterviewManager'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  metadata?: {
    score?: number
    topic?: string
    feedback?: string
    scores?: Record<string, number>
  }
}

interface InterviewState {
  phase: 'setup' | 'rating' | 'active' | 'completed'
  sessionId?: string
  currentQuestion?: any
  skillRatings: SkillRating[]
}

const interviewPersonas = [
  { id: 'professional', name: 'Professional HR', emoji: '🎩', description: 'Behavioral and cultural fit', gradient: 'from-blue-500 to-blue-600' },
  { id: 'wizard', name: 'Coding Wizard', emoji: '🧙‍♂️', description: 'Technical deep dives', gradient: 'from-purple-500 to-purple-600' },
  { id: 'ta', name: 'College TA', emoji: '🤓', description: 'Educational approach', gradient: 'from-green-500 to-green-600' },
  { id: 'recruiter', name: 'Tech Recruiter', emoji: '🤖', description: 'Real interview pressure', gradient: 'from-red-500 to-red-600' }
]

// Mock user technologies from onboarding
const userTechnologies = {
  languages: [
    { name: 'JavaScript', emoji: '💻', selected: true },
    { name: 'Python', emoji: '💻', selected: true },
    { name: 'TypeScript', emoji: '💻', selected: true },
    { name: 'Java', emoji: '💻', selected: false },
  ],
  frameworks: [
    { name: 'React', emoji: '⚡', selected: true },
    { name: 'Node.js', emoji: '⚡', selected: true },
    { name: 'Express', emoji: '⚡', selected: true },
    { name: 'Next.js', emoji: '⚡', selected: false },
  ],
  ai_tools: [
    { name: 'TensorFlow', emoji: '🧠', selected: true },
    { name: 'PyTorch', emoji: '🧠', selected: false },
    { name: 'Scikit-learn', emoji: '🧠', selected: true },
    { name: 'OpenAI API', emoji: '🧠', selected: false },
  ]
}


export default function InterviewPage() {
  const router = useRouter()
  const [interviewState, setInterviewState] = useState<InterviewState>({
    phase: 'setup',
    skillRatings: []
  })
  const [messages, setMessages] = useState<Message[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState(interviewPersonas[0])
  const [focusedTechnology, setFocusedTechnology] = useState<string | null>(null)
  const [sessionTime, setSessionTime] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [totalQuestions] = useState(10)
  const [isTyping, setIsTyping] = useState(false)
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [technologyScores, setTechnologyScores] = useState<Record<string, number>>({})
  const [showCodeEditor, setShowCodeEditor] = useState(false)
  const [showCanvas, setShowCanvas] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [isCodeEditorFullscreen, setIsCodeEditorFullscreen] = useState(false)
  const [isTypingIndicator, setIsTypingIndicator] = useState(false)
  const [sessionProgress, setSessionProgress] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  // Get filtered technologies based on user selection
  const getFilteredTechnologies = () => {
    const filtered: any = {}
    Object.entries(userTechnologies).forEach(([category, techs]) => {
      filtered[category] = techs.filter(tech => tech.selected)
    })
    return filtered
  }

  const filteredTechnologies = getFilteredTechnologies()

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (interviewState.phase === 'active') {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [interviewState.phase])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Poll for session progress
  useEffect(() => {
    if (interviewState.sessionId && interviewState.phase === 'active') {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/interview?action=getProgress&sessionId=${interviewState.sessionId}`)
          const data = await response.json()
          if (data.success) {
            setSessionProgress(data.progress)
            setTechnologyScores(data.progress.technologyScores)
            setCurrentQuestion(data.progress.currentQuestion)
          }
        } catch (error) {
          console.error('Error fetching progress:', error)
        }
      }, 2000)
      
      return () => clearInterval(interval)
    }
  }, [interviewState.sessionId, interviewState.phase])
  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setCurrentInput(transcript)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  const handleSkillRatings = (ratings: SkillRating[]) => {
    setInterviewState(prev => ({ ...prev, skillRatings: ratings }))
  }

  const startInterview = async () => {
    try {
      // Initialize interview session
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initialize',
          studentId: 'user_123', // In real app, get from auth
          skillRatings: interviewState.skillRatings,
          config: {
            totalQuestions: 10,
            adaptiveDifficulty: true,
            focusMode: true,
            allowVoiceInput: true,
            allowCanvasInput: true
          }
        })
      })

      const data = await response.json()
      if (data.success) {
        setInterviewState(prev => ({
          ...prev,
          phase: 'active',
          sessionId: data.session.sessionId
        }))

        // Get first question
        await getNextQuestion(data.session.sessionId)
        
        const welcomeMessage = `Hello! I'm your ${selectedPersona.name} interviewer ${selectedPersona.emoji}. I'll be conducting your mock interview today focusing on your selected technologies. Let's start!`
        
        setMessages([{
          id: '1',
          type: 'ai',
          content: welcomeMessage,
          timestamp: new Date()
        }])
        
        toast.success('Interview started! Good luck! 🚀')
      }
    } catch (error) {
      console.error('Error starting interview:', error)
      toast.error('Failed to start interview')
    }
  }

  const getNextQuestion = async (sessionId: string, focusedTech?: string) => {
    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getNextQuestion',
          sessionId,
          focusedTechnology: focusedTech
        })
      })

      const data = await response.json()
      if (data.success && data.question) {
        setInterviewState(prev => ({ ...prev, currentQuestion: data.question }))
        
        // Add question to messages
        const questionMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: data.question.question,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, questionMessage])
      }
    } catch (error) {
      console.error('Error getting next question:', error)
    }
  }

  const endInterview = async () => {
    if (!interviewState.sessionId) return

    try {
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'endSession',
          sessionId: interviewState.sessionId
        })
      })

      const data = await response.json()
      if (data.success) {
        setInterviewState(prev => ({ ...prev, phase: 'completed' }))
        
        const avgScore = sessionProgress?.averageScore || 0
        const completionRate = Math.round((currentQuestion / totalQuestions) * 100)
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'ai',
          content: `🎉 **Interview Completed!**\n\n📊 **Performance Summary:**\n• **Overall Score**: ${avgScore}%\n• **Questions Completed**: ${currentQuestion - 1}/${totalQuestions}\n• **Completion Rate**: ${completionRate}%\n• **Duration**: ${Math.floor(sessionTime / 60)}:${(sessionTime % 60).toString().padStart(2, '0')}\n\n**Technology Breakdown:**\n${Object.entries(technologyScores).map(([tech, score]) => `• ${tech}: ${score}%`).join('\n')}\n\n**Feedback**: ${avgScore >= 85 ? '🌟 Outstanding performance! You demonstrated excellent technical knowledge and communication skills.' : avgScore >= 70 ? '👍 Great job! You showed solid understanding. Focus on providing more detailed examples.' : avgScore >= 55 ? '📈 Good effort! Review the fundamentals and practice explaining concepts more clearly.' : '💪 Keep practicing! Focus on strengthening your core knowledge in the selected technologies.'}\n\n**Next Steps:**\n• Review your weak areas\n• Practice more coding problems\n• Schedule another mock interview\n\nWould you like to start a new interview or return to the dashboard?`,
          timestamp: new Date(),
          metadata: { score: avgScore }
        }])
        
        toast.success(`Interview completed! Overall score: ${avgScore}% 🎯`)
      }
    } catch (error) {
      console.error('Error ending interview:', error)
      toast.error('Failed to end interview')
    }
  }

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || currentInput
    if (!content.trim() || interviewState.phase !== 'active' || !interviewState.sessionId) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentInput('')
    setIsAiThinking(true)
    setIsTypingIndicator(true)

    try {
      // Submit response to backend
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submitResponse',
          sessionId: interviewState.sessionId,
          questionId: interviewState.currentQuestion?.id || 'current',
          response: content,
          responseType: 'text'
        })
      })

      const data = await response.json()
      if (data.success && data.evaluation) {
        // Add AI feedback
        const feedbackMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: `**Feedback:** ${data.evaluation.feedback}\n\n**Score:** ${data.evaluation.score}/100\n\n**Strengths:** ${data.evaluation.strengths.join(', ')}\n\n**Areas for Improvement:** ${data.evaluation.improvements.join(', ')}`,
          timestamp: new Date(),
          metadata: {
            score: data.evaluation.score,
            feedback: data.evaluation.feedback
          }
        }
        setMessages(prev => [...prev, feedbackMessage])

        // Get next question if not at the end
        if (currentQuestion < totalQuestions) {
          setTimeout(() => {
            getNextQuestion(interviewState.sessionId!, focusedTechnology || undefined)
          }, 2000)
        } else {
          // End interview
          setTimeout(() => {
            endInterview()
          }, 3000)
        }
      }
    } catch (error) {
      console.error('Error submitting response:', error)
      toast.error('Failed to submit response')
    } finally {
      setIsAiThinking(false)
      setIsTypingIndicator(false)
    }
  }

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start()
        setIsListening(true)
        toast.info('🎤 Listening... Speak now!')
      } else {
        toast.error('Speech recognition not supported in this browser')
      }
    }
  }

  const handleTechnologyFocus = async (techName: string) => {
    if (focusedTechnology === techName) {
      setFocusedTechnology(null)
      toast.info(`Removed focus from ${techName}`)
    } else {
      setFocusedTechnology(techName)
      toast.success(`🎯 Focused on ${techName}`)
      
      if (interviewState.phase === 'active' && interviewState.sessionId) {
        const focusMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: `Perfect! I'll now focus our discussion specifically on ${techName}. Let me ask you a targeted question about this technology.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, focusMessage])
        
        // Get focused question
        setTimeout(() => {
          getNextQuestion(interviewState.sessionId!, techName)
        }, 1000)
      }
    }
  }

  const handlePersonaSwitch = (persona: typeof interviewPersonas[0]) => {
    setSelectedPersona(persona)
    toast.success(`Switched to ${persona.name} ${persona.emoji}`)
    
    if (interviewState.phase === 'active') {
      const switchMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: `I've switched to ${persona.name} mode. My questioning style will now adapt to be more ${persona.description.toLowerCase()}. Let's continue!`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, switchMessage])
    }
  }

  const handleQuickAction = (action: 'hint' | 'skip' | 'end') => {
    switch (action) {
      case 'hint':
        if (interviewState.phase === 'active') {
          const hintMessage: Message = {
            id: Date.now().toString(),
            type: 'ai',
            content: `💡 **Hint**: Try to structure your answer using specific examples from your experience. Consider discussing the problem, your approach, the implementation, and the results. Don't forget to mention any challenges you faced and how you overcame them.`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, hintMessage])
          toast.success('Hint provided! 💡')
        }
        break
      case 'skip':
        if (interviewState.phase === 'active' && currentQuestion < totalQuestions && interviewState.sessionId) {
          setCurrentQuestion(prev => prev + 1)
          const skipMessage: Message = {
            id: Date.now().toString(),
            type: 'ai',
            content: `No problem! Let's move on to the next question. Here's something different for you to consider...`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, skipMessage])
          
          // Get next question
          setTimeout(() => {
            getNextQuestion(interviewState.sessionId!, focusedTechnology || undefined)
          }, 1000)
          
          toast.info('Question skipped ⏭️')
        }
        break
      case 'end':
        endInterview()
        break
    }
  }

  const handleCodeSubmission = () => {
    if (!codeInput.trim()) return
    
    const codeMessage = `\`\`\`\n${codeInput}\n\`\`\`\n\nPlease review my code implementation and provide feedback on the approach, efficiency, and best practices.`
    sendMessage(codeMessage)
    setCodeInput('')
    setShowCodeEditor(false)
    toast.success('Code submitted for review! 💻')
  }

  const handleCanvasSubmission = (canvasData: string) => {
    const canvasMessage = `I've drawn my solution on the canvas. Here's my visual explanation:\n\n[Canvas Drawing Submitted]\n\nPlease provide feedback on my approach and visual explanation.`
    sendMessage(canvasMessage)
    setShowCanvas(false)
    toast.success('Canvas response submitted! 🎨')
  }
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    return Math.round((currentQuestion / totalQuestions) * 100)
  }

  const getTechnologyScore = (techName: string) => {
    return technologyScores[techName] || 0
  }

  const renderTechnologyButton = (tech: any, category: 'languages' | 'frameworks' | 'ai_tools') => {
    const isFocused = focusedTechnology === tech.name
    const score = getTechnologyScore(tech.name)
    const categoryColors = {
      languages: 'from-blue-500 to-blue-600',
      frameworks: 'from-green-500 to-green-600',
      ai_tools: 'from-purple-500 to-purple-600'
    }

    return (
      <Button
        key={tech.name}
        variant={isFocused ? "default" : "outline"}
        className={`relative h-16 flex flex-col gap-1 transition-all duration-300 hover:scale-105 ${
          isFocused 
            ? `bg-gradient-to-r ${categoryColors[category]} text-white shadow-lg animate-pulse` 
            : 'hover:bg-gray-50'
        }`}
        onClick={() => handleTechnologyFocus(tech.name)}
        disabled={interviewState.phase !== 'active'}
      >
        <div className="flex items-center gap-1">
          <span>{tech.emoji}</span>
          <span className="font-semibold text-sm">{tech.name}</span>
        </div>
        {score > 0 && (
          <Badge variant="secondary" className="text-xs animate-bounce">
            {score}%
          </Badge>
        )}
        {isFocused && (
          <div className="absolute -top-2 -right-2">
            <Badge className="bg-orange-500 text-white animate-pulse">
              🎯 Focus
            </Badge>
          </div>
        )}
      </Button>
    )
  }

  const renderProgressDots = () => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: totalQuestions }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i < currentQuestion - 1
                ? 'bg-green-500 animate-pulse'
                : i === currentQuestion - 1
                ? 'bg-blue-500 animate-bounce'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  // Render skill rating phase
  if (interviewState.phase === 'rating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4">
          <SkillRatingSlider
            technologies={userTechnologies}
            onRatingsChange={handleSkillRatings}
            onComplete={startInterview}
          />
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Enhanced Sticky Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">AI Interview Mentor</span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Button variant="ghost" onClick={() => router.back()} className="text-gray-600 hover:text-blue-600 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              {interviewState.phase === 'active' && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">{formatTime(sessionTime)}</span>
                  </div>
                  <Badge variant="outline" className="animate-pulse">
                    Question {currentQuestion}/{totalQuestions}
                  </Badge>
                </div>
              )}
              <div className="flex items-center space-x-2">
                {interviewPersonas.map((persona) => (
                  <Button
                    key={persona.id}
                    variant={selectedPersona.id === persona.id ? "default" : "outline"}
                    size="sm"
                    className={`transition-all duration-300 hover:scale-105 ${
                      selectedPersona.id === persona.id 
                        ? `bg-gradient-to-r ${persona.gradient} text-white shadow-lg` 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handlePersonaSwitch(persona)}
                    disabled={interviewState.phase === 'setup'}
                  >
                    <span className="mr-1">{persona.emoji}</span>
                    <span className="hidden lg:inline">{persona.name}</span>
                  </Button>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Session Progress Bar - Only show when interview is active */}
      {interviewState.phase === 'active' && (
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Live Session
                </Badge>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Current Interviewer:</span>
                  <Badge variant="outline">
                    {selectedPersona.emoji} {selectedPersona.name}
                  </Badge>
                </div>
                {focusedTechnology && (
                  <Badge className="bg-orange-500 text-white animate-pulse">
                    🎯 Focused on {focusedTechnology}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {renderProgressDots()}
                <div className="w-32">
                  <Progress value={getProgressPercentage()} className="h-2" />
                  <span className="text-xs text-gray-600 ml-2">{getProgressPercentage()}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        {/* Setup Phase */}
        {interviewState.phase === 'setup' && (
          <div className="flex justify-center items-center min-h-[60vh]">
            <Card className="w-full max-w-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl flex items-center justify-center gap-2">
                  <Brain className="h-8 w-8 text-blue-600" />
                  AI Interview Setup
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  Let's configure your personalized interview experience
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4">Your Selected Technologies</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      ...filteredTechnologies.languages,
                      ...filteredTechnologies.frameworks,
                      ...filteredTechnologies.ai_tools
                    ].map((tech: any) => (
                      <Badge key={tech.name} variant="outline" className="p-2">
                        {tech.emoji} {tech.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button 
                    onClick={() => setInterviewState(prev => ({ ...prev, phase: 'rating' }))}
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Rate Your Skills & Start
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Technology Selection Panel */}
          <div className="lg:col-span-3">
            <Card className="bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm border-blue-200/50 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded animate-pulse">
                    <Code className="h-4 w-4 text-white" />
                  </div>
                  Your Technologies
                  {focusedTechnology && (
                    <Badge className="bg-orange-500 animate-bounce">
                      🎯 {focusedTechnology}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Programming Languages */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm flex items-center gap-1">
                      💻 Languages
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {filteredTechnologies.languages.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredTechnologies.languages.map((tech: any) => 
                      renderTechnologyButton(tech, 'languages')
                    )}
                  </div>
                </div>

                {/* Frameworks */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm flex items-center gap-1">
                      ⚡ Frameworks
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {filteredTechnologies.frameworks.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredTechnologies.frameworks.map((tech: any) => 
                      renderTechnologyButton(tech, 'frameworks')
                    )}
                  </div>
                </div>

                {/* AI Tools */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm flex items-center gap-1">
                      🧠 AI Tools
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {filteredTechnologies.ai_tools.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredTechnologies.ai_tools.map((tech: any) => 
                      renderTechnologyButton(tech, 'ai_tools')
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Interface */}
          <div className="lg:col-span-6">
            {interviewState.phase === 'active' ? (
              <CopilotInterviewChat
                currentQuestion={interviewState.currentQuestion?.question ? interviewState.currentQuestion.question : 'Loading next question...'}
                focusedTechnology={focusedTechnology || undefined}
                onResponseSubmit={sendMessage}
                onHintRequest={() => handleQuickAction('hint')}
                onSkipQuestion={() => handleQuickAction('skip')}
                sessionProgress={{
                  currentQuestion,
                  totalQuestions,
                  averageScore: sessionProgress?.averageScore || 0
                }}
              />
            ) : (
              <Card className="h-[calc(100vh-200px)] flex flex-col bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm shadow-xl">
                <CardHeader className="flex-shrink-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-bounce">
                          <Bot className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {selectedPersona.emoji} {selectedPersona.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          Ready to start
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center py-12">
                    <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-16 h-16 mx-auto mb-4 animate-pulse">
                      <Brain className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Begin?</h3>
                    <p className="text-gray-600 mb-6">
                      Your personalized AI interview session is ready. Click "Start Interview" to begin!
                    </p>
                    <Button 
                      onClick={() => setInterviewState(prev => ({ ...prev, phase: 'rating' }))} 
                      size="lg" 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 animate-pulse"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Rate Skills & Start
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Performance Dashboard & Quick Actions */}
          <div className="lg:col-span-3 space-y-6">
            {/* Real-time Performance */}
            <Card className="bg-gradient-to-br from-white to-green-50/50 backdrop-blur-sm border-green-200/50 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Languages Performance */}
                <div>
                  <h3 className="font-medium text-sm mb-2 flex items-center gap-1">
                    💻 Languages
                  </h3>
                  <div className="space-y-2">
                    {filteredTechnologies.languages.map((tech: any) => {
                      const score = getTechnologyScore(tech.name)
                      return (
                        <div key={tech.name} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{tech.name}</span>
                            <span className={score > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                              {score > 0 ? `${score}%` : 'Not tested'}
                            </span>
                          </div>
                          <Progress value={score} className="h-1.5" />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Frameworks Performance */}
                <div>
                  <h3 className="font-medium text-sm mb-2 flex items-center gap-1">
                    ⚡ Frameworks
                  </h3>
                  <div className="space-y-2">
                    {filteredTechnologies.frameworks.map((tech: any) => {
                      const score = getTechnologyScore(tech.name)
                      return (
                        <div key={tech.name} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{tech.name}</span>
                            <span className={score > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>
                              {score > 0 ? `${score}%` : 'Not tested'}
                            </span>
                          </div>
                          <Progress value={score} className="h-1.5" />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* AI Tools Performance */}
                <div>
                  <h3 className="font-medium text-sm mb-2 flex items-center gap-1">
                    🧠 AI Tools
                  </h3>
                  <div className="space-y-2">
                    {filteredTechnologies.ai_tools.map((tech: any) => {
                      const score = getTechnologyScore(tech.name)
                      return (
                        <div key={tech.name} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{tech.name}</span>
                            <span className={score > 0 ? 'text-purple-600 font-medium' : 'text-gray-400'}>
                              {score > 0 ? `${score}%` : 'Not tested'}
                            </span>
                          </div>
                          <Progress value={score} className="h-1.5" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gradient-to-br from-white to-orange-50/50 backdrop-blur-sm border-orange-200/50 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => handleQuickAction('hint')}
                  variant="outline" 
                  className="w-full justify-start transition-all duration-300 hover:scale-105 hover:bg-yellow-50 hover:border-yellow-300"
                  disabled={interviewState.phase !== 'active'}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  💡 Get a Hint
                </Button>
                
                <Button 
                  onClick={() => handleQuickAction('skip')}
                  variant="outline" 
                  className="w-full justify-start transition-all duration-300 hover:scale-105 hover:bg-orange-50 hover:border-orange-300"
                  disabled={interviewState.phase !== 'active' || currentQuestion >= totalQuestions}
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  ⏭️ Skip Question
                </Button>
                
                <Button 
                  onClick={() => handleQuickAction('end')}
                  variant="outline" 
                  className="w-full justify-start transition-all duration-300 hover:scale-105 hover:bg-red-50 hover:border-red-300"
                  disabled={interviewState.phase !== 'active'}
                >
                  <X className="h-4 w-4 mr-2" />
                  🔚 End Session
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CopilotKit Popup for additional AI assistance */}
      <CopilotPopup
        instructions="You are an AI interview coach helping users practice for technical interviews. Provide helpful, encouraging feedback and suggestions. Help users structure their responses, explain technical concepts, and build confidence."
        labels={{
          title: "AI Interview Coach",
          initial: "Hi! I'm your AI interview coach. I can help you practice answers, explain concepts, or give you tips for your interview. How can I assist you today?",
        }}
      />

      {/* Canvas Modal */}
      <InterviewCanvas
        isVisible={showCanvas}
        onClose={() => setShowCanvas(false)}
        onSubmit={handleCanvasSubmission}
        question={interviewState.currentQuestion?.question || 'Current interview question'}
      />
      {/* Code Editor Modal */}
      <Dialog open={showCodeEditor} onOpenChange={setShowCodeEditor}>
        <DialogContent className={`${isCodeEditorFullscreen ? 'max-w-full h-full' : 'max-w-4xl'} transition-all duration-300`}>
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Code Editor
              {focusedTechnology && (
                <Badge variant="outline">{focusedTechnology}</Badge>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCodeEditorFullscreen(!isCodeEditorFullscreen)}
              >
                {isCodeEditorFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              placeholder={`Write your ${focusedTechnology || 'code'} solution here...`}
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              className={`font-mono ${isCodeEditorFullscreen ? 'min-h-[60vh]' : 'min-h-[300px]'} resize-none`}
            />
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCodeEditor(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCodeSubmission}
                disabled={!codeInput.trim()}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Code
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}