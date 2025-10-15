'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, ArrowLeft, User, Mail, Calendar, Activity, TrendingUp, AlertTriangle, CheckCircle, MessageSquare, Star, Globe } from 'lucide-react'

interface Customer {
  id: string
  email: string
  fullName: string | null
  createdAt: string
  updatedAt: string
  lastActivityAt: string | null
  healthScore: number
  identifiers: Array<{
    identifier_type: string
    identifier_value: string
  }>
}

interface Analytics {
  totalFeedback: number
  avgSentiment: number
  sentimentDistribution: {
    positive: number
    neutral: number
    negative: number
  }
  highPriorityCount: number
  sourceTypeDistribution: Record<string, number>
  topTags: Array<{
    tag: string
    count: number
  }>
}

interface FeedbackItem {
  id: string
  sourceType: string
  content: string
  sentimentScore: number
  priorityScore: number
  aiTags: string[]
  createdAt: string
  updatedAt: string
  sourceData: {
    type: string
    title: string
    id: string
  } | null
}

export default function CustomerProfilePage() {
  const params = useParams()
  const customerId = params.id as string
  
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [sentimentTrend, setSentimentTrend] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCustomerProfile()
  }, [customerId])

  const fetchCustomerProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/customers/${customerId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch customer profile')
      }

      const data = await response.json()
      setCustomer(data.customer)
      setAnalytics(data.analytics)
      setFeedback(data.feedback)
      setSentimentTrend(data.sentimentTrend)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getHealthScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4" />
    if (score >= 60) return <TrendingUp className="h-4 w-4" />
    return <AlertTriangle className="h-4 w-4" />
  }

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-green-600'
    if (score < -0.3) return 'text-red-600'
    return 'text-gray-600'
  }

  const getSentimentLabel = (score: number) => {
    if (score > 0.3) return 'Positive'
    if (score < -0.3) return 'Negative'
    return 'Neutral'
  }

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'survey':
      case 'survey_response':
        return <MessageSquare className="h-4 w-4" />
      case 'interview':
        return <User className="h-4 w-4" />
      case 'review':
        return <Star className="h-4 w-4" />
      case 'reddit_mention':
        return <Globe className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    return formatDate(dateString)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/admin/dashboard/customers">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Customers
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard/customers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Customers
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {customer.fullName || customer.email}
            </h1>
            <p className="text-gray-600 mt-1">Customer Profile</p>
          </div>
        </div>
        <Badge className={getHealthScoreColor(customer.healthScore)}>
          {getHealthScoreIcon(customer.healthScore)}
          <span className="ml-1">Health Score: {customer.healthScore}/100</span>
        </Badge>
      </div>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span className="font-medium">Email</span>
              </div>
              <p className="font-mono text-sm">{customer.email}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Member Since</span>
              </div>
              <p className="text-sm">{formatDate(customer.createdAt)}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Activity className="h-4 w-4" />
                <span className="font-medium">Last Activity</span>
              </div>
              <p className="text-sm">{formatRelativeTime(customer.lastActivityAt)}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">Total Feedback</span>
              </div>
              <p className="text-sm font-medium">{analytics?.totalFeedback || 0} items</p>
            </div>
          </div>

          {customer.identifiers.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Identifiers</h4>
              <div className="flex flex-wrap gap-2">
                {customer.identifiers.map((identifier, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {identifier.identifier_type}: {identifier.identifier_value}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Sentiment</p>
                  <p className={`text-2xl font-bold ${getSentimentColor(analytics.avgSentiment)}`}>
                    {analytics.avgSentiment.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Positive Feedback</p>
                  <p className="text-2xl font-bold text-green-600">
                    {analytics.sentimentDistribution.positive}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Negative Feedback</p>
                  <p className="text-2xl font-bold text-red-600">
                    {analytics.sentimentDistribution.negative}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {analytics.highPriorityCount}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="feedback" className="space-y-4">
        <TabsList>
          <TabsTrigger value="feedback">Feedback History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Timeline</CardTitle>
              <CardDescription>
                All feedback from this customer, sorted by most recent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feedback.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback yet</h3>
                  <p className="text-gray-600">This customer hasn't submitted any feedback.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedback.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getSourceIcon(item.sourceType)}
                          <div>
                            <h4 className="font-medium">
                              {item.sourceData?.title || item.sourceType}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {formatDate(item.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getSentimentColor(item.sentimentScore)}>
                            {getSentimentLabel(item.sentimentScore)} ({item.sentimentScore.toFixed(2)})
                          </Badge>
                          {item.priorityScore > 70 && (
                            <Badge variant="destructive" className="text-xs">
                              High Priority
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {item.content}
                      </p>
                      
                      {item.aiTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.aiTags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentiment Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Positive</span>
                    <span className="text-sm text-green-600 font-medium">
                      {analytics?.sentimentDistribution.positive || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${((analytics?.sentimentDistribution.positive || 0) / (analytics?.totalFeedback || 1)) * 100}%` 
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Neutral</span>
                    <span className="text-sm text-gray-600 font-medium">
                      {analytics?.sentimentDistribution.neutral || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-500 h-2 rounded-full" 
                      style={{ 
                        width: `${((analytics?.sentimentDistribution.neutral || 0) / (analytics?.totalFeedback || 1)) * 100}%` 
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Negative</span>
                    <span className="text-sm text-red-600 font-medium">
                      {analytics?.sentimentDistribution.negative || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ 
                        width: `${((analytics?.sentimentDistribution.negative || 0) / (analytics?.totalFeedback || 1)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Top Tags</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.topTags && analytics.topTags.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.topTags.map((tag, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{tag.tag}</span>
                        <Badge variant="secondary" className="text-xs">
                          {tag.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No tags available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Trends (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {sentimentTrend.length > 0 ? (
                <div className="space-y-3">
                  {sentimentTrend.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <span className="text-sm font-medium">{formatDate(trend.date)}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">{trend.count} items</span>
                        <Badge variant="outline" className={getSentimentColor(trend.avgSentiment)}>
                          {trend.avgSentiment.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
