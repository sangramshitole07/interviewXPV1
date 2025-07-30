'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface SkillRating {
  topic: string
  rating: number
  category: 'languages' | 'frameworks' | 'ai_tools'
}

interface SkillRatingSliderProps {
  technologies: {
    languages: Array<{ name: string; emoji: string; selected: boolean }>
    frameworks: Array<{ name: string; emoji: string; selected: boolean }>
    ai_tools: Array<{ name: string; emoji: string; selected: boolean }>
  }
  onRatingsChange: (ratings: SkillRating[]) => void
  onComplete: () => void
}

const getRatingLabel = (rating: number): string => {
  if (rating <= 2) return 'Beginner'
  if (rating <= 4) return 'Basic'
  if (rating <= 6) return 'Intermediate'
  if (rating <= 8) return 'Advanced'
  return 'Expert'
}

const getRatingColor = (rating: number): string => {
  if (rating <= 2) return 'bg-red-500'
  if (rating <= 4) return 'bg-orange-500'
  if (rating <= 6) return 'bg-yellow-500'
  if (rating <= 8) return 'bg-blue-500'
  return 'bg-green-500'
}

export default function SkillRatingSlider({ technologies, onRatingsChange, onComplete }: SkillRatingSliderProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({})

  // Get all selected technologies
  const selectedTechnologies = [
    ...technologies.languages.filter(t => t.selected).map(t => ({ ...t, category: 'languages' as const })),
    ...technologies.frameworks.filter(t => t.selected).map(t => ({ ...t, category: 'frameworks' as const })),
    ...technologies.ai_tools.filter(t => t.selected).map(t => ({ ...t, category: 'ai_tools' as const }))
  ]

  const handleRatingChange = (technology: string, rating: number[]) => {
    const newRatings = { ...ratings, [technology]: rating[0] }
    setRatings(newRatings)
    
    // Convert to SkillRating array
    const skillRatings: SkillRating[] = selectedTechnologies.map(tech => ({
      topic: tech.name,
      rating: newRatings[tech.name] || 5,
      category: tech.category
    }))
    
    onRatingsChange(skillRatings)
  }

  const allRated = selectedTechnologies.every(tech => ratings[tech.name] !== undefined)

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          🎯 Rate Your Skills
        </CardTitle>
        <p className="text-gray-600">
          Rate your proficiency in each technology from 1 (beginner) to 10 (expert)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Languages */}
        {technologies.languages.some(t => t.selected) && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              💻 Programming Languages
            </h3>
            <div className="grid gap-4">
              {technologies.languages.filter(t => t.selected).map(tech => (
                <div key={tech.name} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{tech.emoji}</span>
                      <span className="font-medium">{tech.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={`${getRatingColor(ratings[tech.name] || 5)} text-white`}
                      >
                        {ratings[tech.name] || 5}/10
                      </Badge>
                      <Badge variant="outline">
                        {getRatingLabel(ratings[tech.name] || 5)}
                      </Badge>
                    </div>
                  </div>
                  <Slider
                    value={[ratings[tech.name] || 5]}
                    onValueChange={(value) => handleRatingChange(tech.name, value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Frameworks */}
        {technologies.frameworks.some(t => t.selected) && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              ⚡ Frameworks & Libraries
            </h3>
            <div className="grid gap-4">
              {technologies.frameworks.filter(t => t.selected).map(tech => (
                <div key={tech.name} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{tech.emoji}</span>
                      <span className="font-medium">{tech.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={`${getRatingColor(ratings[tech.name] || 5)} text-white`}
                      >
                        {ratings[tech.name] || 5}/10
                      </Badge>
                      <Badge variant="outline">
                        {getRatingLabel(ratings[tech.name] || 5)}
                      </Badge>
                    </div>
                  </div>
                  <Slider
                    value={[ratings[tech.name] || 5]}
                    onValueChange={(value) => handleRatingChange(tech.name, value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Tools */}
        {technologies.ai_tools.some(t => t.selected) && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              🧠 AI & Data Science Tools
            </h3>
            <div className="grid gap-4">
              {technologies.ai_tools.filter(t => t.selected).map(tech => (
                <div key={tech.name} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{tech.emoji}</span>
                      <span className="font-medium">{tech.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={`${getRatingColor(ratings[tech.name] || 5)} text-white`}
                      >
                        {ratings[tech.name] || 5}/10
                      </Badge>
                      <Badge variant="outline">
                        {getRatingLabel(ratings[tech.name] || 5)}
                      </Badge>
                    </div>
                  </div>
                  <Slider
                    value={[ratings[tech.name] || 5]}
                    onValueChange={(value) => handleRatingChange(tech.name, value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6 border-t">
          <Button 
            onClick={onComplete}
            disabled={!allRated}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            size="lg"
          >
            {allRated ? 'Start Interview 🚀' : `Rate ${selectedTechnologies.length - Object.keys(ratings).length} more technologies`}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}