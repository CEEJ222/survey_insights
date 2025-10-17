'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Trash2, Target } from 'lucide-react'
import { StrategicObjective, CreateOKRRequest, UpdateOKRRequest, KeyResult } from '@/types/database'

interface OKREditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  okr?: StrategicObjective | null
  onSave: (okr: CreateOKRRequest | UpdateOKRRequest) => void
  loading?: boolean
}

export default function OKREditor({ 
  open, 
  onOpenChange, 
  okr, 
  onSave, 
  loading = false 
}: OKREditorProps) {
  const [formData, setFormData] = useState({
    objective: '',
    quarter: '',
    key_results: [] as KeyResult[],
    owner_id: '',
    starts_at: '',
    ends_at: '',
    status: 'planning' as 'planning' | 'active' | 'completed' | 'missed' | 'deprioritized'
  })

  const [newKeyResult, setNewKeyResult] = useState({
    metric: '',
    baseline: 0,
    target: 0,
    current: 0,
    unit: ''
  })

  useEffect(() => {
    if (okr) {
      setFormData({
        objective: okr.objective || '',
        quarter: okr.quarter || '',
        key_results: (okr.key_results as KeyResult[]) || [],
        owner_id: okr.owner_id || '',
        starts_at: okr.starts_at ? okr.starts_at.split('T')[0] : '',
        ends_at: okr.ends_at ? okr.ends_at.split('T')[0] : '',
        status: okr.status as any || 'planning'
      })
    } else {
      // Set default quarter for new OKR
      const now = new Date()
      const quarter = Math.ceil((now.getMonth() + 1) / 3)
      const year = now.getFullYear()
      const currentQuarter = `Q${quarter} ${year}`
      
      setFormData({
        objective: '',
        quarter: currentQuarter,
        key_results: [],
        owner_id: '',
        starts_at: '',
        ends_at: '',
        status: 'planning'
      })
    }
  }, [okr])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const addKeyResult = () => {
    if (newKeyResult.metric.trim() && newKeyResult.unit.trim()) {
      setFormData(prev => ({
        ...prev,
        key_results: [...prev.key_results, { ...newKeyResult }]
      }))
      setNewKeyResult({
        metric: '',
        baseline: 0,
        target: 0,
        current: 0,
        unit: ''
      })
    }
  }

  const removeKeyResult = (index: number) => {
    setFormData(prev => ({
      ...prev,
      key_results: prev.key_results.filter((_, i) => i !== index)
    }))
  }

  const updateKeyResult = (index: number, field: keyof KeyResult, value: any) => {
    setFormData(prev => ({
      ...prev,
      key_results: prev.key_results.map((kr, i) => 
        i === index ? { ...kr, [field]: value } : kr
      )
    }))
  }

  const getQuarterOptions = () => {
    const quarters = []
    const now = new Date()
    const currentYear = now.getFullYear()
    
    for (let year = currentYear - 1; year <= currentYear + 2; year++) {
      for (let q = 1; q <= 4; q++) {
        quarters.push(`Q${q} ${year}`)
      }
    }
    return quarters
  }

  const calculateProgress = (kr: KeyResult) => {
    if (kr.current === undefined || kr.current === null) return 0
    const progress = ((kr.current - kr.baseline) / (kr.target - kr.baseline)) * 100
    return Math.max(0, Math.min(100, progress))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {okr ? 'Edit OKR' : 'Create New OKR'}
          </DialogTitle>
          <DialogDescription>
            Define quarterly objectives and key results to track progress toward your strategy.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Objective */}
          <div className="space-y-2">
            <Label htmlFor="objective">Objective *</Label>
            <Textarea
              id="objective"
              value={formData.objective}
              onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
              placeholder="e.g., Reduce churn by 20% through improved onboarding experience"
              rows={3}
              required
            />
          </div>

          {/* Quarter */}
          <div className="space-y-2">
            <Label htmlFor="quarter">Quarter *</Label>
            <Select value={formData.quarter} onValueChange={(value) => setFormData(prev => ({ ...prev, quarter: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select quarter" />
              </SelectTrigger>
              <SelectContent>
                {getQuarterOptions().map((quarter) => (
                  <SelectItem key={quarter} value={quarter}>
                    {quarter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
                <SelectItem value="deprioritized">Deprioritized</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="starts_at">Start Date</Label>
              <Input
                id="starts_at"
                type="date"
                value={formData.starts_at}
                onChange={(e) => setFormData(prev => ({ ...prev, starts_at: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ends_at">End Date</Label>
              <Input
                id="ends_at"
                type="date"
                value={formData.ends_at}
                onChange={(e) => setFormData(prev => ({ ...prev, ends_at: e.target.value }))}
              />
            </div>
          </div>

          {/* Key Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Key Results</Label>
              <Badge variant="outline">{formData.key_results.length} metrics</Badge>
            </div>

            {/* Add New Key Result */}
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
              <h4 className="font-medium mb-3">Add Key Result</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <Input
                  value={newKeyResult.metric}
                  onChange={(e) => setNewKeyResult(prev => ({ ...prev, metric: e.target.value }))}
                  placeholder="Metric name..."
                />
                <Input
                  type="number"
                  value={newKeyResult.baseline}
                  onChange={(e) => setNewKeyResult(prev => ({ ...prev, baseline: parseFloat(e.target.value) || 0 }))}
                  placeholder="Baseline"
                />
                <Input
                  type="number"
                  value={newKeyResult.target}
                  onChange={(e) => setNewKeyResult(prev => ({ ...prev, target: parseFloat(e.target.value) || 0 }))}
                  placeholder="Target"
                />
                <Input
                  type="number"
                  value={newKeyResult.current}
                  onChange={(e) => setNewKeyResult(prev => ({ ...prev, current: parseFloat(e.target.value) || 0 }))}
                  placeholder="Current"
                />
                <Input
                  value={newKeyResult.unit}
                  onChange={(e) => setNewKeyResult(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="Unit (%, $, etc.)"
                />
              </div>
              <Button type="button" onClick={addKeyResult} size="sm" className="mt-3">
                <Plus className="h-4 w-4 mr-2" />
                Add Key Result
              </Button>
            </div>

            {/* Existing Key Results */}
            <div className="space-y-3">
              {formData.key_results.map((kr, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{kr.metric}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeKeyResult(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-sm">Baseline</Label>
                      <Input
                        type="number"
                        value={kr.baseline}
                        onChange={(e) => updateKeyResult(index, 'baseline', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Target</Label>
                      <Input
                        type="number"
                        value={kr.target}
                        onChange={(e) => updateKeyResult(index, 'target', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Current</Label>
                      <Input
                        type="number"
                        value={kr.current || ''}
                        onChange={(e) => updateKeyResult(index, 'current', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Unit</Label>
                      <Input
                        value={kr.unit}
                        onChange={(e) => updateKeyResult(index, 'unit', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {kr.current !== undefined && kr.current !== null && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{Math.round(calculateProgress(kr))}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, calculateProgress(kr)))}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.objective.trim() || !formData.quarter}>
              {loading ? 'Saving...' : okr ? 'Update OKR' : 'Create OKR'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
