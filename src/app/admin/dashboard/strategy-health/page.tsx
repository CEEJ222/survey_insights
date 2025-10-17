'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Target, 
  Users, 
  MessageSquare,
  RefreshCw,
  ArrowRight
} from 'lucide-react'

interface StrategyHealthData {
  total: number
  aligned: number
  conflicted: number
  needsReview: number
  averageAlignment: number
  strategyHealthScore: number
  recommendations: Record<string, number>
  insights: {
    highPriorityThemes: Array<{
      id: string
      name: string
      finalPriority: number
      strategicAlignment: number
      recommendation: string
    }>
    offStrategyThemes: Array<{
      id: string
      name: string
      customerSignal: number
      strategicAlignment: number
      recommendation: string
    }>
    strategyAlignment: string
    customerVsStrategy: {
      highCustomerLowStrategy: number
      highStrategyLowCustomer: number
    }
  }
}

export default function StrategyHealthPage() {
  const [loading, setLoading] = useState(true)
  const [healthData, setHealthData] = useState<StrategyHealthData | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadStrategyHealth()
  }, [])

  const loadStrategyHealth = async () => {
    try {
      setLoading(true)
      // In a real app, this would fetch from the API
      // For now, using mock data
      setTimeout(() => {
        setHealthData({
          total: 12,
          aligned: 8,
          conflicted: 3,
          needsReview: 4,
          averageAlignment: 72,
          strategyHealthScore: 67,
          recommendations: {
            high_priority: 3,
            medium_priority: 4,
            low_priority: 2,
            explore_lightweight: 2,
            off_strategy: 1,
            needs_review: 4
          },
          insights: {
            highPriorityThemes: [
              {
                id: '1',
                name: 'Enhanced Automation and Accuracy Recognition',
                finalPriority: 87,
                strategicAlignment: 95,
                recommendation: 'high_priority'
              },
              {
                id: '2',
                name: 'Integration & Workflow Success',
                finalPriority: 64,
                strategicAlignment: 85,
                recommendation: 'medium_priority'
              }
            ],
            offStrategyThemes: [
              {
                id: '3',
                name: 'Mobile Support Enhancement for Field Measurements',
                customerSignal: 86,
                strategicAlignment: 30,
                recommendation: 'explore_lightweight'
              }
            ],
            strategyAlignment: 'good',
            customerVsStrategy: {
              highCustomerLowStrategy: 1,
              highStrategyLowCustomer: 0
            }
          }
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error loading strategy health:', error)
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadStrategyHealth()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!healthData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load strategy health metrics.</p>
        <Button onClick={loadStrategyHealth} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Needs Attention'
    return 'Poor'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Strategy Health Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor how well your themes align with company strategy
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Strategy Health Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(healthData.strategyHealthScore)}`}>
              {healthData.strategyHealthScore}/100
            </div>
            <p className="text-xs text-muted-foreground">
              {getHealthLabel(healthData.strategyHealthScore)}
            </p>
            <Progress value={healthData.strategyHealthScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Themes Aligned</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{healthData.aligned}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((healthData.aligned / healthData.total) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Off-Strategy</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{healthData.conflicted}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Alignment</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthData.averageAlignment}/100</div>
            <p className="text-xs text-muted-foreground">
              Across all themes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Health Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Theme Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">In-Strategy</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{width: `${(healthData.aligned / healthData.total) * 100}%`}}
                    />
                  </div>
                  <span className="text-sm font-medium">{healthData.aligned}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Off-Strategy</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{width: `${(healthData.conflicted / healthData.total) * 100}%`}}
                    />
                  </div>
                  <span className="text-sm font-medium">{healthData.conflicted}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Needs Review</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{width: `${(healthData.needsReview / healthData.total) * 100}%`}}
                    />
                  </div>
                  <span className="text-sm font-medium">{healthData.needsReview}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(healthData.recommendations).map(([rec, count]) => (
                <div key={rec} className="flex items-center justify-between">
                  <Badge variant={
                    rec === 'high_priority' ? 'default' :
                    rec === 'medium_priority' ? 'secondary' :
                    rec === 'explore_lightweight' ? 'destructive' : 'outline'
                  }>
                    {rec.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* High Priority Themes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            High Priority Themes
          </CardTitle>
          <CardDescription>
            Themes with highest strategic priority scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthData.insights.highPriorityThemes.map((theme) => (
              <div key={theme.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{theme.name}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span>Final Priority: {theme.finalPriority}/100</span>
                    <span>Strategic: {theme.strategicAlignment}/100</span>
                  </div>
                </div>
                <Badge variant={
                  theme.recommendation === 'high_priority' ? 'default' : 'secondary'
                }>
                  {theme.recommendation.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Off-Strategy Themes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Off-Strategy Themes
          </CardTitle>
          <CardDescription>
            Themes with high customer demand but low strategic alignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthData.insights.offStrategyThemes.map((theme) => (
              <div key={theme.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                <div className="flex-1">
                  <h4 className="font-medium">{theme.name}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span>Customer Signal: {theme.customerSignal}/100</span>
                    <span>Strategic: {theme.strategicAlignment}/100</span>
                  </div>
                </div>
                <Badge variant="destructive">
                  {theme.recommendation.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer vs Strategy Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Customer vs Strategy Analysis
          </CardTitle>
          <CardDescription>
            Understanding the relationship between customer demand and strategic alignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
              <h4 className="font-medium text-yellow-800">High Customer, Low Strategy</h4>
              <p className="text-sm text-yellow-700 mt-1">
                {healthData.insights.customerVsStrategy.highCustomerLowStrategy} themes
              </p>
              <p className="text-xs text-yellow-600 mt-2">
                These themes have strong customer demand but conflict with current strategy. 
                Consider lightweight solutions or strategy updates.
              </p>
            </div>
            
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
              <h4 className="font-medium text-blue-800">High Strategy, Low Customer</h4>
              <p className="text-sm text-blue-700 mt-1">
                {healthData.insights.customerVsStrategy.highStrategyLowCustomer} themes
              </p>
              <p className="text-xs text-blue-600 mt-2">
                These themes align well with strategy but have lower customer demand. 
                Consider if they're worth pursuing or if customer education is needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Target className="h-5 w-5" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {healthData.conflicted > 0 && (
              <div className="flex items-center gap-3">
                <ArrowRight className="h-4 w-4 text-blue-600" />
                <span className="text-sm">
                  Review {healthData.conflicted} off-strategy themes and consider strategy updates or lightweight solutions
                </span>
              </div>
            )}
            {healthData.needsReview > 0 && (
              <div className="flex items-center gap-3">
                <ArrowRight className="h-4 w-4 text-blue-600" />
                <span className="text-sm">
                  Review {healthData.needsReview} themes that need PM decisions
                </span>
              </div>
            )}
            {healthData.strategyHealthScore < 70 && (
              <div className="flex items-center gap-3">
                <ArrowRight className="h-4 w-4 text-blue-600" />
                <span className="text-sm">
                  Consider updating your product strategy to better align with customer themes
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
