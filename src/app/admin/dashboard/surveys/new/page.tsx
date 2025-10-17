'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Trash2, Loader2, GripVertical, Eye } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import SurveyPreview from '@/components/SurveyPreview'

interface Question {
  id: string
  text: string
  order: number
  type: 'open_ended' | 'multiple_choice' | 'rating' | 'matrix'
}

export default function NewSurveyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', text: '', order: 0, type: 'open_ended' },
  ])

  const addQuestion = () => {
    const newId = (questions.length + 1).toString()
    setQuestions([
      ...questions,
      { id: newId, text: '', order: questions.length, type: 'open_ended' },
    ])
  }

  const removeQuestion = (id: string) => {
    if (questions.length === 1) {
      toast({
        title: 'Cannot remove',
        description: 'Survey must have at least one question.',
        variant: 'destructive',
      })
      return
    }
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const updateQuestion = (id: string, text: string) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, text } : q))
    )
  }

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'active') => {
    e.preventDefault()

    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a survey title.',
        variant: 'destructive',
      })
      return
    }

    const emptyQuestions = questions.filter((q) => !q.text.trim())
    if (emptyQuestions.length > 0) {
      toast({
        title: 'Empty questions',
        description: 'Please fill in all questions or remove empty ones.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const { user } = await getCurrentUser()
      if (!user) throw new Error('Not authenticated')

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('company_id')
        .eq('id', user.id)
        .single() as { data: { company_id: string } | null }

      if (!adminUser) throw new Error('Admin user not found')

      const { data, error } = await (supabase
        .from('surveys')
        .insert({
          company_id: adminUser.company_id,
          title,
          description: description || null,
          questions: questions.map((q, idx) => ({
            id: q.id,
            text: q.text,
            order: idx,
          })),
          status,
          created_by: user.id,
        } as any)
        .select()
        .single() as any)

      if (error) throw error

      toast({
        title: 'Survey created!',
        description: `Your survey has been saved as ${status}.`,
      })

      router.push(`/admin/dashboard/surveys/${data.id}`)
    } catch (error) {
      console.error('Error creating survey:', error)
      toast({
        title: 'Failed to create survey',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Survey</h1>
        <p className="text-gray-600 mt-2">
          Design your survey with open-ended questions
        </p>
      </div>

      <form className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Survey Details</CardTitle>
            <CardDescription>
              Basic information about your survey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Survey Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Customer Satisfaction Survey"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Briefly describe the purpose of this survey..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Questions</CardTitle>
                <CardDescription>
                  Add open-ended questions for respondents
                </CardDescription>
              </div>
              <Button type="button" onClick={addQuestion} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="flex gap-2 items-start p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0 pt-2">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`question-${question.id}`}>
                    Question {index + 1}
                  </Label>
                  <Textarea
                    id={`question-${question.id}`}
                    placeholder="Enter your question here..."
                    value={question.text}
                    onChange={(e) => updateQuestion(question.id, e.target.value)}
                    rows={2}
                    required
                  />
                </div>
                {questions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeQuestion(question.id)}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowPreview(true)}
            disabled={!title.trim()}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview Survey
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, 'draft')}
            variant="outline"
            disabled={loading}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, 'active')}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create & Activate'
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
      
      {showPreview && (
        <SurveyPreview
          title={title}
          description={description}
          questions={questions.map(q => ({ ...q, question: q.text }))}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}

