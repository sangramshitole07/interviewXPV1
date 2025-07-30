'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Brain, Code, MessageSquare, TrendingUp, Upload, User, Zap } from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Interviews',
    description: 'Advanced AI that adapts to your skill level and provides personalized feedback'
  },
  {
    icon: Code,
    title: 'Multi-Language Support',
    description: 'Practice with Java, Python, JavaScript, C++, and more programming languages'
  },
  {
    icon: MessageSquare,
    title: 'Interactive Sessions',
    description: 'Engage in realistic conversations with multiple interviewer personas'
  },
  {
    icon: TrendingUp,
    title: 'Performance Analytics',
    description: 'Track your progress with detailed analytics and improvement suggestions'
  }
]

const personas = [
  { name: 'Professional HR', emoji: '🎩', description: 'Behavioral and cultural fit questions' },
  { name: 'Coding Wizard', emoji: '🧙‍♂️', description: 'Deep technical and algorithmic challenges' },
  { name: 'College TA', emoji: '🤓', description: 'Educational and concept-focused approach' },
  { name: 'Strict Recruiter', emoji: '🤖', description: 'Real-world interview pressure simulation' }
]

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">AI Interview Mentor</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">
              How it Works
            </Link>
            <Button asChild>
              <Link href="/onboarding">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Master Your Next
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {' '}Tech Interview
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Practice with our AI-powered mock interviewer that adapts to your skills, 
            provides real-time feedback, and helps you land your dream job.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/onboarding">
                Start Mock Interview
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              <Link href="/demo">
                Watch Demo
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to ace your technical interviews with confidence
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4 mx-auto">
                  <feature.icon className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Personas Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Interviewer</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Practice with different interviewer personalities to prepare for any situation
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {personas.map((persona, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="text-center">
                  <div className="text-4xl mb-2">{persona.emoji}</div>
                  <CardTitle className="text-lg">{persona.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {persona.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get started in just a few simple steps
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Profile Setup',
              description: 'Tell us about your skills and upload your CV for personalized interviews',
              icon: User
            },
            {
              step: '02',
              title: 'Practice Sessions',
              description: 'Engage in realistic mock interviews with adaptive AI questioning',
              icon: MessageSquare
            },
            {
              step: '03',
              title: 'Get Feedback',
              description: 'Receive detailed performance analysis and improvement suggestions',
              icon: TrendingUp
            }
          ].map((step, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-2xl font-bold mb-6">
                {step.step}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of developers who have improved their interview skills with AI Interview Mentor
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-6">
            <Link href="/onboarding">
              Start Your Journey
              <Zap className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Brain className="h-6 w-6" />
              <span className="text-xl font-bold">AI Interview Mentor</span>
            </div>
            <div className="text-gray-400">
              © 2025 AI Interview Mentor. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}