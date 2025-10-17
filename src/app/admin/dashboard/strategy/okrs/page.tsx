'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Plus, Edit, Target, Clock, Users, AlertCircle } from 'lucide-react'
import { StrategicObjective, CreateOKRRequest, UpdateOKRRequest } from '@/types/database'
import OKREditor from '@/components/OKREditor'

export default function OKRPage() {
  const [objectives, setObjectives] = useState<StrategicObjective[]>([])
  const [loading, setLoading] = useState(true)
  const [showOKREditor, setShowOKREditor] = useState(false)
  const [editingOKR, setEditingOKR] = useState<StrategicObjective | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadOKRs()
  }, [])

  const loadOKRs = async () => {
    try {
      const response = await fetch('/api/admin/objectives')
      if (response.ok) {
        const data = await response.json()
        setObjectives(data.objectives || [])
      }
    } catch (error) {
      console.error('Error loading OKRs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveOKR = async (okrData: CreateOKRRequest | UpdateOKRRequest) => {
    setSaving(true)
    try {
      const url = editingOKR ? `/api/admin/objectives/${editingOKR.id}` : '/api/admin/objectives'
      const method = editingOKR ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(okrData)
      })

      if (response.ok) {
        await loadOKRs()
        setShowOKREditor(false)
        setEditingOKR(null)
      } else {
        console.error('Failed to save OKR')
      }
    } catch (error) {
      console.error('Error saving OKR:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEditOKR = (okr: StrategicObjective) => {
    setEditingOKR(okr)
    setShowOKREditor(true)
  }

  const calculateProgress = (kr: any) => {
    if (kr.current === undefined || kr.current === null) return 0
    const progress = ((kr.current - kr.baseline) / (kr.target - kr.baseline)) * 100
    return Math.max(0, Math.min(100, progress))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'completed': return 'bg-blue-500'
      case 'missed': return 'bg-red-500'
      case 'deprioritized': return 'bg-gray-500'
      default: return 'bg-yellow-500'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="secondary">Active</Badge>
      case 'completed': return <Badge variant="default">Completed</Badge>
      case 'missed': return <Badge variant="destructive">Missed</Badge>
      case 'deprioritized': return <Badge variant="outline">Deprioritized</Badge>
      default: return <Badge variant="outline">Planning</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  // Group OKRs by quarter
  const okrsByQuarter = objectives.reduce((acc, okr) => {
    if (!acc[okr.quarter]) {
      acc[okr.quarter] = []
    }
    acc[okr.quarter].push(okr)
    return acc
  }, {} as Record<string, StrategicObjective[]>)

  const quarters = Object.keys(okrsByQuarter).sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">OKRs</h1>
          <p className="text-gray-600 mt-1">
            Track progress toward your strategic objectives
          </p>
        </div>
        <Button onClick={() => setShowOKREditor(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add OKR
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total OKRs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{objectives.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all quarters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {objectives.filter(o => o.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {objectives.filter(o => o.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully achieved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {objectives.filter(o => {
                if (o.status !== 'active') return false
                const keyResults = o.key_results as any[] || []
                return keyResults.some(kr => {
                  const progress = calculateProgress(kr)
                  return progress >= 50
                })
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Meeting targets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* OKRs by Quarter */}
      {quarters.length > 0 ? (
        <div className="space-y-6">
          {quarters.map((quarter) => (
            <Card key={quarter}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  {quarter}
                </CardTitle>
                <CardDescription>
                  {okrsByQuarter[quarter].length} objective{okrsByQuarter[quarter].length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {okrsByQuarter[quarter].map((okr) => (
                    <div key={okr.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{okr.objective}</h4>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(okr.status)}
                            {okr.owner_id && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Users className="mr-1 h-4 w-4" />
                                Owner assigned
                              </div>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditOKR(okr)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>

                      {okr.key_results && Array.isArray(okr.key_results) && okr.key_results.length > 0 && (
                        <div className="space-y-3">
                          {okr.key_results.map((kr: any, index: number) => (
                            <div key={index} className="bg-gray-50 p-3 rounded">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{kr.metric}</span>
                                <span className="text-sm text-gray-600">
                                  {kr.current !== undefined ? kr.current : kr.baseline} / {kr.target} {kr.unit}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(okr.status)}`}
                                  style={{ width: `${Math.min(100, Math.max(0, calculateProgress(kr)))}%` }}
                                />
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {kr.current !== undefined 
                                  ? `${Math.round(calculateProgress(kr))}% progress`
                                  : 'Not started'
                                }
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-800">
              <AlertCircle className="mr-2 h-5 w-5" />
              No OKRs Found
            </CardTitle>
            <CardDescription className="text-amber-700">
              Create your first OKR to start tracking progress toward your strategic objectives.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => setShowOKREditor(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First OKR
            </Button>
          </CardContent>
        </Card>
      )}

      {/* OKR Editor Modal */}
      <OKREditor
        open={showOKREditor}
        onOpenChange={(open) => {
          setShowOKREditor(open)
          if (!open) setEditingOKR(null)
        }}
        okr={editingOKR}
        onSave={handleSaveOKR}
        loading={saving}
      />
    </div>
  )
}
