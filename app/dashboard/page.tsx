'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Brain, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  Award, 
  Target,
  PlayCircle,
  BarChart3,
  History,
  Settings,
  User
} from 'lucide-react'
import Link from 'next/link'

const mockUserData = {
  name: 'John Doe',
  totalInterviews: 12,
  averageScore: 85,
  improvementRate: 23,
  strongestSkill: 'JavaScript',
  weakestSkill: 'System Design',
  recentSessions: [
    { id: 1, date: '2025-01-08', score: 88, duration: '45 min', topic: 'JavaScript & React' },
    { id: 2, date: '2025-01-06', score: 82, duration: '38 min', topic: 'System Design' },
    { id: 3, date: '2025-01-04', score: 90, duration: '42 min', topic: 'Data Structures' },
  ],
  skillProgress: [
    { skill: 'JavaScript', current: 90, target: 95 },
    { skill: 'Python', current: 85, target: 90 },
    { skill: 'System Design', current: 65, target: 80 },
    { skill: 'Algorithms', current: 88, target: 95 },
  ],
  weeklyProgress: [
    { week: 'Week 1', score: 72 },
    { week: 'Week 2', score: 78 },
    { week: 'Week 3', score: 85 },
    { week: 'Week 4', score: 88 },
  ]
}

const interviewTypes = [
  {
    title: 'Quick Practice',
    description: '15-20 minutes focused session',
    duration: '15-20 min',
    icon: PlayCircle,
    color: 'bg-green-500',
    href: '/interview'
  },
  {
    title: 'Full Mock Interview',
    description: 'Complete 45-60 minute interview simulation',
    duration: '45-60 min',
    icon: MessageSquare,
    color: 'bg-blue-500',
    href: '/interview'
  },
  {
    title: 'System Design',
    description: 'Focus on architecture and system design',
    duration: '30-45 min',
    icon: Brain,
    color: 'bg-purple-500',
    href: '/interview'
  },
  {
    title: 'Behavioral',
    description: 'Soft skills and cultural fit questions',
    duration: '20-30 min',
    icon: User,
    color: 'bg-orange-500',
    href: '/interview'
  }
]

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">AI Interview Mentor</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {mockUserData.name.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="text-sm font-medium text-gray-700">{mockUserData.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {mockUserData.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600">Ready to practice your next interview?</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Interviews</p>
                  <p className="text-3xl font-bold text-gray-900">{mockUserData.totalInterviews}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-3xl font-bold text-gray-900">{mockUserData.averageScore}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Improvement</p>
                  <p className="text-3xl font-bold text-gray-900">+{mockUserData.improvementRate}%</p>
                </div>
                <Award className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Strongest Skill</p>
                  <p className="text-lg font-bold text-gray-900">{mockUserData.strongestSkill}</p>
                </div>
                <Target className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Interview Options */}
          <div className="lg:col-span-2">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Start New Interview</CardTitle>
                <CardDescription>
                  Choose the type of interview you'd like to practice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {interviewTypes.map((type, index) => (
                    <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className={`p-3 rounded-lg ${type.color}`}>
                            <type.icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{type.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {type.duration}
                            </Badge>
                          </div>
                        </div>
                        <Button asChild className="w-full mt-4">
                          <Link href={type.href}>Start Interview</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tabs for detailed views */}
            <Tabs defaultValue="progress" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="progress" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Skill Progress</CardTitle>
                    <CardDescription>Track your improvement across different skills</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mockUserData.skillProgress.map((skill, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{skill.skill}</span>
                          <span className="text-gray-600">{skill.current}% / {skill.target}%</span>
                        </div>
                        <Progress value={skill.current} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Sessions</CardTitle>
                    <CardDescription>Your latest interview practice sessions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockUserData.recentSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{session.topic}</h4>
                            <p className="text-sm text-gray-600">{session.date}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              <Badge variant={session.score >= 80 ? "default" : "secondary"}>
                                {session.score}%
                              </Badge>
                              <span className="text-sm text-gray-600">{session.duration}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Analytics</CardTitle>
                    <CardDescription>Detailed insights into your interview performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-4">Weekly Progress</h4>
                        <div className="space-y-3">
                          {mockUserData.weeklyProgress.map((week, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-sm">{week.week}</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${week.score}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{week.score}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Quick Actions & Tips */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/interview">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Quick 15min Practice
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/profile">
                    <User className="h-4 w-4 mr-2" />
                    Update Profile
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/analytics">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Today's Tip</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    💡 <strong>Practice the STAR method</strong> for behavioral questions: 
                    Situation, Task, Action, Result. This structure helps you give 
                    comprehensive and organized answers.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Areas to Improve</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">System Design</span>
                    <Badge variant="destructive">Needs Work</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database Design</span>
                    <Badge variant="secondary">Fair</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Algorithms</span>
                    <Badge variant="default">Good</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}