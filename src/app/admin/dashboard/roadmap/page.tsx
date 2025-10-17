'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Map, Calendar, Users, Target, Clock, Play, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Edit, Trash2 } from 'lucide-react'

export default function RoadmapPage() {
  const [loading, setLoading] = useState(true)
  const [initiatives, setInitiatives] = useState<any[]>([])
  const [timeline, setTimeline] = useState<{
    now: any[]
    next: any[]
    later: any[]
  }>({ now: [], next: [], later: [] })
  const [summary, setSummary] = useState<any>({})

  useEffect(() => {
    loadInitiatives()
  }, [])

  const loadInitiatives = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/admin/initiatives/timeline')
      
      if (!response.ok) {
        throw new Error('Failed to fetch initiatives')
      }
      
      const data = await response.json()
      setInitiatives(data.initiatives || [])
      setTimeline(data.timeline || { now: [], next: [], later: [] })
      setSummary(data.summary || {})
    } catch (error) {
      console.error('Error loading initiatives:', error)
      // Fallback to mock data for development
      setInitiatives([
        {
          id: '1',
          title: 'Improve PlanSwift ML accuracy by 15%',
          description: 'Enhance ML-powered material recognition and calculation accuracy for complex blueprints',
          status: 'in_progress',
          effort: 'M',
          owner_id: 'user-1',
          admin_users: { full_name: 'Sarah Johnson', email: 'sarah@company.com' },
          target_quarter: 'Q2 2025',
          timeline_bucket: 'now',
          themes: {
            customer_count: 8,
            name: 'Enhanced Automation and Accuracy Recognition'
          },
          started_at: '2025-01-15',
          created_at: '2025-01-10'
        },
        {
          id: '2',
          title: 'SMS/Email Access for Field Workers',
          description: 'Lightweight mobile access solution for field measurement verification',
          status: 'planned',
          effort: 'S',
          owner_id: 'user-2',
          admin_users: { full_name: 'Mike Chen', email: 'mike@company.com' },
          target_quarter: 'Q2 2025',
          timeline_bucket: 'next',
          themes: {
            customer_count: 11,
            name: 'Mobile Support Enhancement'
          },
          started_at: null,
          created_at: '2025-01-12'
        },
        {
          id: '3',
          title: 'Quick Bid Integration Enhancement',
          description: 'Streamlined integration with Quick Bid for seamless workflow',
          status: 'backlog',
          effort: 'L',
          owner_id: 'user-3',
          admin_users: { full_name: 'Alex Rodriguez', email: 'alex@company.com' },
          target_quarter: 'Q3 2025',
          timeline_bucket: 'later',
          themes: {
            customer_count: 6,
            name: 'Integration & Workflow Success'
          },
          started_at: null,
          created_at: '2025-01-14'
        }
      ])
      
      setTimeline({
        now: [{
          id: '1',
          title: 'Improve PlanSwift ML accuracy by 15%',
          description: 'Enhance ML-powered material recognition and calculation accuracy for complex blueprints',
          status: 'in_progress',
          effort: 'M',
          owner_id: 'user-1',
          admin_users: { full_name: 'Sarah Johnson', email: 'sarah@company.com' },
          target_quarter: 'Q2 2025',
          timeline_bucket: 'now',
          themes: {
            customer_count: 8,
            name: 'Enhanced Automation and Accuracy Recognition'
          },
          started_at: '2025-01-15',
          created_at: '2025-01-10'
        }],
        next: [{
          id: '2',
          title: 'SMS/Email Access for Field Workers',
          description: 'Lightweight mobile access solution for field measurement verification',
          status: 'planned',
          effort: 'S',
          owner_id: 'user-2',
          admin_users: { full_name: 'Mike Chen', email: 'mike@company.com' },
          target_quarter: 'Q2 2025',
          timeline_bucket: 'next',
          themes: {
            customer_count: 11,
            name: 'Mobile Support Enhancement'
          },
          started_at: null,
          created_at: '2025-01-12'
        }],
        later: [{
          id: '3',
          title: 'Quick Bid Integration Enhancement',
          description: 'Streamlined integration with Quick Bid for seamless workflow',
          status: 'backlog',
          effort: 'L',
          owner_id: 'user-3',
          admin_users: { full_name: 'Alex Rodriguez', email: 'alex@company.com' },
          target_quarter: 'Q3 2025',
          timeline_bucket: 'later',
          themes: {
            customer_count: 6,
            name: 'Integration & Workflow Success'
          },
          started_at: null,
          created_at: '2025-01-14'
        }]
      })
      
      setSummary({
        total: 3,
        now: 1,
        next: 1,
        later: 1,
        in_progress: 1,
        planned: 1,
        shipped: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-500'
      case 'planned': return 'bg-yellow-500'
      case 'shipped': return 'bg-green-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress': return 'In Progress'
      case 'planned': return 'Planned'
      case 'shipped': return 'Shipped'
      case 'cancelled': return 'Cancelled'
      default: return 'Backlog'
    }
  }

  const getBucketIcon = (bucket: string) => {
    switch (bucket) {
      case 'now': return <Play className="h-4 w-4 text-red-500" />
      case 'next': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'later': return <Calendar className="h-4 w-4 text-gray-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getBucketLabel = (bucket: string) => {
    switch (bucket) {
      case 'now': return 'Now'
      case 'next': return 'Next'
      case 'later': return 'Later'
      default: return 'Backlog'
    }
  }

  const handleMoveTimeline = async (initiativeId: string, newBucket: string) => {
    try {
      const response = await fetch(`/api/admin/initiatives/${initiativeId}/timeline`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timeline_bucket: newBucket
        })
      })

      if (!response.ok) {
        throw new Error('Failed to move initiative')
      }

      await loadInitiatives()
    } catch (error) {
      console.error('Error moving initiative:', error)
    }
  }

  const handleUpdateStatus = async (initiativeId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/initiatives/${initiativeId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      await loadInitiatives()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Roadmap</h1>
          <p className="text-gray-600 mt-1">
            Strategic initiatives driven by customer feedback
          </p>
        </div>
        <Button>
          <Target className="mr-2 h-4 w-4" />
          Create Initiative
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Initiatives</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total || initiatives.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all timelines
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.in_progress || initiatives.filter(i => i.status === 'in_progress').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planned</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.planned || initiatives.filter(i => i.status === 'planned').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready to start
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipped</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.shipped || initiatives.filter(i => i.status === 'shipped').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed initiatives
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline View */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Timeline View</h2>
        
        {/* Now */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Play className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-medium">Now ({timeline.now.length})</h3>
            <Badge variant="destructive">Active</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {timeline.now.map((initiative) => (
              <Card key={initiative.id} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg leading-tight">
                      {initiative.title}
                    </CardTitle>
                    <Badge variant="secondary">
                      {getStatusLabel(initiative.status)}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {initiative.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span className="font-medium">{initiative.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getStatusColor(initiative.status)}`}
                          style={{width: `${initiative.progress}%`}}
                        ></div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <Users className="mr-1 h-4 w-4 text-gray-500" />
                        <span>{initiative.themes?.customer_count || 0} customers</span>
                      </div>
                      <div className="flex items-center">
                        <Target className="mr-1 h-4 w-4 text-gray-500" />
                        <span>{initiative.effort} effort</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{initiative.admin_users?.full_name || 'Unassigned'}</span>
                      <span>{initiative.target_quarter || 'TBD'}</span>
                    </div>

                    {/* Timeline Management */}
                    <div className="flex gap-1 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleMoveTimeline(initiative.id, 'next')}
                        className="flex-1"
                      >
                        <ArrowRight className="mr-1 h-3 w-3" />
                        Move to Next
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateStatus(initiative.id, 'shipped')}
                        className="flex-1"
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Mark Shipped
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Next */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-medium">Next ({timeline.next.length})</h3>
            <Badge variant="secondary">Upcoming</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {timeline.next.map((initiative) => (
              <Card key={initiative.id} className="border-l-4 border-l-yellow-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg leading-tight">
                      {initiative.title}
                    </CardTitle>
                    <Badge variant="outline">
                      {getStatusLabel(initiative.status)}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {initiative.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <Users className="mr-1 h-4 w-4 text-gray-500" />
                        <span>{initiative.customerCount} customers</span>
                      </div>
                      <div className="flex items-center">
                        <Target className="mr-1 h-4 w-4 text-gray-500" />
                        <span>{initiative.effort} effort</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{initiative.owner}</span>
                      <span>{initiative.timeline}</span>
                    </div>

                    <Button size="sm" className="w-full">
                      Start Initiative
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Later */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium">Later ({timeline.later.length})</h3>
            <Badge variant="outline">Future</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {timeline.later.map((initiative) => (
              <Card key={initiative.id} className="border-l-4 border-l-gray-500 opacity-75">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg leading-tight">
                      {initiative.title}
                    </CardTitle>
                    <Badge variant="outline">
                      {getStatusLabel(initiative.status)}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {initiative.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <Users className="mr-1 h-4 w-4 text-gray-500" />
                        <span>{initiative.customerCount} customers</span>
                      </div>
                      <div className="flex items-center">
                        <Target className="mr-1 h-4 w-4 text-gray-500" />
                        <span>{initiative.effort} effort</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{initiative.owner}</span>
                      <span>{initiative.timeline}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Setup Notice */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <CheckCircle className="mr-2 h-5 w-5" />
            Roadmap Ready
          </CardTitle>
          <CardDescription className="text-green-700">
            This shows sample initiatives. Create real initiatives from approved themes to build your roadmap.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="bg-green-600 hover:bg-green-700">
            <Target className="mr-2 h-4 w-4" />
            Create First Initiative
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
