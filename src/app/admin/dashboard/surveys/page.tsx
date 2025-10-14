'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FileText, Loader2, Edit } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface Survey {
  id: string
  title: string
  description: string | null
  status: string
  created_at: string
  questions: any
}

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSurveys()
  }, [])

  const loadSurveys = async () => {
    try {
      const { user } = await getCurrentUser()
      if (!user) return

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('company_id')
        .eq('id', user.id)
        .single() as { data: { company_id: string } | null }

      if (!adminUser) return

      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('company_id', adminUser.company_id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading surveys:', error)
        return
      }

      setSurveys(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Surveys</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Manage your surveys</p>
        </div>
        <Link href="/admin/dashboard/surveys/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Survey
          </Button>
        </Link>
      </div>

      {surveys.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No surveys yet</CardTitle>
            <CardDescription>
              Create your first survey to start collecting feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/dashboard/surveys/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Survey
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {surveys.map((survey) => (
            <Card key={survey.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <CardTitle className="text-lg sm:text-xl break-words">{survey.title}</CardTitle>
                      <span
                        className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${getStatusColor(
                          survey.status
                        )}`}
                      >
                        {survey.status}
                      </span>
                    </div>
                    <CardDescription className="text-sm break-words">
                      {survey.description || 'No description'}
                    </CardDescription>
                  </div>
                  <Link href={`/admin/dashboard/surveys/${survey.id}`} className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <Edit className="mr-2 h-4 w-4" />
                      Manage
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>
                      {Array.isArray(survey.questions) ? survey.questions.length : 0} questions
                    </span>
                  </div>
                  <div>
                    Created {format(new Date(survey.created_at), 'MMM d, yyyy')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

