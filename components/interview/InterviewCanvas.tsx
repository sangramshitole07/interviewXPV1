'use client'

import { useRef, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Palette, Eraser, RotateCcw, Send, Download } from 'lucide-react'

interface InterviewCanvasProps {
  onSubmit: (canvasData: string) => void
  question: string
  isVisible: boolean
  onClose: () => void
}

export default function InterviewCanvas({ onSubmit, question, isVisible, onClose }: InterviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser'>('pen')
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(2)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = 800
    canvas.height = 600

    // Set initial styles
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [isVisible])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (currentTool === 'pen') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = strokeWidth
    } else {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = strokeWidth * 3
    }

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const handleSubmit = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dataURL = canvas.toDataURL('image/png')
    onSubmit(dataURL)
  }

  const downloadCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = 'interview-canvas.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Canvas Response
            </CardTitle>
            <Button variant="outline" onClick={onClose}>
              ✕
            </Button>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Question:</strong> {question}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Draw your solution, diagram, or explanation below
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Button
                variant={currentTool === 'pen' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentTool('pen')}
              >
                <Palette className="h-4 w-4 mr-1" />
                Pen
              </Button>
              <Button
                variant={currentTool === 'eraser' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentTool('eraser')}
              >
                <Eraser className="h-4 w-4 mr-1" />
                Eraser
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm">Color:</label>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-8 h-8 rounded border"
                disabled={currentTool === 'eraser'}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm">Size:</label>
              <input
                type="range"
                min="1"
                max="10"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-20"
              />
              <Badge variant="outline">{strokeWidth}px</Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={clearCanvas}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={downloadCanvas}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>

          {/* Canvas */}
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              className="cursor-crosshair bg-white"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Submit Canvas Response
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}