'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Link2, Send, BarChart3, Pause, Play, Trash2, Eye, Tag } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import SurveyPreview from '@/components/SurveyPreview'

interface Survey {
  id: string
  title: string
  description: string | null
  status: string
  questions: {
    questions: any[]
  }
}

interface SurveyLink {
  id: string
  token: string
  respondent_email: string | null
  respondent_name: string | null
  status: string
  created_at: string
  opened_at: string | null
  completed_at: string | null
}

interface SurveyTag {
  id: string
  name: string
  category: string
  color: string
  usage_count: number
}

export default function SurveyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const surveyId = params.id as string

  const [loading, setLoading] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [surveyLinks, setSurveyLinks] = useState<SurveyLink[]>([])
  const [responses, setResponses] = useState<any[]>([])
  const [surveyTags, setSurveyTags] = useState<SurveyTag[]>([])

  useEffect(() => {
    loadSurveyData()
  }, [surveyId])

  const loadSurveyData = async () => {
    try {
      const { user } = await getCurrentUser()
      if (!user) return

      // Load survey
      const { data: surveyData, error: surveyError } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .single()

      if (surveyError || !surveyData) {
        toast({
          title: 'Survey not found',
          variant: 'destructive',
        })
        router.push('/admin/dashboard/surveys')
        return
      }

      setSurvey(surveyData)

      // Load survey links
      const { data: linksData } = await supabase
        .from('survey_links')
        .select('*')
        .eq('survey_id', surveyId)
        .order('created_at', { ascending: false })

      setSurveyLinks(linksData || [])

      // Load responses
      const { data: responsesData } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('survey_id', surveyId)
        .order('submitted_at', { ascending: false })

      setResponses(responsesData || [])

      // Load survey tags from survey responses
      const { data: tagsData } = await supabase
        .from('tag_usages')
        .select(`
          tags!inner (
            id,
            name,
            category,
            color
          )
        `)
        .eq('source_type', 'survey_response')
        .in('source_id', responsesData?.map(r => r.id) || [])

      // Process tags and count usage
      const tagMap = new Map<string, SurveyTag>()
      tagsData?.forEach((usage: any) => {
        const tag = usage.tags
        if (tag) {
          const existing = tagMap.get(tag.id)
          if (existing) {
            existing.usage_count += 1
          } else {
            tagMap.set(tag.id, {
              id: tag.id,
              name: tag.name,
              category: tag.category,
              color: tag.color,
              usage_count: 1
            })
          }
        }
      })

      setSurveyTags(Array.from(tagMap.values()))
    } catch (error) {
      console.error('Error loading survey:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    try {
      const result: any = await (supabase as any)
        .from('surveys')
        .update({ status: newStatus })
        .eq('id', surveyId)

      if (result.error) throw result.error

      setSurvey(prev => prev ? { ...prev, status: newStatus } : null)
      toast({
        title: 'Status updated',
        description: `Survey is now ${newStatus}.`,
      })
    } catch (error) {
      toast({
        title: 'Failed to update status',
        variant: 'destructive',
      })
    }
  }

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/survey/${token}`
    navigator.clipboard.writeText(link)
    toast({
      title: 'Link copied!',
      description: 'Survey link has been copied to clipboard.',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!survey) {
    return <div>Survey not found</div>
  }

  const completedCount = surveyLinks.filter(l => l.status === 'completed').length
  const openedCount = surveyLinks.filter(l => l.status === 'opened').length
  const pendingCount = surveyLinks.filter(l => l.status === 'pending').length

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{survey.title}</h1>
          <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800">
            {survey.status}
          </span>
        </div>
        <p className="text-gray-600">{survey.description}</p>
      </div>

      <div className="flex gap-3">
        {survey.status === 'active' && (
          <Button variant="outline" onClick={() => updateStatus('paused')}>
            <Pause className="mr-2 h-4 w-4" />
            Pause Survey
          </Button>
        )}
        {survey.status === 'paused' && (
          <Button onClick={() => updateStatus('active')}>
            <Play className="mr-2 h-4 w-4" />
            Activate Survey
          </Button>
        )}
        {survey.status === 'draft' && (
          <Button onClick={() => updateStatus('active')}>
            <Play className="mr-2 h-4 w-4" />
            Activate Survey
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => setShowPreview(true)}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Preview Survey
        </Button>
        <Link href={`/admin/dashboard/send?surveyId=${surveyId}`}>
          <Button>
            <Send className="mr-2 h-4 w-4" />
            Send Survey
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{surveyLinks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Opened</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="questions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="links">Links ({surveyLinks.length})</TabsTrigger>
          <TabsTrigger value="responses">Responses ({responses.length})</TabsTrigger>
          <TabsTrigger value="tags">Tags ({surveyTags.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>Survey Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {survey.questions?.questions?.map((q: any, index: number) => (
                <div key={q.id} className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-semibold text-sm text-gray-600 mb-2">
                    Question {index + 1}
                  </p>
                  <p>{q.question}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle>Survey Links</CardTitle>
              <CardDescription>
                Unique links generated for each respondent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {surveyLinks.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No links generated yet. Send surveys to create links.
                </p>
              ) : (
                <div className="space-y-2">
                  {surveyLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {link.respondent_name || link.respondent_email || 'Anonymous'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Status: <span className="capitalize">{link.status}</span>
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyLink(link.token)}
                      >
                        <Link2 className="mr-2 h-4 w-4" />
                        Copy Link
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses">
          <Card>
            <CardHeader>
              <CardTitle>Responses</CardTitle>
              <CardDescription>
                View all submitted responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {responses.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No responses yet.
                </p>
              ) : (
                <Link href={`/admin/dashboard/responses?surveyId=${surveyId}`}>
                  <Button>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View All Responses
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags">
          <Card>
            <CardHeader>
              <CardTitle>Survey Tags</CardTitle>
              <CardDescription>
                AI-generated tags associated with this survey
              </CardDescription>
            </CardHeader>
            <CardContent>
              {surveyTags.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No tags associated with this survey yet.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {surveyTags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="font-medium text-sm">{tag.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                            {tag.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {tag.usage_count} usage{tag.usage_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Tag className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Total Tags: {surveyTags.length}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Tags are automatically generated from survey responses using AI analysis.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {showPreview && survey && (
        <SurveyPreview
          title={survey.title}
          description={survey.description || ''}
          questions={survey.questions?.questions || []}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}

