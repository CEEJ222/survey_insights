'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CompanyVision, CreateVisionRequest, UpdateVisionRequest } from '@/types/database'

interface VisionEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vision?: CompanyVision | null
  onSave: (vision: CreateVisionRequest | UpdateVisionRequest) => void
  loading?: boolean
}

export default function VisionEditor({ 
  open, 
  onOpenChange, 
  vision, 
  onSave, 
  loading = false 
}: VisionEditorProps) {
  const [formData, setFormData] = useState({
    vision_statement: '',
    mission_statement: ''
  })

  useEffect(() => {
    if (vision) {
      setFormData({
        vision_statement: vision.vision_statement || '',
        mission_statement: vision.mission_statement || ''
      })
    } else {
      setFormData({
        vision_statement: '',
        mission_statement: ''
      })
    }
  }, [vision])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleVisionChange = (value: string) => {
    setFormData(prev => ({ ...prev, vision_statement: value }))
  }

  const handleMissionChange = (value: string) => {
    setFormData(prev => ({ ...prev, mission_statement: value }))
  }

  const getCharacterCount = (text: string) => {
    return text.length
  }

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vision ? 'Edit Vision' : 'Create Company Vision'}
          </DialogTitle>
          <DialogDescription>
            Define your company's vision and mission to guide strategic decisions and inspire your team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vision Statement */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="vision_statement">Vision Statement *</Label>
              <span className="text-sm text-gray-500">
                {getCharacterCount(formData.vision_statement)} characters, {getWordCount(formData.vision_statement)} words
              </span>
            </div>
            <Textarea
              id="vision_statement"
              value={formData.vision_statement}
              onChange={(e) => handleVisionChange(e.target.value)}
              placeholder="Describe your company's aspirational future state in 1-2 sentences..."
              rows={4}
              required
              className="resize-none"
            />
            <p className="text-sm text-gray-600">
              A vision statement describes where you want to be in the future. It should be inspiring, 
              aspirational, and paint a picture of the impact you want to have.
            </p>
          </div>

          {/* Mission Statement */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="mission_statement">Mission Statement</Label>
              <span className="text-sm text-gray-500">
                {getCharacterCount(formData.mission_statement)} characters, {getWordCount(formData.mission_statement)} words
              </span>
            </div>
            <Textarea
              id="mission_statement"
              value={formData.mission_statement}
              onChange={(e) => handleMissionChange(e.target.value)}
              placeholder="Describe your company's purpose and what you do to achieve your vision..."
              rows={4}
              className="resize-none"
            />
            <p className="text-sm text-gray-600">
              A mission statement explains what you do, who you serve, and how you create value. 
              It should be clear, actionable, and focused on the present.
            </p>
          </div>

          {/* Examples Section */}
          {!vision && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900">Examples to get you started:</h4>
              
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-sm text-gray-700 mb-1">Vision Example:</h5>
                  <p className="text-sm text-gray-600 italic">
                    "To become the most trusted construction intelligence platform that empowers 
                    every construction team to build with confidence and precision."
                  </p>
                </div>
                
                <div>
                  <h5 className="font-medium text-sm text-gray-700 mb-1">Mission Example:</h5>
                  <p className="text-sm text-gray-600 italic">
                    "We provide accurate takeoff data and project insights to mid-market construction 
                    firms, helping them reduce costly errors and win more profitable projects."
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tips Section */}
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900">💡 Writing Tips:</h4>
            
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Keep it concise - aim for 1-2 sentences each</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Use active, inspiring language</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Focus on the impact you want to have</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Make it memorable and shareable</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.vision_statement.trim()}>
              {loading ? 'Saving...' : vision ? 'Update Vision' : 'Create Vision'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
