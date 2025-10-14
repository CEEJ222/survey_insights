'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Search } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface Survey {
  id: string
  title: string
}

interface Response {
  id: string
  survey_id: string
  responses: any
  submitted_at: string
  survey_links: {
    respondent_email: string | null
    respondent_name: string | null
  }
  surveys: {
    title: string
    questions: any[]
  }
}

export default function ResponsesPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [responses, setResponses] = useState<Response[]>([])
  const [filteredResponses, setFilteredResponses] = useState<Response[]>([])
  const [selectedSurveyId, setSelectedSurveyId] = useState(
    searchParams.get('surveyId') || 'all'
  )
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterResponses()
  }, [responses, selectedSurveyId, searchQuery])

  const loadData = async () => {
    try {
      const { user } = await getCurrentUser()
      if (!user) return

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('company_id')
        .eq('id', user.id)
        .single() as { data: { company_id: string } | null }

      if (!adminUser) return

      // Load surveys
      const { data: surveysData } = await supabase
        .from('surveys')
        .select('id, title')
        .eq('company_id', adminUser.company_id)
        .order('created_at', { ascending: false })

      setSurveys(surveysData || [])

      // Load responses
      const { data: responsesData } = await supabase
        .from('survey_responses')
        .select(`
          *,
          survey_links (
            respondent_email,
            respondent_name
          ),
          surveys (
            title,
            questions,
            company_id
          )
        `)
        .eq('surveys.company_id', adminUser.company_id)
        .order('submitted_at', { ascending: false })

      setResponses(responsesData as any || [])
    } catch (error) {
      console.error('Error loading responses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterResponses = () => {
    let filtered = responses

    // Filter by survey
    if (selectedSurveyId !== 'all') {
      filtered = filtered.filter((r) => r.survey_id === selectedSurveyId)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((r) => {
        const responsesText = Object.values(r.responses).join(' ').toLowerCase()
        const name = r.survey_links?.respondent_name?.toLowerCase() || ''
        const email = r.survey_links?.respondent_email?.toLowerCase() || ''
        const surveyTitle = r.surveys?.title?.toLowerCase() || ''
        
        return (
          responsesText.includes(query) ||
          name.includes(query) ||
          email.includes(query) ||
          surveyTitle.includes(query)
        )
      })
    }

    setFilteredResponses(filtered)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Survey Responses</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          View and analyze all survey responses
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Survey</Label>
              <Select value={selectedSurveyId} onValueChange={setSelectedSurveyId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Surveys" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Surveys</SelectItem>
                  {surveys.map((survey) => (
                    <SelectItem key={survey.id} value={survey.id}>
                      {survey.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search responses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredResponses.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-gray-600">
                {responses.length === 0
                  ? 'No responses yet'
                  : 'No responses match your filters'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredResponses.map((response) => (
            <Card key={response.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base sm:text-lg break-words">
                      {response.surveys?.title}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm break-words">
                      {response.survey_links?.respondent_name ||
                        response.survey_links?.respondent_email ||
                        'Anonymous'}{' '}
                      • {format(new Date(response.submitted_at), 'MMM d, yyyy h:mm a')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {response.surveys?.questions?.map((question: any) => (
                  <div key={question.id} className="space-y-2">
                    <p className="font-semibold text-xs sm:text-sm text-gray-700 break-words">
                      {question.text}
                    </p>
                    <div className="p-2 sm:p-3 bg-gray-50 rounded-md">
                      <p className="text-xs sm:text-sm text-gray-800 whitespace-pre-wrap break-words">
                        {response.responses[question.id] || 'No response'}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {filteredResponses.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              Showing {filteredResponses.length} of {responses.length} total responses
            </p>
            <p className="text-sm text-gray-600 mt-2">
              💡 Future Enhancement: AI-powered semantic search and automatic insight
              generation will be available soon via OpenRouter API.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

