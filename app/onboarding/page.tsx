'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Brain, Upload, Code, User, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const programmingLanguages = [
  { name: 'JavaScript', color: 'bg-yellow-500' },
  { name: 'Python', color: 'bg-blue-500' },
  { name: 'Java', color: 'bg-red-500' },
  { name: 'C++', color: 'bg-purple-500' },
  { name: 'TypeScript', color: 'bg-blue-600' },
  { name: 'Go', color: 'bg-cyan-500' },
  { name: 'Rust', color: 'bg-orange-500' },
  { name: 'C#', color: 'bg-green-500' },
]

const experienceLevels = [
  { level: 'Beginner', description: '0-1 years of experience', years: '0-1' },
  { level: 'Intermediate', description: '2-4 years of experience', years: '2-4' },
  { level: 'Advanced', description: '5+ years of experience', years: '5+' },
]

const skillAreas = [
  'Data Structures & Algorithms',
  'System Design',
  'Web Development',
  'Database Design',
  'API Development',
  'DevOps & Cloud',
  'Mobile Development',
  'Machine Learning',
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    experienceLevel: '',
    selectedLanguages: [] as string[],
    skillRatings: {} as Record<string, number>,
    selectedSkillAreas: [] as string[],
    cvFile: null as File | null,
    goals: '',
  })

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  const handleLanguageToggle = (language: string) => {
    setFormData(prev => ({
      ...prev,
      selectedLanguages: prev.selectedLanguages.includes(language)
        ? prev.selectedLanguages.filter(l => l !== language)
        : [...prev.selectedLanguages, language]
    }))
  }

  const handleSkillAreaToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSkillAreas: prev.selectedSkillAreas.includes(skill)
        ? prev.selectedSkillAreas.filter(s => s !== skill)
        : [...prev.selectedSkillAreas, skill]
    }))
  }

  const handleSkillRating = (skill: string, rating: number) => {
    setFormData(prev => ({
      ...prev,
      skillRatings: { ...prev.skillRatings, [skill]: rating }
    }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, cvFile: file }))
      toast.success('CV uploaded successfully!')
    }
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = async () => {
    try {
      // Here you would typically save the data to your database
      toast.success('Profile created successfully!')
      router.push('/dashboard')
    } catch (error) {
      toast.error('Failed to create profile')
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <User className="h-6 w-6 text-blue-600" />
                Welcome to AI Interview Mentor
              </CardTitle>
              <CardDescription>
                Let's start by getting to know you better
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-3">
                <Label>Experience Level</Label>
                <div className="grid gap-3">
                  {experienceLevels.map((exp) => (
                    <Card 
                      key={exp.level}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        formData.experienceLevel === exp.level 
                          ? 'ring-2 ring-blue-600 bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, experienceLevel: exp.level }))}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{exp.level}</h3>
                            <p className="text-sm text-gray-600">{exp.description}</p>
                          </div>
                          <Badge variant="outline">{exp.years}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Code className="h-6 w-6 text-blue-600" />
                Programming Languages
              </CardTitle>
              <CardDescription>
                Select the programming languages you're comfortable with
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {programmingLanguages.map((lang) => (
                  <Button
                    key={lang.name}
                    variant={formData.selectedLanguages.includes(lang.name) ? "default" : "outline"}
                    className={`h-16 flex flex-col gap-1 ${
                      formData.selectedLanguages.includes(lang.name) 
                        ? `${lang.color} hover:${lang.color}/90` 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleLanguageToggle(lang.name)}
                  >
                    <span className="font-semibold">{lang.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Brain className="h-6 w-6 text-blue-600" />
                Skill Areas
              </CardTitle>
              <CardDescription>
                Choose the technical areas you'd like to focus on
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {skillAreas.map((skill) => (
                  <Button
                    key={skill}
                    variant={formData.selectedSkillAreas.includes(skill) ? "default" : "outline"}
                    className="h-12 justify-start"
                    onClick={() => handleSkillAreaToggle(skill)}
                  >
                    {formData.selectedSkillAreas.includes(skill) && (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {skill}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      case 4:
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Upload className="h-6 w-6 text-blue-600" />
                Upload Your CV (Optional)
              </CardTitle>
              <CardDescription>
                Upload your resume to help us personalize your interview experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <Label htmlFor="cv-upload" className="cursor-pointer text-blue-600 hover:text-blue-700">
                    Click to upload your CV
                  </Label>
                  <p className="text-sm text-gray-500">PDF, DOC, or DOCX (Max 5MB)</p>
                  <Input
                    id="cv-upload"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
                {formData.cvFile && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      ✓ {formData.cvFile.name} uploaded successfully
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="goals">Interview Goals (Optional)</Label>
                <Textarea
                  id="goals"
                  placeholder="Tell us about your career goals or specific areas you'd like to improve..."
                  value={formData.goals}
                  onChange={(e) => setFormData(prev => ({ ...prev, goals: e.target.value }))}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        )

      case 5:
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Profile Complete!
              </CardTitle>
              <CardDescription>
                Review your information and start your first mock interview
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Personal Information</h3>
                  <p className="text-sm text-gray-600">Name: {formData.name}</p>
                  <p className="text-sm text-gray-600">Email: {formData.email}</p>
                  <p className="text-sm text-gray-600">Experience: {formData.experienceLevel}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Programming Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.selectedLanguages.map((lang) => (
                      <Badge key={lang} variant="secondary">{lang}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Focus Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.selectedSkillAreas.map((skill) => (
                      <Badge key={skill} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </div>
                
                {formData.cvFile && (
                  <div>
                    <h3 className="font-semibold mb-2">CV Uploaded</h3>
                    <p className="text-sm text-green-600">✓ {formData.cvFile.name}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">AI Interview Mentor</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Set Up Your Profile</h1>
          <p className="text-gray-600">Let's personalize your interview experience</p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm font-medium text-gray-700">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="flex justify-center mb-8">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-4">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePrevious}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
          
          {currentStep < totalSteps ? (
            <Button 
              onClick={handleNext}
              disabled={
                (currentStep === 1 && (!formData.name || !formData.email || !formData.experienceLevel)) ||
                (currentStep === 2 && formData.selectedLanguages.length === 0) ||
                (currentStep === 3 && formData.selectedSkillAreas.length === 0)
              }
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete}>
              Complete Setup
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}