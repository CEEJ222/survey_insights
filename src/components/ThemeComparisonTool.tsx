'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  AlertCircle, 
  CheckCircle,
  X,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'

interface Theme {
  id: string
  name: string
  description: string
  customerCount: number
  mentionCount: number
  sentiment: number
  priority: number
  finalPriority: number
  strategicAlignment: number
  strategicReasoning: string
  strategicConflicts: string[]
  strategicOpportunities: string[]
  recommendation: string
  tags: string[]
}

interface ThemeComparisonToolProps {
  themes: Theme[]
  onClose: () => void
  isOpen: boolean
}

export default function ThemeComparisonTool({ themes, onClose, isOpen }: ThemeComparisonToolProps) {
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])
  const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'matrix'>('side-by-side')

  const handleThemeSelect = (themeId: string) => {
    if (selectedThemes.includes(themeId)) {
      setSelectedThemes(selectedThemes.filter(id => id !== themeId))
    } else if (selectedThemes.length < 3) {
      setSelectedThemes([...selectedThemes, themeId])
    }
  }

  const getSelectedThemeObjects = () => {
    return themes.filter(theme => selectedThemes.includes(theme.id))
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return 'bg-green-500'
    if (priority >= 60) return 'bg-blue-500'
    if (priority >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
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

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Theme Comparison Tool
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Theme Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Themes to Compare</CardTitle>
              <CardDescription>
                Choose up to 3 themes to compare their strategic alignment, customer signals, and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {themes.map((theme) => {
                  const isSelected = selectedThemes.includes(theme.id)
                  const rec = getRecommendationBadge(theme.recommendation)
                  
                  return (
                    <Card 
                      key={theme.id} 
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      } ${selectedThemes.length >= 3 && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => handleThemeSelect(theme.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm leading-tight">{theme.name}</h4>
                          <Badge variant={rec.variant} className="text-xs ml-2">
                            {rec.label}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-xs text-gray-600">
                          <div className="flex justify-between">
                            <span>Priority:</span>
                            <span className="font-medium">{theme.finalPriority}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Strategic:</span>
                            <span className="font-medium">{theme.strategicAlignment}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Customers:</span>
                            <span className="font-medium">{theme.customerCount}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              
              {selectedThemes.length > 0 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex gap-2">
                    <Select value={comparisonMode} onValueChange={(value: 'side-by-side' | 'matrix') => setComparisonMode(value)}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="side-by-side">Side by Side</SelectItem>
                        <SelectItem value="matrix">Comparison Matrix</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedThemes([])}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear Selection
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comparison Results */}
          {selectedThemes.length > 0 && (
            <div className="space-y-6">
              {comparisonMode === 'side-by-side' ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {getSelectedThemeObjects().map((theme) => (
                    <Card key={theme.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{theme.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {theme.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Priority Scores */}
                        <div>
                          <h5 className="font-medium mb-2">Priority Scores</h5>
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Final Priority</span>
                                <span>{theme.finalPriority}/100</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${getPriorityColor(theme.finalPriority)}`}
                                  style={{width: `${theme.finalPriority}%`}}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Strategic Alignment</span>
                                <span>{theme.strategicAlignment}/100</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${getPriorityColor(theme.strategicAlignment)}`}
                                  style={{width: `${theme.strategicAlignment}%`}}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Customer Metrics */}
                        <div>
                          <h5 className="font-medium mb-2">Customer Metrics</h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span>{theme.customerCount} customers</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-gray-500" />
                              <span>{theme.mentionCount} mentions</span>
                            </div>
                          </div>
                        </div>

                        {/* Strategic Analysis */}
                        <div>
                          <h5 className="font-medium mb-2">Strategic Analysis</h5>
                          <div className="text-sm text-gray-600 space-y-2">
                            {theme.strategicOpportunities.length > 0 && (
                              <div className="bg-green-50 border border-green-200 rounded p-2">
                                <p className="text-xs font-medium text-green-800 mb-1">Opportunities:</p>
                                <ul className="text-xs text-green-700">
                                  {theme.strategicOpportunities.slice(0, 2).map((opp, i) => (
                                    <li key={i}>• {opp}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {theme.strategicConflicts.length > 0 && (
                              <div className="bg-red-50 border border-red-200 rounded p-2">
                                <p className="text-xs font-medium text-red-800 mb-1">Conflicts:</p>
                                <ul className="text-xs text-red-700">
                                  {theme.strategicConflicts.slice(0, 2).map((conflict, i) => (
                                    <li key={i}>• {conflict}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Recommendation */}
                        <div>
                          <h5 className="font-medium mb-2">AI Recommendation</h5>
                          <Badge variant={getRecommendationBadge(theme.recommendation).variant}>
                            {getRecommendationBadge(theme.recommendation).label}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                /* Comparison Matrix */
                <Card>
                  <CardHeader>
                    <CardTitle>Comparison Matrix</CardTitle>
                    <CardDescription>
                      Side-by-side comparison of key metrics across selected themes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Metric</th>
                            {getSelectedThemeObjects().map((theme) => (
                              <th key={theme.id} className="text-center p-2 font-medium">
                                {theme.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-2 font-medium">Final Priority</td>
                            {getSelectedThemeObjects().map((theme) => (
                              <td key={theme.id} className="text-center p-2">
                                <div className="flex items-center justify-center gap-2">
                                  <span className="font-medium">{theme.finalPriority}/100</span>
                                  <div className="w-16 bg-gray-200 rounded-full h-1">
                                    <div 
                                      className={`h-1 rounded-full ${getPriorityColor(theme.finalPriority)}`}
                                      style={{width: `${theme.finalPriority}%`}}
                                    />
                                  </div>
                                </div>
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-medium">Strategic Alignment</td>
                            {getSelectedThemeObjects().map((theme) => (
                              <td key={theme.id} className="text-center p-2">
                                <div className="flex items-center justify-center gap-2">
                                  <span className="font-medium">{theme.strategicAlignment}/100</span>
                                  <div className="w-16 bg-gray-200 rounded-full h-1">
                                    <div 
                                      className={`h-1 rounded-full ${getPriorityColor(theme.strategicAlignment)}`}
                                      style={{width: `${theme.strategicAlignment}%`}}
                                    />
                                  </div>
                                </div>
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-medium">Customer Count</td>
                            {getSelectedThemeObjects().map((theme) => (
                              <td key={theme.id} className="text-center p-2 font-medium">
                                {theme.customerCount}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-medium">Mention Count</td>
                            {getSelectedThemeObjects().map((theme) => (
                              <td key={theme.id} className="text-center p-2 font-medium">
                                {theme.mentionCount}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-medium">Sentiment</td>
                            {getSelectedThemeObjects().map((theme) => (
                              <td key={theme.id} className="text-center p-2 font-medium">
                                {theme.sentiment > 0 ? '+' : ''}{theme.sentiment.toFixed(2)}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="p-2 font-medium">Recommendation</td>
                            {getSelectedThemeObjects().map((theme) => (
                              <td key={theme.id} className="text-center p-2">
                                <Badge variant={getRecommendationBadge(theme.recommendation).variant}>
                                  {getRecommendationBadge(theme.recommendation).label}
                                </Badge>
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comparison Insights */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Target className="h-5 w-5" />
                    Comparison Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    {(() => {
                      const selected = getSelectedThemeObjects()
                      const highestPriority = selected.reduce((max, theme) => 
                        theme.finalPriority > max.finalPriority ? theme : max, selected[0])
                      const lowestStrategic = selected.reduce((min, theme) => 
                        theme.strategicAlignment < min.strategicAlignment ? theme : min, selected[0])
                      const mostCustomers = selected.reduce((max, theme) => 
                        theme.customerCount > max.customerCount ? theme : max, selected[0])
                      
                      return (
                        <>
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-blue-600" />
                            <span>
                              <strong>{highestPriority.name}</strong> has the highest final priority score ({highestPriority.finalPriority}/100)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-blue-600" />
                            <span>
                              <strong>{mostCustomers.name}</strong> affects the most customers ({mostCustomers.customerCount})
                            </span>
                          </div>
                          {lowestStrategic.strategicAlignment < 70 && (
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                              <span>
                                <strong>{lowestStrategic.name}</strong> has the lowest strategic alignment ({lowestStrategic.strategicAlignment}/100) - consider strategy review
                              </span>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
