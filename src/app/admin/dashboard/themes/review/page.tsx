'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle, CheckCircle, Clock, Users, MessageSquare, Target, X, Check, Eye } from 'lucide-react'

export default function ThemeReviewPage() {
  const [loading, setLoading] = useState(true)
  const [themes, setThemes] = useState<any[]>([])
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])

  useEffect(() => {
    // Simulate loading themes that need review
    setTimeout(() => {
      setThemes([
        {
          id: '1',
          name: 'Enhanced Automation and Accuracy Recognition',
          description: 'Customers appreciate PlanSwift\'s automation and accuracy features for digital takeoffs. Opportunity to enhance these capabilities further.',
          customerCount: 8,
          mentionCount: 12,
          sentiment: 0.9,
          priority: 87,
          status: 'needs_review',
          tags: ['automation', 'accuracy', 'takeoffs', 'calculations'],
          strategicAlignment: 95,
          recommendation: 'high_priority',
          customerEvidence: [
            { customer: 'C.J.', content: 'The automation is great, but sometimes the accuracy could be better on complex blueprints.' },
            { customer: 'Mike Rodriguez', content: 'Would love to see improvements in material recognition accuracy.' }
          ]
        },
        {
          id: '2',
          name: 'Mobile Support Enhancement for Field Measurements',
          description: 'Users need mobile access to view takeoffs and measurements while on construction sites.',
          customerCount: 11,
          mentionCount: 14,
          sentiment: 0.65,
          priority: 26,
          status: 'needs_review',
          tags: ['mobile', 'field', 'measurements', 'access'],
          strategicAlignment: 30,
          recommendation: 'explore_lightweight',
          customerEvidence: [
            { customer: 'John Thompson', content: 'Need mobile access to view takeoffs on job sites.' },
            { customer: 'Maria Garcia', content: 'Would be helpful to have mobile app for field measurements.' }
          ]
        },
        {
          id: '3',
          name: 'Integration & Workflow Success',
          description: 'Seamless integration with Quick Bid and workflow improvements are highly requested.',
          customerCount: 6,
          mentionCount: 9,
          sentiment: 0.75,
          priority: 64,
          status: 'needs_review',
          tags: ['integration', 'workflow', 'quickbid', 'automation'],
          strategicAlignment: 85,
          recommendation: 'medium_priority',
          customerEvidence: [
            { customer: 'David Wilson', content: 'Quick Bid integration would save us hours every week.' },
            { customer: 'Robert Johnson', content: 'Workflow improvements are critical for our team efficiency.' }
          ]
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
      'off_strategy': { variant: 'destructive' as const, label: 'Off Strategy', icon: X, color: 'text-red-600' }
    }
    return variants[recommendation as keyof typeof variants] || { variant: 'outline' as const, label: 'Needs Review', icon: Clock, color: 'text-gray-600' }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return 'bg-green-500'
    if (priority >= 60) return 'bg-blue-500'
    if (priority >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const handleSelectTheme = (themeId: string) => {
    setSelectedThemes(prev => 
      prev.includes(themeId) 
        ? prev.filter(id => id !== themeId)
        : [...prev, themeId]
    )
  }

  const handleSelectAll = () => {
    if (selectedThemes.length === themes.length) {
      setSelectedThemes([])
    } else {
      setSelectedThemes(themes.map(theme => theme.id))
    }
  }

  const handleBatchAction = async (action: string) => {
    if (selectedThemes.length === 0) return

    // Simulate batch action
    console.log(`${action} themes:`, selectedThemes)
    
    // Update themes based on action
    setThemes(prev => prev.map(theme => 
      selectedThemes.includes(theme.id)
        ? { ...theme, status: action === 'approve' ? 'approved' : action === 'decline' ? 'declined' : theme.status }
        : theme
    ))

    setSelectedThemes([])
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
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
            Review and prioritize themes based on strategic alignment and customer impact
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {themes.length} themes need review
          </Badge>
        </div>
      </div>

      {/* Batch Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedThemes.length === themes.length && themes.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-600">
                {selectedThemes.length > 0 
                  ? `${selectedThemes.length} selected` 
                  : 'Select all themes'
                }
              </span>
            </div>
            
            {selectedThemes.length > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleBatchAction('approve')}
                  variant="default"
                  size="sm"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve Selected ({selectedThemes.length})
                </Button>
                <Button
                  onClick={() => handleBatchAction('decline')}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Decline Selected ({selectedThemes.length})
                </Button>
                <Button
                  onClick={() => handleBatchAction('defer')}
                  variant="outline"
                  size="sm"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Defer to Q3
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Themes Review List */}
      <div className="space-y-4">
        {themes.map((theme) => {
          const rec = getRecommendationBadge(theme.recommendation)
          const Icon = rec.icon
          
          return (
            <Card key={theme.id} className="relative">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {/* Selection Checkbox */}
                  <Checkbox
                    checked={selectedThemes.includes(theme.id)}
                    onCheckedChange={() => handleSelectTheme(theme.id)}
                    className="mt-1"
                  />

                  {/* Theme Content */}
                  <div className="flex-1 space-y-4">
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

                    {/* Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          <span className="font-medium">{theme.customerCount}</span> customers
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          <span className="font-medium">{theme.mentionCount}</span> mentions
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          Priority: <span className="font-medium">{theme.priority}/100</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          Strategic: <span className="font-medium">{theme.strategicAlignment}/100</span>
                        </span>
                      </div>
                    </div>

                    {/* Priority Score Bar */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Final Priority Score</span>
                        <span className="font-medium">{theme.priority}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getPriorityColor(theme.priority)}`}
                          style={{width: `${theme.priority}%`}}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Customer Signal × Strategic Alignment = Final Priority
                      </p>
                    </div>

                    {/* Customer Evidence */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Customer Evidence:</h4>
                      <div className="space-y-2">
                        {theme.customerEvidence.slice(0, 2).map((evidence: any, index: number) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <div className="text-sm">
                                <span className="font-medium text-gray-900">{evidence.customer}:</span>
                                <span className="text-gray-700 ml-1">"{evidence.content}"</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {theme.customerEvidence.length > 2 && (
                          <p className="text-xs text-gray-500">
                            +{theme.customerEvidence.length - 2} more customer feedback items
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Related Tags:</h4>
                      <div className="flex flex-wrap gap-1">
                        {theme.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="default">
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Review Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                      <Button size="sm" variant="outline">
                        <Clock className="h-4 w-4 mr-1" />
                        Defer to Q3
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {themes.length === 0 && (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-600">
                No themes need review at this time. New themes will appear here as they're discovered.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
