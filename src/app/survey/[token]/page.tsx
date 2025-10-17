'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { SurveyQuestion } from '@/types/database'

interface SurveyData {
  id: string
  title: string
  description: string | null
  questions: {
    questions: SurveyQuestion[]
  }
  surveyLinkId: string
  surveyLinkStatus: string
}

export default function SurveyPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [survey, setSurvey] = useState<SurveyData | null>(null)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSurvey()
  }, [token])

  const loadSurvey = async () => {
    try {
      const response = await fetch(`/api/survey/${token}`)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to load survey')
      }
      const data = await response.json()
      setSurvey(data)
      
      // Initialize responses object
      const initialResponses: Record<string, string> = {}
      data.questions?.questions?.forEach((q: SurveyQuestion) => {
        initialResponses[q.id] = ''
      })
      setResponses(initialResponses)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load survey')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all questions are answered
    const unanswered = survey?.questions?.questions?.filter(q => !responses[q.id]?.trim())
    if (unanswered && unanswered.length > 0) {
      toast({
        title: 'Please answer all questions',
        description: 'All questions are required.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/survey/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit survey')
      }

      toast({
        title: 'Thank you!',
        description: 'Your response has been submitted successfully.',
      })

      // Redirect to thank you page
      router.push('/survey/thank-you')
    } catch (err) {
      toast({
        title: 'Submission failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Survey Not Available</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              This survey may have expired or the link is invalid.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (survey?.surveyLinkStatus === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Already Completed</CardTitle>
            <CardDescription>You have already completed this survey.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Thank you for your response!
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="survey-gradient-bg py-6 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="space-y-3 sm:space-y-4 p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl break-words">{survey?.title}</CardTitle>
            {survey?.description && (
              <CardDescription className="text-sm sm:text-base break-words">
                {survey.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {survey?.questions?.questions
                ?.sort((a, b) => a.order - b.order)
                .map((question, index) => (
                  <div key={question.id} className="space-y-2 sm:space-y-3">
                    <Label htmlFor={question.id} className="text-sm sm:text-base font-semibold break-words">
                      {index + 1}. {question.question}
                    </Label>
                    <Textarea
                      id={question.id}
                      placeholder="Type your response here..."
                      value={responses[question.id] || ''}
                      onChange={(e) =>
                        setResponses({ ...responses, [question.id]: e.target.value })
                      }
                      rows={6}
                      className="resize-none text-sm sm:text-base"
                      required
                    />
                  </div>
                ))}

              <div className="pt-4">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-sm sm:text-base"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Survey'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-white mt-6">
          Your responses are confidential and will be used to improve our services.
        </p>
      </div>
    </div>
  )
}

