'use client'

// ============================================================================
// CUSTOMER IMPACT DASHBOARD
// ============================================================================
// Shows customer impact metrics, ROI tracking, and strategic health
// ============================================================================

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Heart, 
  MessageSquare, 
  Target,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface ImpactMetrics {
  shippedInitiatives: number
  customerNotifications: number
  averageSatisfaction: number
  totalRevenueImpact: number
  churnPreventionCount: number
}

interface InitiativeImpact {
  id: string
  title: string
  shipped_at: string
  impact: {
    totalCustomers: number
    notifiedCustomers: number
    respondedCustomers: number
    averageSatisfaction: number
    totalRevenueImpact: number
    churnPreventionCount: number
  }
}

interface StrategicHealth {
  themesInStrategy: number
  themesOffStrategy: number
  themesNeedsReview: number
  strategyHealthScore: number
  recommendation: string
}

export default function CustomerImpactDashboard() {
  const [impactMetrics, setImpactMetrics] = useState<ImpactMetrics | null>(null)
  const [recentInitiatives, setRecentInitiatives] = useState<InitiativeImpact[]>([])
  const [strategicHealth, setStrategicHealth] = useState<StrategicHealth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load impact metrics
      const metricsResponse = await fetch('/api/admin/impact/metrics')
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setImpactMetrics(metricsData.data)
      }

      // Load recent initiatives
      const initiativesResponse = await fetch('/api/admin/initiatives/recent-impact')
      if (initiativesResponse.ok) {
        const initiativesData = await initiativesResponse.json()
        setRecentInitiatives(initiativesData.data)
      }

      // Load strategic health
      const healthResponse = await fetch('/api/admin/strategy/health')
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        setStrategicHealth(healthData.data)
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotifyCustomers = async (initiativeId: string) => {
    try {
      const response = await fetch(`/api/admin/initiatives/${initiativeId}/notify-customers`, {
        method: 'POST'
      })
      
      if (response.ok) {
        // Reload data to show updated status
        loadDashboardData()
      } else {
        const error = await response.json()
        alert(`Failed to notify customers: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to notify customers:', error)
      alert('Failed to notify customers')
    }
  }

  const handleMeasureImpact = async (initiativeId: string) => {
    try {
      const response = await fetch(`/api/admin/initiatives/${initiativeId}/impact`, {
        method: 'POST'
      })
      
      if (response.ok) {
        // Reload data to show updated metrics
        loadDashboardData()
      } else {
        const error = await response.json()
        alert(`Failed to measure impact: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to measure impact:', error)
      alert('Failed to measure impact')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading impact dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Impact & ROI Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track customer satisfaction, revenue impact, and strategic health
          </p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Impact Summary Cards */}
      {impactMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shipped Initiatives</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{impactMetrics.shippedInitiatives}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customer Notifications</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{impactMetrics.customerNotifications}</div>
              <p className="text-xs text-muted-foreground">Customers notified</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction Score</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{impactMetrics.averageSatisfaction}/10</div>
              <p className="text-xs text-muted-foreground">Average rating</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+${impactMetrics.totalRevenueImpact.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Estimated impact</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recently Shipped Initiatives */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Recently Shipped Initiatives</CardTitle>
          <CardDescription>
            Track customer impact and satisfaction for shipped features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentInitiatives.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No shipped initiatives found. Ship some features to see customer impact!
              </div>
            ) : (
              recentInitiatives.map((initiative) => (
                <div key={initiative.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{initiative.title}</h3>
                    <Badge variant="outline">
                      Shipped {new Date(initiative.shipped_at).toLocaleDateString()}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Customers:</span>
                      <span className="ml-2 font-medium">
                        {initiative.impact.notifiedCustomers}/{initiative.impact.totalCustomers}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Satisfaction:</span>
                      <span className="ml-2 font-medium">
                        {initiative.impact.averageSatisfaction}/10
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Revenue Impact:</span>
                      <span className="ml-2 font-medium">
                        +${initiative.impact.totalRevenueImpact.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Churn Prevention:</span>
                      <span className="ml-2 font-medium">
                        {initiative.impact.churnPreventionCount} customers
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {initiative.impact.notifiedCustomers === 0 && (
                      <Button 
                        size="sm" 
                        onClick={() => handleNotifyCustomers(initiative.id)}
                      >
                        Notify Customers
                      </Button>
                    )}
                    {initiative.impact.respondedCustomers === 0 && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleMeasureImpact(initiative.id)}
                      >
                        Measure Impact
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Strategic Health Metrics */}
      {strategicHealth && (
        <Card>
          <CardHeader>
            <CardTitle>📈 Strategic Health Metrics</CardTitle>
            <CardDescription>
              Monitor strategy alignment and theme performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {strategicHealth.themesInStrategy}
                  </div>
                  <div className="text-sm text-gray-600">Themes in Strategy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {strategicHealth.themesOffStrategy}
                  </div>
                  <div className="text-sm text-gray-600">Themes Off Strategy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {strategicHealth.themesNeedsReview}
                  </div>
                  <div className="text-sm text-gray-600">Needs Review</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Strategy Health Score</span>
                  <span className="text-sm font-bold">
                    {strategicHealth.strategyHealthScore}/100
                  </span>
                </div>
                <Progress 
                  value={strategicHealth.strategyHealthScore} 
                  className="h-2"
                />
                <div className="flex items-center gap-2">
                  {strategicHealth.strategyHealthScore >= 80 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : strategicHealth.strategyHealthScore >= 60 ? (
                    <Clock className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm text-gray-600">
                    {strategicHealth.recommendation}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
