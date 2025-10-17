'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { SurveyQuestion } from '@/types/database'

interface SurveyPreviewProps {
  title: string
  description?: string
  questions: SurveyQuestion[]
  onClose?: () => void
}

export default function SurveyPreview({ title, description, questions, onClose }: SurveyPreviewProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Survey Preview</h2>
            {onClose && (
              <Button variant="outline" onClick={onClose} size="sm">
                Close
              </Button>
            )}
          </div>
          
          {/* Preview Header */}
          <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-600 font-medium mb-2">Preview Mode</p>
            <p className="text-gray-600 text-sm">
              This is how your survey will appear to respondents
            </p>
          </div>

          {/* Survey Content */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl break-words">
                  {title || 'Untitled Survey'}
                </CardTitle>
                {description && (
                  <CardDescription className="text-sm sm:text-base break-words">
                    {description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-6 sm:space-y-8">
                  {questions
                    .sort((a, b) => a.order - b.order)
                    .map((question, index) => (
                      <div key={question.id} className="space-y-2 sm:space-y-3">
                        <Label htmlFor={question.id} className="text-sm sm:text-base font-semibold break-words">
                          {index + 1}. {question.question || 'Untitled Question'}
                        </Label>
                        <Textarea
                          id={question.id}
                          placeholder="Type your response here..."
                          rows={6}
                          className="resize-none text-sm sm:text-base"
                          disabled
                        />
                      </div>
                    ))}

                  {questions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No questions added yet</p>
                      <p className="text-sm">Add questions to see the preview</p>
                    </div>
                  )}

                  <div className="pt-4">
                    <Button
                      size="lg"
                      className="w-full text-sm sm:text-base"
                      disabled
                    >
                      Submit Survey
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-gray-500 mt-6">
              Your responses are confidential and will be used to improve our services.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
