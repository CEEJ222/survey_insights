'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, ArrowLeft, User, Mail, Calendar, Activity, TrendingUp, AlertTriangle, CheckCircle, MessageSquare, Star, Globe, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

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
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetchCustomerProfile()
  }, [customerId])

  const fetchCustomerProfile = async () => {
    try {
      setLoading(true)
      
      // Get the session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No session found')
      }

      const response = await fetch(`/api/admin/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
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

  const handleFeedbackClick = (item: FeedbackItem) => {
    setSelectedFeedback(item)
    setModalOpen(true)
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

  const getSentimentColor = (score: number | null) => {
    if (score === null || score === undefined) return 'text-gray-600'
    if (score > 0.3) return 'text-green-600'
    if (score < -0.3) return 'text-red-600'
    return 'text-gray-600'
  }

  const getSentimentLabel = (score: number | null) => {
    if (score === null || score === undefined) return 'Neutral'
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
                {customer.fullName || customer.email || 'Unknown Customer'}
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
              <p className="font-mono text-sm">{customer.email || 'No email provided'}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Member Since</span>
              </div>
              <p className="text-sm">{customer.createdAt ? formatDate(customer.createdAt) : 'Unknown'}</p>
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

          {customer.identifiers && customer.identifiers.length > 0 ? (
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
          ) : (
            <div className="mt-6">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Identifiers</h4>
              <p className="text-sm text-gray-500">No identifiers available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      {analytics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Sentiment</p>
                  <p className={`text-2xl font-bold ${getSentimentColor(analytics.avgSentiment)}`}>
                    {analytics.avgSentiment?.toFixed(2) || '0.00'}
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
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Available</h3>
              <p className="text-gray-600">Analytics will appear once the customer has feedback data.</p>
            </div>
          </CardContent>
        </Card>
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
                    <Card 
                      key={item.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-l-4 border-l-blue-500"
                      onClick={() => handleFeedbackClick(item)}
                    >
                      <CardContent className="p-4">
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
                              {getSentimentLabel(item.sentimentScore)} ({item.sentimentScore?.toFixed(2) || 'N/A'})
                            </Badge>
                            {(item.priorityScore || 0) > 70 && (
                              <Badge variant="destructive" className="text-xs">
                                High Priority
                              </Badge>
                            )}
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                        
           <div className="text-sm text-gray-700 leading-relaxed mt-3">
             {item.sourceType === 'survey' || item.sourceType === 'survey_response' ? (
               <div className="space-y-1">
                 {item.content ? (
                   <>
                     {item.content.split('\n\n').slice(0, 1).map((section, index) => (
                       <div key={index}>
                         {section.split('\n').map((line, lineIndex) => {
                           if (line.includes(':')) {
                             const [question, ...answerParts] = line.split(':')
                             const answer = answerParts.join(':').trim()
                             return (
                               <div key={lineIndex}>
                                 <span className="font-medium text-gray-800">{question.trim()}:</span>
                                 <span className="ml-2">{answer}</span>
                               </div>
                             )
                           } else {
                             return <div key={lineIndex}>{line}</div>
                           }
                         })}
                       </div>
                     ))}
                     {item.content.split('\n\n').length > 1 && (
                       <div className="text-xs text-blue-600 mt-2 italic">
                         Click to see {item.content.split('\n\n').length - 1} more question{item.content.split('\n\n').length - 1 !== 1 ? 's' : ''}...
                       </div>
                     )}
                   </>
                 ) : (
                   <div className="text-gray-500 italic">No content available</div>
                 )}
               </div>
             ) : (
               <p className="line-clamp-2">{item.content || 'No content available'}</p>
             )}
           </div>
                        
                        {item.aiTags && item.aiTags.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {item.aiTags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag || 'Unknown Tag'}
                              </Badge>
                            ))}
                            {item.aiTags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{item.aiTags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 italic mt-3">
                            No tags available
                          </div>
                        )}
                      </CardContent>
                    </Card>
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
                      {analytics?.sentimentDistribution?.positive || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${((analytics?.sentimentDistribution?.positive || 0) / (analytics?.totalFeedback || 1)) * 100}%` 
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Neutral</span>
                    <span className="text-sm text-gray-600 font-medium">
                      {analytics?.sentimentDistribution?.neutral || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-500 h-2 rounded-full" 
                      style={{ 
                        width: `${((analytics?.sentimentDistribution?.neutral || 0) / (analytics?.totalFeedback || 1)) * 100}%` 
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Negative</span>
                    <span className="text-sm text-red-600 font-medium">
                      {analytics?.sentimentDistribution?.negative || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ 
                        width: `${((analytics?.sentimentDistribution?.negative || 0) / (analytics?.totalFeedback || 1)) * 100}%` 
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
                        <span className="text-sm font-medium">{tag.tag || 'Unknown Tag'}</span>
                        <Badge variant="secondary" className="text-xs">
                          {tag.count || 0}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600">No tags available</p>
                    <p className="text-xs text-gray-500 mt-1">Tags will appear as feedback is analyzed</p>
                  </div>
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
              {sentimentTrend && sentimentTrend.length > 0 ? (
                <div className="space-y-3">
                  {sentimentTrend.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <span className="text-sm font-medium">{trend.date ? formatDate(trend.date) : 'Unknown Date'}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">{trend.count || 0} items</span>
                        <Badge variant="outline" className={getSentimentColor(trend.avgSentiment)}>
                          {trend.avgSentiment?.toFixed(2) || '0.00'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Trends Available</h3>
                  <p className="text-gray-600">Trends will appear as more feedback data is collected over time.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feedback Detail Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedFeedback && getSourceIcon(selectedFeedback.sourceType)}
              {selectedFeedback?.sourceData?.title || selectedFeedback?.sourceType || 'Feedback Details'}
            </DialogTitle>
            <DialogDescription>
              {selectedFeedback && formatDate(selectedFeedback.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedFeedback && (
            <div className="space-y-6">
               {/* Content */}
               <div>
                 <h4 className="font-medium text-sm text-gray-700 mb-2">Content</h4>
                 <div className="bg-gray-50 rounded-lg p-4">
                   {selectedFeedback.sourceType === 'survey' || selectedFeedback.sourceType === 'survey_response' ? (
                     <div className="text-sm text-gray-900 leading-relaxed">
                       {selectedFeedback.content ? (
                         selectedFeedback.content.split('\n\n').map((section, index) => (
                           <div key={index} className="mb-4 last:mb-0">
                             {section.split('\n').map((line, lineIndex) => {
                               if (line.includes(':')) {
                                 const [question, ...answerParts] = line.split(':')
                                 const answer = answerParts.join(':').trim()
                                 return (
                                   <div key={lineIndex}>
                                     <div className="font-medium text-gray-800 mb-1">
                                       {question.trim()}:
                                     </div>
                                     {answer && (
                                       <div className="ml-4 text-gray-700 mb-2">
                                         {answer}
                                       </div>
                                     )}
                                   </div>
                                 )
                               } else {
                                 return (
                                   <div key={lineIndex} className="text-gray-700">
                                     {line}
                                   </div>
                                 )
                               }
                             })}
                           </div>
                         ))
                       ) : (
                         <div className="text-gray-500 italic">No content available</div>
                       )}
                     </div>
                   ) : (
                     <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                       {selectedFeedback.content || 'No content available'}
                     </p>
                   )}
                 </div>
               </div>

              {/* Analytics */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Sentiment Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Score:</span>
                      <Badge variant="outline" className={getSentimentColor(selectedFeedback.sentimentScore)}>
                        {getSentimentLabel(selectedFeedback.sentimentScore)} ({selectedFeedback.sentimentScore?.toFixed(2) || 'N/A'})
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Priority:</span>
                      <Badge variant={selectedFeedback.priorityScore && selectedFeedback.priorityScore > 70 ? "destructive" : "secondary"}>
                        {selectedFeedback.priorityScore || 0}/100
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Source Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Type:</span>
                      <span className="text-sm font-medium">{selectedFeedback.sourceType}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">ID:</span>
                      <span className="text-xs font-mono">{selectedFeedback.sourceData?.id || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Tags */}
              {selectedFeedback.aiTags && selectedFeedback.aiTags.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">AI-Generated Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFeedback.aiTags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag || 'Unknown Tag'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Metadata</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2">{formatDate(selectedFeedback.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Updated:</span>
                    <span className="ml-2">{formatDate(selectedFeedback.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


