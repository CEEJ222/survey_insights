'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Trash2 } from 'lucide-react'
import { ProductStrategy, CreateStrategyRequest, UpdateStrategyRequest, StrategicKeyword, Competitor } from '@/types/database'

interface StrategyEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  strategy?: ProductStrategy | null
  onSave: (strategy: CreateStrategyRequest | UpdateStrategyRequest) => void
  loading?: boolean
}

export default function StrategyEditor({ 
  open, 
  onOpenChange, 
  strategy, 
  onSave, 
  loading = false 
}: StrategyEditorProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_customer_description: '',
    target_customer_segments: [] as string[],
    problems_we_solve: [] as string[],
    problems_we_dont_solve: [] as string[],
    how_we_win: '',
    strategic_keywords: [] as StrategicKeyword[],
    competitors: [] as Competitor[],
    update_reason: '',
    what_we_learned: ''
  })

  const [newSegment, setNewSegment] = useState('')
  const [newProblem, setNewProblem] = useState('')
  const [newExclusion, setNewExclusion] = useState('')
  const [newKeyword, setNewKeyword] = useState('')
  const [newKeywordWeight, setNewKeywordWeight] = useState(0.5)
  const [newKeywordReasoning, setNewKeywordReasoning] = useState('')
  const [newCompetitor, setNewCompetitor] = useState({
    name: '',
    their_strength: '',
    our_differentiation: ''
  })

  useEffect(() => {
    if (strategy) {
      setFormData({
        title: strategy.title || '',
        description: strategy.description || '',
        target_customer_description: strategy.target_customer_description || '',
        target_customer_segments: strategy.target_customer_segments || [],
        problems_we_solve: strategy.problems_we_solve || [],
        problems_we_dont_solve: strategy.problems_we_dont_solve || [],
        how_we_win: strategy.how_we_win || '',
        strategic_keywords: (strategy.strategic_keywords as StrategicKeyword[]) || [],
        competitors: (strategy.competitors as Competitor[]) || [],
        update_reason: strategy.update_reason || '',
        what_we_learned: strategy.what_we_learned || ''
      })
    } else {
      setFormData({
        title: '',
        description: '',
        target_customer_description: '',
        target_customer_segments: [],
        problems_we_solve: [],
        problems_we_dont_solve: [],
        how_we_win: '',
        strategic_keywords: [],
        competitors: [],
        update_reason: '',
        what_we_learned: ''
      })
    }
  }, [strategy])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const addSegment = () => {
    if (newSegment.trim()) {
      setFormData(prev => ({
        ...prev,
        target_customer_segments: [...prev.target_customer_segments, newSegment.trim()]
      }))
      setNewSegment('')
    }
  }

  const removeSegment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      target_customer_segments: prev.target_customer_segments.filter((_, i) => i !== index)
    }))
  }

  const addProblem = () => {
    if (newProblem.trim()) {
      setFormData(prev => ({
        ...prev,
        problems_we_solve: [...prev.problems_we_solve, newProblem.trim()]
      }))
      setNewProblem('')
    }
  }

  const removeProblem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      problems_we_solve: prev.problems_we_solve.filter((_, i) => i !== index)
    }))
  }

  const addExclusion = () => {
    if (newExclusion.trim()) {
      setFormData(prev => ({
        ...prev,
        problems_we_dont_solve: [...prev.problems_we_dont_solve, newExclusion.trim()]
      }))
      setNewExclusion('')
    }
  }

  const removeExclusion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      problems_we_dont_solve: prev.problems_we_dont_solve.filter((_, i) => i !== index)
    }))
  }

  const addKeyword = () => {
    if (newKeyword.trim()) {
      setFormData(prev => ({
        ...prev,
        strategic_keywords: [...prev.strategic_keywords, {
          keyword: newKeyword.trim(),
          weight: newKeywordWeight,
          reasoning: newKeywordReasoning.trim()
        }]
      }))
      setNewKeyword('')
      setNewKeywordWeight(0.5)
      setNewKeywordReasoning('')
    }
  }

  const removeKeyword = (index: number) => {
    setFormData(prev => ({
      ...prev,
      strategic_keywords: prev.strategic_keywords.filter((_, i) => i !== index)
    }))
  }

  const addCompetitor = () => {
    if (newCompetitor.name.trim() && newCompetitor.their_strength.trim() && newCompetitor.our_differentiation.trim()) {
      setFormData(prev => ({
        ...prev,
        competitors: [...prev.competitors, { ...newCompetitor }]
      }))
      setNewCompetitor({ name: '', their_strength: '', our_differentiation: '' })
    }
  }

  const removeCompetitor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      competitors: prev.competitors.filter((_, i) => i !== index)
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {strategy ? 'Edit Strategy' : 'Create New Strategy'}
          </DialogTitle>
          <DialogDescription>
            Define your product strategy to align customer themes with business goals.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Strategy Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Strategy Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Desktop-First with Strategic Mobile"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this strategy..."
              rows={3}
            />
          </div>

          {/* Target Customer */}
          <div className="space-y-2">
            <Label htmlFor="target_customer">Target Customer Description</Label>
            <Textarea
              id="target_customer"
              value={formData.target_customer_description}
              onChange={(e) => setFormData(prev => ({ ...prev, target_customer_description: e.target.value }))}
              placeholder="e.g., Mid-market construction firms (50-500 employees) with dedicated estimating teams"
              rows={3}
            />
          </div>

          {/* Customer Segments */}
          <div className="space-y-2">
            <Label>Target Customer Segments</Label>
            <div className="flex gap-2">
              <Input
                value={newSegment}
                onChange={(e) => setNewSegment(e.target.value)}
                placeholder="Add customer segment..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSegment())}
              />
              <Button type="button" onClick={addSegment} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.target_customer_segments.map((segment, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {segment}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeSegment(index)} />
                </Badge>
              ))}
            </div>
          </div>

          {/* Problems We Solve */}
          <div className="space-y-2">
            <Label>Problems We Solve</Label>
            <div className="flex gap-2">
              <Input
                value={newProblem}
                onChange={(e) => setNewProblem(e.target.value)}
                placeholder="Add problem we solve..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addProblem())}
              />
              <Button type="button" onClick={addProblem} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {formData.problems_we_solve.map((problem, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                  <span className="text-green-600">✓</span>
                  <span className="flex-1">{problem}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProblem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Problems We DON'T Solve */}
          <div className="space-y-2">
            <Label>Problems We DON'T Solve</Label>
            <div className="flex gap-2">
              <Input
                value={newExclusion}
                onChange={(e) => setNewExclusion(e.target.value)}
                placeholder="Add problem we don't solve..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExclusion())}
              />
              <Button type="button" onClick={addExclusion} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {formData.problems_we_dont_solve.map((exclusion, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                  <span className="text-red-600">✗</span>
                  <span className="flex-1">{exclusion}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExclusion(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* How We Win */}
          <div className="space-y-2">
            <Label htmlFor="how_we_win">How We Win</Label>
            <Textarea
              id="how_we_win"
              value={formData.how_we_win}
              onChange={(e) => setFormData(prev => ({ ...prev, how_we_win: e.target.value }))}
              placeholder="e.g., Most accurate takeoff engine + best-in-class desktop UX for power users"
              rows={3}
            />
          </div>

          {/* Strategic Keywords */}
          <div className="space-y-2">
            <Label>Strategic Keywords</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Keyword..."
              />
              <Input
                type="number"
                step="0.1"
                min="-1"
                max="1"
                value={newKeywordWeight}
                onChange={(e) => setNewKeywordWeight(parseFloat(e.target.value))}
                placeholder="Weight (-1 to +1)"
              />
              <Input
                value={newKeywordReasoning}
                onChange={(e) => setNewKeywordReasoning(e.target.value)}
                placeholder="Reasoning..."
              />
            </div>
            <Button type="button" onClick={addKeyword} size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Keyword
            </Button>
            <div className="space-y-2">
              {formData.strategic_keywords.map((keyword, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <Badge variant={keyword.weight > 0 ? "default" : "destructive"}>
                    {keyword.keyword} ({keyword.weight > 0 ? '+' : ''}{keyword.weight})
                  </Badge>
                  <span className="text-sm text-gray-600 flex-1">{keyword.reasoning}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeKeyword(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Competitors */}
          <div className="space-y-2">
            <Label>Competitors</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                value={newCompetitor.name}
                onChange={(e) => setNewCompetitor(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Competitor name..."
              />
              <Input
                value={newCompetitor.their_strength}
                onChange={(e) => setNewCompetitor(prev => ({ ...prev, their_strength: e.target.value }))}
                placeholder="Their strength..."
              />
              <Input
                value={newCompetitor.our_differentiation}
                onChange={(e) => setNewCompetitor(prev => ({ ...prev, our_differentiation: e.target.value }))}
                placeholder="Our differentiation..."
              />
            </div>
            <Button type="button" onClick={addCompetitor} size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Competitor
            </Button>
            <div className="space-y-2">
              {formData.competitors.map((competitor, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{competitor.name}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCompetitor(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong>Their strength:</strong> {competitor.their_strength}</p>
                    <p><strong>Our differentiation:</strong> {competitor.our_differentiation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Update Reason */}
          <div className="space-y-2">
            <Label htmlFor="update_reason">Update Reason</Label>
            <Input
              id="update_reason"
              value={formData.update_reason}
              onChange={(e) => setFormData(prev => ({ ...prev, update_reason: e.target.value }))}
              placeholder="Why are you updating this strategy?"
            />
          </div>

          {/* What We Learned */}
          <div className="space-y-2">
            <Label htmlFor="what_we_learned">What We Learned</Label>
            <Textarea
              id="what_we_learned"
              value={formData.what_we_learned}
              onChange={(e) => setFormData(prev => ({ ...prev, what_we_learned: e.target.value }))}
              placeholder="Key insights that led to this strategy update..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title.trim()}>
              {loading ? 'Saving...' : strategy ? 'Update Strategy' : 'Create Strategy'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
