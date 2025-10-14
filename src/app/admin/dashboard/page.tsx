'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Send, BarChart3, Plus } from 'lucide-react'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'

interface Stats {
  totalSurveys: number
  activeSurveys: number
  totalResponses: number
  pendingLinks: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalSurveys: 0,
    activeSurveys: 0,
    totalResponses: 0,
    pendingLinks: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const { user } = await getCurrentUser()
      if (!user) return

      // Get admin user to find company_id
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('company_id')
        .eq('id', user.id)
        .single() as { data: { company_id: string } | null }

      if (!adminUser) return

      // Get total surveys
      const { count: surveysCount } = await supabase
        .from('surveys')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', adminUser.company_id)

      // Get active surveys
      const { count: activeSurveysCount } = await supabase
        .from('surveys')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', adminUser.company_id)
        .eq('status', 'active')

      // Get total responses
      const { count: responsesCount } = await supabase
        .from('survey_responses')
        .select('*, surveys!inner(company_id)', { count: 'exact', head: true })
        .eq('surveys.company_id', adminUser.company_id)

      // Get pending links
      const { count: pendingLinksCount } = await supabase
        .from('survey_links')
        .select('*, surveys!inner(company_id)', { count: 'exact', head: true })
        .eq('surveys.company_id', adminUser.company_id)
        .eq('status', 'pending')

      setStats({
        totalSurveys: surveysCount || 0,
        activeSurveys: activeSurveysCount || 0,
        totalResponses: responsesCount || 0,
        pendingLinks: pendingLinksCount || 0,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Welcome back! Here's an overview of your surveys.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Surveys</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSurveys}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSurveys} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResponses}</div>
            <p className="text-xs text-muted-foreground">
              Across all surveys
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Links</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingLinks}</div>
            <p className="text-xs text-muted-foreground">
              Not yet opened
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalResponses > 0 
                ? Math.round((stats.totalResponses / (stats.totalResponses + stats.pendingLinks)) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Response rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your surveys</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/dashboard/surveys/new">
              <Button className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Create New Survey
              </Button>
            </Link>
            <Link href="/admin/dashboard/send">
              <Button variant="outline" className="w-full justify-start">
                <Send className="mr-2 h-4 w-4" />
                Send Survey
              </Button>
            </Link>
            <Link href="/admin/dashboard/responses">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Responses
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Follow these steps to send your first survey</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start">
                <span className="font-semibold mr-2">1.</span>
                <span>Create a survey with your custom questions</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">2.</span>
                <span>Generate unique links for each respondent</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">3.</span>
                <span>Send surveys via email blast</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">4.</span>
                <span>Track responses and analyze insights</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

