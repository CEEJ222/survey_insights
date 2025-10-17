'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { History, Clock, User, Eye, Target, ChevronDown, ChevronRight } from 'lucide-react'
import { ProductStrategy, CompanyVision } from '@/types/database'

interface StrategyHistoryData {
  strategies: ProductStrategy[]
  visions: CompanyVision[]
}

export default function StrategyHistoryPage() {
  const [data, setData] = useState<StrategyHistoryData>({
    strategies: [],
    visions: []
  })
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<{
    strategies: boolean
    visions: boolean
  }>({
    strategies: true,
    visions: true
  })

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const [strategiesRes, visionsRes] = await Promise.all([
        fetch('/api/admin/strategy/history'),
        fetch('/api/admin/vision/history')
      ])

      const strategiesData = await strategiesRes.json()
      const visionsData = await visionsRes.json()

      setData({
        strategies: strategiesData.strategies || [],
        visions: visionsData.visions || []
      })
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Strategy History</h1>
          <p className="text-gray-600 mt-1">
            Track changes and evolution of your company vision and strategy
          </p>
        </div>
      </div>

      {/* Strategy History */}
      <Card>
        <CardHeader>
          <Button
            variant="ghost"
            className="w-full justify-start p-0 h-auto"
            onClick={() => toggleSection('strategies')}
          >
            <div className="flex items-center w-full">
              {expandedSections.strategies ? (
                <ChevronDown className="mr-2 h-4 w-4" />
              ) : (
                <ChevronRight className="mr-2 h-4 w-4" />
              )}
              <Target className="mr-2 h-5 w-5" />
              <CardTitle>Strategy Versions ({data.strategies.length})</CardTitle>
            </div>
          </Button>
          <CardDescription>
            Evolution of your product strategy over time
          </CardDescription>
        </CardHeader>
        {expandedSections.strategies && (
          <CardContent>
            {data.strategies.length > 0 ? (
              <div className="space-y-4">
                {data.strategies.map((strategy) => (
                  <div key={strategy.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{strategy.title}</h4>
                          <Badge variant={strategy.is_active ? "default" : "secondary"}>
                            v{strategy.version} {strategy.is_active ? "(Active)" : "(Archived)"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Clock className="mr-1 h-4 w-4" />
                            {formatDate(strategy.created_at)}
                          </div>
                          {strategy.created_by && (
                            <div className="flex items-center">
                              <User className="mr-1 h-4 w-4" />
                              Created by admin
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {strategy.description && (
                      <p className="text-gray-700 mb-3">{strategy.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {strategy.target_customer_description && (
                        <div>
                          <h5 className="font-medium mb-1">Target Customer</h5>
                          <p className="text-gray-600">{strategy.target_customer_description}</p>
                        </div>
                      )}
                      
                      {strategy.how_we_win && (
                        <div>
                          <h5 className="font-medium mb-1">How We Win</h5>
                          <p className="text-gray-600">{strategy.how_we_win}</p>
                        </div>
                      )}
                    </div>

                    {strategy.problems_we_solve && strategy.problems_we_solve.length > 0 && (
                      <div className="mt-3">
                        <h5 className="font-medium mb-1 text-green-700">Problems We Solve</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {strategy.problems_we_solve.map((problem, index) => (
                            <li key={index}>• {problem}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {strategy.problems_we_dont_solve && strategy.problems_we_dont_solve.length > 0 && (
                      <div className="mt-3">
                        <h5 className="font-medium mb-1 text-red-700">Problems We DON'T Solve</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {strategy.problems_we_dont_solve.map((problem, index) => (
                            <li key={index}>• {problem}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {strategy.strategic_keywords && Array.isArray(strategy.strategic_keywords) && strategy.strategic_keywords.length > 0 && (
                      <div className="mt-3">
                        <h5 className="font-medium mb-2">Strategic Keywords</h5>
                        <div className="flex flex-wrap gap-2">
                          {strategy.strategic_keywords.map((keyword: any, index: number) => (
                            <Badge 
                              key={index} 
                              variant={keyword.weight > 0 ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {keyword.keyword} ({keyword.weight > 0 ? '+' : ''}{keyword.weight})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {strategy.update_reason && (
                      <div className="mt-3 p-3 bg-blue-50 rounded">
                        <h5 className="font-medium text-blue-900 mb-1">Update Reason</h5>
                        <p className="text-sm text-blue-800">{strategy.update_reason}</p>
                      </div>
                    )}

                    {strategy.what_we_learned && (
                      <div className="mt-3 p-3 bg-green-50 rounded">
                        <h5 className="font-medium text-green-900 mb-1">What We Learned</h5>
                        <p className="text-sm text-green-800">{strategy.what_we_learned}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Strategy History</h3>
                <p className="text-gray-600">
                  Strategy versions will appear here once you create your first strategy.
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Vision History */}
      <Card>
        <CardHeader>
          <Button
            variant="ghost"
            className="w-full justify-start p-0 h-auto"
            onClick={() => toggleSection('visions')}
          >
            <div className="flex items-center w-full">
              {expandedSections.visions ? (
                <ChevronDown className="mr-2 h-4 w-4" />
              ) : (
                <ChevronRight className="mr-2 h-4 w-4" />
              )}
              <Eye className="mr-2 h-5 w-5" />
              <CardTitle>Vision Versions ({data.visions.length})</CardTitle>
            </div>
          </Button>
          <CardDescription>
            Evolution of your company vision over time
          </CardDescription>
        </CardHeader>
        {expandedSections.visions && (
          <CardContent>
            {data.visions.length > 0 ? (
              <div className="space-y-4">
                {data.visions.map((vision) => (
                  <div key={vision.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">Vision v{vision.version}</h4>
                          <Badge variant={vision.is_active ? "default" : "secondary"}>
                            {vision.is_active ? "Active" : "Archived"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Clock className="mr-1 h-4 w-4" />
                            {formatDate(vision.created_at)}
                          </div>
                          {vision.created_by && (
                            <div className="flex items-center">
                              <User className="mr-1 h-4 w-4" />
                              Created by admin
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h5 className="font-medium mb-1">Vision Statement</h5>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded">
                          "{vision.vision_statement}"
                        </p>
                      </div>

                      {vision.mission_statement && (
                        <div>
                          <h5 className="font-medium mb-1">Mission Statement</h5>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded">
                            "{vision.mission_statement}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Vision History</h3>
                <p className="text-gray-600">
                  Vision versions will appear here once you create your first vision.
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
