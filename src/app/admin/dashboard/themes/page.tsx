'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { TrendingUp, Users, MessageSquare, AlertCircle, CheckCircle, Clock, Target, BarChart3, Filter, Plus, CheckSquare, Square } from 'lucide-react'
import StrategicAnalysisModal from '@/components/StrategicAnalysisModal'
import ThemeComparisonTool from '@/components/ThemeComparisonTool'
import InitiativeCreationModal from '@/components/InitiativeCreationModal'

export default function ThemesPage() {
  const [loading, setLoading] = useState(true)
  const [themes, setThemes] = useState<any[]>([])
  const [sortBy, setSortBy] = useState('strategic_priority')
  const [filterBy, setFilterBy] = useState('all')
  const [selectedTheme, setSelectedTheme] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isComparisonOpen, setIsComparisonOpen] = useState(false)
  
  // Batch selection state
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set())
  const [isBatchMode, setIsBatchMode] = useState(false)
  
  // Initiative creation state
  const [isInitiativeModalOpen, setIsInitiativeModalOpen] = useState(false)
  const [initiativeTheme, setInitiativeTheme] = useState<any>(null)

  useEffect(() => {
    loadThemes()
  }, [sortBy, filterBy])

  const loadThemes = async () => {
    try {
      setLoading(true)
      
      // Get company ID from localStorage or auth context
      const companyId = 'test-company-id' // This should come from auth context
      
      const params = new URLSearchParams({
        company_id: companyId,
        sort: sortBy,
        filter: filterBy
      })
      
      const response = await fetch(`/api/admin/themes?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch themes')
      }
      
      const data = await response.json()
      setThemes(data.themes || [])
    } catch (error) {
      console.error('Error loading themes:', error)
      // Fallback to mock data for development
      setThemes([
        {
          id: '1',
          name: 'Enhanced Automation and Accuracy Recognition',
          description: 'Customers appreciate PlanSwift\'s automation and accuracy features for digital takeoffs. Opportunity to enhance these capabilities further.',
          customerCount: 8,
          mentionCount: 12,
          sentiment: 0.9,
          priority: 92,
          finalPriority: 87,
          status: 'needs_review',
          tags: ['automation', 'accuracy', 'takeoffs', 'calculations'],
          strategicAlignment: 95,
          strategicReasoning: 'Strongly aligns with our desktop-first strategy and core accuracy focus. Supports our competitive advantage in takeoff precision.',
          strategicConflicts: [],
          strategicOpportunities: ['Supports "How we win: Best desktop accuracy"', 'Matches target customer (power estimators)', 'Addresses core problem (takeoff accuracy)'],
          recommendation: 'high_priority'
        },
        {
          id: '2',
          name: 'Mobile Support Enhancement for Field Measurements',
          description: 'Users need mobile access to view takeoffs and measurements while on construction sites.',
          customerCount: 11,
          mentionCount: 14,
          sentiment: 0.65,
          priority: 86,
          finalPriority: 26,
          status: 'needs_review',
          tags: ['mobile', 'field', 'measurements', 'access'],
          strategicAlignment: 30,
          strategicReasoning: 'Conflicts with desktop-first strategy and field execution is explicitly out of scope. High customer demand but strategic misalignment.',
          strategicConflicts: ['Strategic keyword "mobile" (-0.5)', 'Conflicts with "Problems we don\'t solve: Field execution"'],
          strategicOpportunities: ['Partial match: Target customer includes field workers'],
          recommendation: 'explore_lightweight'
        },
        {
          id: '3',
          name: 'Integration & Workflow Success',
          description: 'Seamless integration with Quick Bid and workflow improvements are highly requested.',
          customerCount: 6,
          mentionCount: 9,
          sentiment: 0.75,
          priority: 75,
          finalPriority: 64,
          status: 'approved',
          tags: ['integration', 'workflow', 'quickbid', 'automation'],
          strategicAlignment: 85,
          strategicReasoning: 'Aligns with strategic keyword "integration" and supports workflow efficiency goals.',
          strategicConflicts: [],
          strategicOpportunities: ['Strategic keyword "integration" (+0.6)', 'Supports "Problems we solve: Fragmented workflow"'],
          recommendation: 'medium_priority'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return 'bg-green-500'
    if (priority >= 60) return 'bg-blue-500'
    if (priority >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 80) return 'High Priority'
    if (priority >= 60) return 'Medium Priority'
    if (priority >= 40) return 'Low Priority'
    return 'Review Needed'
  }

  const getRecommendationBadge = (recommendation: string) => {
    const variants = {
      'high_priority': { variant: 'default' as const, label: 'High Priority' },
      'medium_priority': { variant: 'secondary' as const, label: 'Medium Priority' },
      'low_priority': { variant: 'outline' as const, label: 'Low Priority' },
      'explore_lightweight': { variant: 'destructive' as const, label: 'Explore Lightweight' },
      'off_strategy': { variant: 'destructive' as const, label: 'Off Strategy' }
    }
    return variants[recommendation as keyof typeof variants] || { variant: 'outline' as const, label: 'Needs Review' }
  }

  // Filter and sort themes
  const filteredThemes = themes.filter(theme => {
    if (filterBy === 'all') return true
    if (filterBy === 'in_strategy') return theme.strategicAlignment >= 70
    if (filterBy === 'off_strategy') return theme.strategicAlignment < 50
    if (filterBy === 'needs_review') return theme.status === 'needs_review'
    return true
  })

  const sortedThemes = [...filteredThemes].sort((a, b) => {
    if (sortBy === 'strategic_priority') {
      return (b.finalPriority || 0) - (a.finalPriority || 0)
    }
    if (sortBy === 'customer_signal') {
      return (b.priority || 0) - (a.priority || 0)
    }
    if (sortBy === 'strategic_alignment') {
      return (b.strategicAlignment || 0) - (a.strategicAlignment || 0)
    }
    return 0
  })

  // Calculate strategy health metrics
  const strategyHealth = {
    total: themes.length,
    aligned: themes.filter(t => t.strategicAlignment >= 70).length,
    conflicted: themes.filter(t => t.strategicAlignment < 50).length,
    needsReview: themes.filter(t => t.status === 'needs_review').length
  }

  const handleViewAnalysis = (theme: any) => {
    setSelectedTheme(theme)
    setIsModalOpen(true)
  }

  const handleThemeReview = async (themeId: string, decision: string, notes?: string, declinedReason?: string) => {
    try {
      const response = await fetch(`/api/admin/themes/${themeId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}` // This should come from auth context
        },
        body: JSON.stringify({
          decision,
          notes,
          declined_reason: declinedReason
        })
      })

      if (!response.ok) {
        throw new Error('Failed to review theme')
      }

      // Reload themes to reflect the changes
      await loadThemes()
      
      // Close modal if open
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error reviewing theme:', error)
      // You could add toast notifications here
    }
  }

  // Batch selection functions
  const handleSelectTheme = (themeId: string) => {
    const newSelected = new Set(selectedThemes)
    if (newSelected.has(themeId)) {
      newSelected.delete(themeId)
    } else {
      newSelected.add(themeId)
    }
    setSelectedThemes(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedThemes.size === filteredThemes.length) {
      setSelectedThemes(new Set())
    } else {
      setSelectedThemes(new Set(filteredThemes.map(t => t.id)))
    }
  }

  const handleBatchApprove = async () => {
    try {
      const selectedThemeIds = Array.from(selectedThemes)
      const promises = selectedThemeIds.map(themeId => 
        fetch(`/api/admin/themes/${themeId}/review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
          },
          body: JSON.stringify({
            decision: 'approve',
            notes: 'Batch approved'
          })
        })
      )

      await Promise.all(promises)
      await loadThemes()
      setSelectedThemes(new Set())
      setIsBatchMode(false)
    } catch (error) {
      console.error('Error batch approving themes:', error)
    }
  }

  const handleBatchDecline = async () => {
    try {
      const selectedThemeIds = Array.from(selectedThemes)
      const promises = selectedThemeIds.map(themeId => 
        fetch(`/api/admin/themes/${themeId}/review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
          },
          body: JSON.stringify({
            decision: 'decline',
            declined_reason: 'Batch declined - off strategy'
          })
        })
      )

      await Promise.all(promises)
      await loadThemes()
      setSelectedThemes(new Set())
      setIsBatchMode(false)
    } catch (error) {
      console.error('Error batch declining themes:', error)
    }
  }

  const handleCreateInitiative = (theme: any) => {
    setInitiativeTheme(theme)
    setIsInitiativeModalOpen(true)
  }

  const handleInitiativeCreated = async () => {
    await loadThemes()
    setIsInitiativeModalOpen(false)
    setInitiativeTheme(null)
  }

  const handleDiscoverThemes = async () => {
    try {
      const companyId = 'test-company-id' // This should come from auth context
      
      const response = await fetch('/api/admin/themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_id: companyId,
          action: 'discover_themes'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to discover themes')
      }

      const data = await response.json()
      
      // Reload themes to show new discoveries
      await loadThemes()
      
      // You could add toast notifications here
      console.log(`Discovered ${data.themes_discovered} new themes`)
    } catch (error) {
      console.error('Error discovering themes:', error)
    }
  }

  const handleAnalyzeStrategic = async () => {
    try {
      const companyId = 'test-company-id' // This should come from auth context
      
      const response = await fetch('/api/admin/themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_id: companyId,
          action: 'analyze_strategic'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze strategic alignment')
      }

      const data = await response.json()
      
      // Reload themes to show updated strategic analysis
      await loadThemes()
      
      console.log(`Analyzed ${data.themes_analyzed} themes for strategic alignment`)
    } catch (error) {
      console.error('Error analyzing strategic alignment:', error)
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
          <h1 className="text-3xl font-bold text-gray-900">Theme Review Queue</h1>
          <p className="text-gray-600 mt-1">
            Review themes with strategic context and create initiatives
          </p>
        </div>
        <div className="flex gap-2">
          {!isBatchMode ? (
            <>
              <Button variant="outline" onClick={handleDiscoverThemes}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Run Discovery
              </Button>
              <Button onClick={handleAnalyzeStrategic}>
                <Target className="mr-2 h-4 w-4" />
                Analyze Strategic
              </Button>
              <Button variant="outline" onClick={() => setIsComparisonOpen(true)}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Compare Themes
              </Button>
              <Button variant="outline" onClick={() => setIsBatchMode(true)}>
                <CheckSquare className="mr-2 h-4 w-4" />
                Batch Actions
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsBatchMode(false)}>
                <Square className="mr-2 h-4 w-4" />
                Exit Batch
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleBatchDecline}
                disabled={selectedThemes.size === 0}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Batch Decline ({selectedThemes.size})
              </Button>
              <Button 
                onClick={handleBatchApprove}
                disabled={selectedThemes.size === 0}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Batch Approve ({selectedThemes.size})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Batch Selection Controls */}
      {isBatchMode && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedThemes.size === filteredThemes.length && filteredThemes.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="font-medium">
                  {selectedThemes.size === filteredThemes.length && filteredThemes.length > 0 
                    ? 'Deselect All' 
                    : 'Select All'
                  } ({filteredThemes.length} themes)
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {selectedThemes.size} selected
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strategy Health & Controls */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-blue-800 text-lg">
              <BarChart3 className="mr-2 h-5 w-5" />
              Strategy Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-2xl font-bold text-green-600">{strategyHealth.aligned}</div>
                <div className="text-gray-600">In-Strategy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{strategyHealth.conflicted}</div>
                <div className="text-gray-600">Off-Strategy</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Filter className="mr-2 h-5 w-5" />
              View Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Sort by</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strategic_priority">Strategic Priority</SelectItem>
                    <SelectItem value="customer_signal">Customer Signal</SelectItem>
                    <SelectItem value="strategic_alignment">Strategic Alignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Filter</label>
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Themes</SelectItem>
                    <SelectItem value="in_strategy">In-Strategy</SelectItem>
                    <SelectItem value="off_strategy">Off-Strategy</SelectItem>
                    <SelectItem value="needs_review">Needs Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Themes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{themes.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {themes.filter(t => t.status === 'needs_review').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting PM decision
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {themes.filter(t => t.priority >= 80).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Strategic alignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers Affected</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {themes.reduce((sum, t) => sum + t.customerCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all themes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Themes Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedThemes.map((theme) => {
          const rec = getRecommendationBadge(theme.recommendation)
          const isSelected = selectedThemes.has(theme.id)
          return (
            <Card key={theme.id} className={`relative ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {isBatchMode && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectTheme(theme.id)}
                        className="mt-1"
                      />
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight">
                        {theme.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-3 mt-2">
                        {theme.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={rec.variant} className="ml-2">
                    {rec.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Final Priority Score */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Final Priority</span>
                      <span className="font-medium">{theme.finalPriority || theme.priority}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getPriorityColor(theme.finalPriority || theme.priority)}`}
                        style={{width: `${theme.finalPriority || theme.priority}%`}}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {getPriorityLabel(theme.finalPriority || theme.priority)}
                    </p>
                  </div>

                  {/* Strategic Alignment */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Strategic Alignment</span>
                      <span className="font-medium">{theme.strategicAlignment}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getPriorityColor(theme.strategicAlignment)}`}
                        style={{width: `${theme.strategicAlignment}%`}}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {theme.strategicAlignment >= 70 ? '🎯 Aligned' : theme.strategicAlignment < 50 ? '⚠️ Off-Strategy' : '🤔 Mixed'}
                    </p>
                  </div>

                  {/* Strategic Context */}
                  {theme.strategicConflicts && theme.strategicConflicts.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <p className="text-xs font-medium text-red-800 mb-1">Conflicts:</p>
                      <ul className="text-xs text-red-700">
                        {theme.strategicConflicts.slice(0, 2).map((conflict: string, i: number) => (
                          <li key={i}>• {conflict}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {theme.strategicOpportunities && theme.strategicOpportunities.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      <p className="text-xs font-medium text-green-800 mb-1">Opportunities:</p>
                      <ul className="text-xs text-green-700">
                        {theme.strategicOpportunities.slice(0, 2).map((opp: string, i: number) => (
                          <li key={i}>• {opp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <Users className="mr-1 h-4 w-4 text-gray-500" />
                      <span>{theme.customerCount} customers</span>
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="mr-1 h-4 w-4 text-gray-500" />
                      <span>{theme.mentionCount} mentions</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <p className="text-xs text-gray-600 mb-2">Related Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {theme.tags.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {theme.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{theme.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {theme.status === 'needs_review' ? (
                      <>
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleThemeReview(theme.id, 'approve')}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewAnalysis(theme)}
                        >
                          <Target className="mr-1 h-3 w-3" />
                          Analysis
                        </Button>
                      </>
                    ) : theme.status === 'approved' ? (
                      <>
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleCreateInitiative(theme)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Create Initiative
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewAnalysis(theme)}
                        >
                          <Target className="mr-1 h-3 w-3" />
                          Analysis
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleViewAnalysis(theme)}
                      >
                        <Target className="mr-1 h-3 w-3" />
                        View Analysis
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Setup Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <AlertCircle className="mr-2 h-5 w-5" />
            Theme Discovery Ready
          </CardTitle>
          <CardDescription className="text-blue-700">
            This shows sample themes. Run theme discovery on your actual customer feedback to see real patterns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <TrendingUp className="mr-2 h-4 w-4" />
            Run Theme Discovery
          </Button>
        </CardContent>
      </Card>

      {/* Strategic Analysis Modal */}
      <StrategicAnalysisModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        theme={selectedTheme}
        onThemeReview={handleThemeReview}
      />

      {/* Theme Comparison Tool */}
      <ThemeComparisonTool
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        themes={themes}
      />

      {/* Initiative Creation Modal */}
      <InitiativeCreationModal
        isOpen={isInitiativeModalOpen}
        onClose={() => setIsInitiativeModalOpen(false)}
        theme={initiativeTheme}
        onInitiativeCreated={handleInitiativeCreated}
      />
    </div>
  )
}
