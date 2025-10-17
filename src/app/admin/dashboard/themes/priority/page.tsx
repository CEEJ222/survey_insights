'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, Target, Users, MessageSquare, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

export default function StrategicPriorityPage() {
  const [loading, setLoading] = useState(true)
  const [themes, setThemes] = useState<any[]>([])
  const [sortBy, setSortBy] = useState('strategic_priority')
  const [filterBy, setFilterBy] = useState('all')

  useEffect(() => {
    // Simulate loading themes sorted by strategic priority
    setTimeout(() => {
      setThemes([
        {
          id: '1',
          name: 'Enhanced Automation and Accuracy Recognition',
          description: 'Customers appreciate PlanSwift\'s automation and accuracy features for digital takeoffs. Opportunity to enhance these capabilities further.',
          customerCount: 8,
          mentionCount: 12,
          sentiment: 0.9,
          customerSignal: 92,
          strategicAlignment: 95,
          finalPriority: 87,
          status: 'approved',
          tags: ['automation', 'accuracy', 'takeoffs', 'calculations'],
          recommendation: 'high_priority',
          strategicReasoning: 'Perfect alignment with "How we win: Best desktop accuracy" strategy. Core to target customer needs.',
          strategicOpportunities: ['Supports core differentiation', 'Matches target customer profile', 'Addresses primary problem space'],
          strategicConflicts: []
        },
        {
          id: '2',
          name: 'Integration & Workflow Success',
          description: 'Seamless integration with Quick Bid and workflow improvements are highly requested.',
          customerCount: 6,
          mentionCount: 9,
          sentiment: 0.75,
          customerSignal: 75,
          strategicAlignment: 85,
          finalPriority: 64,
          status: 'approved',
          tags: ['integration', 'workflow', 'quickbid', 'automation'],
          recommendation: 'medium_priority',
          strategicReasoning: 'Aligns with strategic keyword "integration" (+0.6). Supports "Problems we solve: Fragmented workflow".',
          strategicOpportunities: ['Strategic keyword match', 'Addresses workflow fragmentation', 'Supports efficiency goals'],
          strategicConflicts: []
        },
        {
          id: '3',
          name: 'Mobile Support Enhancement for Field Measurements',
          description: 'Users need mobile access to view takeoffs and measurements while on construction sites.',
          customerCount: 11,
          mentionCount: 14,
          sentiment: 0.65,
          customerSignal: 86,
          strategicAlignment: 30,
          finalPriority: 26,
          status: 'needs_review',
          tags: ['mobile', 'field', 'measurements', 'access'],
          recommendation: 'explore_lightweight',
          strategicReasoning: 'High customer demand but conflicts with "Desktop-First" strategy. Strategic keyword "mobile" has -0.5 weight.',
          strategicOpportunities: ['High customer demand', 'Addresses field worker needs'],
          strategicConflicts: ['Conflicts with desktop-first strategy', 'Field execution is out of scope', 'Mobile keyword deprioritized']
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const getRecommendationBadge = (recommendation: string) => {
    const variants = {
      'high_priority': { variant: 'default' as const, label: 'High Priority', icon: CheckCircle, color: 'text-green-600' },
      'medium_priority': { variant: 'secondary' as const, label: 'Medium Priority', icon: Clock, color: 'text-blue-600' },
      'low_priority': { variant: 'outline' as const, label: 'Low Priority', icon: Clock, color: 'text-gray-600' },
      'explore_lightweight': { variant: 'destructive' as const, label: 'Explore Lightweight', icon: AlertTriangle, color: 'text-orange-600' },
      'off_strategy': { variant: 'destructive' as const, label: 'Off Strategy', icon: AlertTriangle, color: 'text-red-600' }
    }
    return variants[recommendation as keyof typeof variants] || { variant: 'outline' as const, label: 'Needs Review', icon: Clock, color: 'text-gray-600' }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return 'bg-green-500'
    if (priority >= 60) return 'bg-blue-500'
    if (priority >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const filteredThemes = themes.filter(theme => {
    if (filterBy === 'all') return true
    if (filterBy === 'in_strategy') return theme.strategicAlignment >= 70
    if (filterBy === 'off_strategy') return theme.strategicAlignment < 50
    if (filterBy === 'needs_review') return theme.status === 'needs_review'
    return true
  })

  const sortedThemes = [...filteredThemes].sort((a, b) => {
    switch (sortBy) {
      case 'strategic_priority':
        return b.finalPriority - a.finalPriority
      case 'customer_signal':
        return b.customerSignal - a.customerSignal
      case 'strategic_alignment':
        return b.strategicAlignment - a.strategicAlignment
      case 'created_at':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
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
          <h1 className="text-3xl font-bold text-gray-900">Strategic Priority</h1>
          <p className="text-gray-600 mt-1">
            Themes ranked by strategic alignment and customer impact
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {themes.length} total themes
          </Badge>
        </div>
      </div>

      {/* Strategy Context */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <Target className="mr-2 h-5 w-5" />
            Current Strategy Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Strategy:</strong> Desktop-First with Strategic Mobile</p>
            <p><strong>Target Customer:</strong> Mid-market construction firms with dedicated estimating teams</p>
            <p><strong>How We Win:</strong> Best-in-class desktop experience for power users</p>
            <p><strong>Strategic Keywords:</strong> 
              <Badge variant="outline" className="ml-1 mr-1">integration (+0.6)</Badge>
              <Badge variant="outline" className="mr-1">desktop (+0.8)</Badge>
              <Badge variant="destructive" className="mr-1">mobile (-0.5)</Badge>
              <Badge variant="destructive">field (-0.3)</Badge>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Sort by</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strategic_priority">Strategic Priority (Final Score)</SelectItem>
                  <SelectItem value="customer_signal">Customer Signal</SelectItem>
                  <SelectItem value="strategic_alignment">Strategic Alignment</SelectItem>
                  <SelectItem value="created_at">Created Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Filter by</label>
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Themes</SelectItem>
                  <SelectItem value="in_strategy">In Strategy (70+ alignment)</SelectItem>
                  <SelectItem value="off_strategy">Off Strategy (&lt;50 alignment)</SelectItem>
                  <SelectItem value="needs_review">Needs Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategic Health Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Strategy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {themes.filter(t => t.strategicAlignment >= 70).length}
            </div>
            <p className="text-xs text-muted-foreground">
              High strategic alignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Off Strategy</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {themes.filter(t => t.strategicAlignment < 50).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Low strategic alignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {themes.filter(t => t.finalPriority >= 80).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Customer × Strategy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Alignment</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(themes.reduce((sum, t) => sum + t.strategicAlignment, 0) / themes.length)}/100
            </div>
            <p className="text-xs text-muted-foreground">
              Strategy health score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Themes List */}
      <div className="space-y-4">
        {sortedThemes.map((theme) => {
          const rec = getRecommendationBadge(theme.recommendation)
          const Icon = rec.icon
          
          return (
            <Card key={theme.id} className="relative">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {theme.name}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {theme.description}
                      </p>
                    </div>
                    <Badge variant={rec.variant} className="ml-4">
                      <Icon className={`h-4 w-4 mr-1 ${rec.color}`} />
                      {rec.label}
                    </Badge>
                  </div>

                  {/* Priority Calculation */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{theme.customerSignal}</div>
                      <div className="text-sm text-gray-600">Customer Signal</div>
                      <div className="text-xs text-gray-500">{theme.customerCount} customers, {theme.mentionCount} mentions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{theme.strategicAlignment}</div>
                      <div className="text-sm text-gray-600">Strategic Alignment</div>
                      <div className="text-xs text-gray-500">vs current strategy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{theme.finalPriority}</div>
                      <div className="text-sm text-gray-600">Final Priority</div>
                      <div className="text-xs text-gray-500">{theme.customerSignal} × {theme.strategicAlignment}%</div>
                    </div>
                  </div>

                  {/* Strategic Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {theme.strategicOpportunities.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-green-700 mb-2">✅ Strategic Opportunities:</h4>
                        <ul className="space-y-1">
                          {theme.strategicOpportunities.map((opp: string, index: number) => (
                            <li key={index} className="text-sm text-gray-600">• {opp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {theme.strategicConflicts.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-red-700 mb-2">❌ Strategic Conflicts:</h4>
                        <ul className="space-y-1">
                          {theme.strategicConflicts.map((conflict: string, index: number) => (
                            <li key={index} className="text-sm text-gray-600">• {conflict}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Strategic Reasoning */}
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">AI Strategic Reasoning:</h4>
                    <p className="text-sm text-blue-800">{theme.strategicReasoning}</p>
                  </div>

                  {/* Final Priority Bar */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Final Priority Score</span>
                      <span className="font-medium">{theme.finalPriority}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${getPriorityColor(theme.finalPriority)}`}
                        style={{width: `${theme.finalPriority}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {sortedThemes.length === 0 && (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No themes found</h3>
              <p className="text-gray-600">
                No themes match your current filter criteria. Try adjusting the filter settings.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
