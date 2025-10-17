'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, CheckCircle, Target, Users, MessageSquare, TrendingUp, X } from 'lucide-react'

interface StrategicAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  theme: {
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
    status?: string
  } | null
  onThemeReview?: (themeId: string, decision: string, notes?: string, declinedReason?: string) => void
}

export default function StrategicAnalysisModal({ isOpen, onClose, theme, onThemeReview }: StrategicAnalysisModalProps) {
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewDecision, setReviewDecision] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [declinedReason, setDeclinedReason] = useState('')
  if (!theme) return null

  const getAlignmentColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getAlignmentLabel = (score: number) => {
    if (score >= 80) return 'Strongly Aligned'
    if (score >= 60) return 'Well Aligned'
    if (score >= 40) return 'Partially Aligned'
    return 'Poorly Aligned'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Strategic Analysis: {theme.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Final Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{theme.finalPriority}/100</div>
                <div className="text-xs text-gray-600">
                  Customer Signal: {theme.priority}/100 × Strategic: {theme.strategicAlignment}/100
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Strategic Alignment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getAlignmentColor(theme.strategicAlignment)}`}>
                  {theme.strategicAlignment}/100
                </div>
                <div className="text-xs text-gray-600">
                  {getAlignmentLabel(theme.strategicAlignment)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Customer Signal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{theme.priority}/100</div>
                <div className="text-xs text-gray-600">
                  {theme.customerCount} customers, {theme.mentionCount} mentions
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Strategic Reasoning */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Strategic Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">
                {theme.strategicReasoning}
              </p>
            </CardContent>
          </Card>

          {/* Alignment Breakdown */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Strategic Opportunities */}
            {theme.strategicOpportunities && theme.strategicOpportunities.length > 0 && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-green-800 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    Strategic Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {theme.strategicOpportunities.map((opportunity, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-green-600 mt-1">✓</span>
                        <span className="text-green-700">{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Strategic Conflicts */}
            {theme.strategicConflicts && theme.strategicConflicts.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-red-800 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Strategic Conflicts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {theme.strategicConflicts.map((conflict, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-red-600 mt-1">⚠</span>
                        <span className="text-red-700">{conflict}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Customer Evidence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Customer Evidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{theme.customerCount} customers affected</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{theme.mentionCount} mentions</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Sentiment: {theme.sentiment > 0 ? '+' : ''}{theme.sentiment.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Related Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {theme.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendation */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Target className="h-4 w-4" />
                AI Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge 
                  variant={theme.recommendation === 'high_priority' ? 'default' : 
                          theme.recommendation === 'medium_priority' ? 'secondary' :
                          theme.recommendation === 'explore_lightweight' ? 'destructive' : 'outline'}
                  className="text-sm"
                >
                  {theme.recommendation === 'high_priority' ? 'HIGH PRIORITY' :
                   theme.recommendation === 'medium_priority' ? 'MEDIUM PRIORITY' :
                   theme.recommendation === 'explore_lightweight' ? 'EXPLORE LIGHTWEIGHT' :
                   theme.recommendation === 'off_strategy' ? 'OFF STRATEGY' : 'NEEDS REVIEW'}
                </Badge>
                
                {theme.recommendation === 'explore_lightweight' && (
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-2">Consider lightweight solutions:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>SMS notifications for field updates</li>
                      <li>Email reports with mobile-friendly formatting</li>
                      <li>Read-only mobile web access</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Theme Review Form */}
          {showReviewForm && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-blue-800">
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Theme Review Decision
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowReviewForm(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-blue-800 mb-2 block">
                    Decision
                  </label>
                  <Select value={reviewDecision} onValueChange={setReviewDecision}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve">Approve (High Priority)</SelectItem>
                      <SelectItem value="explore_lightweight">Explore Lightweight</SelectItem>
                      <SelectItem value="needs_more_research">Needs More Research</SelectItem>
                      <SelectItem value="decline">Decline (Off Strategy)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-blue-800 mb-2 block">
                    Notes
                  </label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add your reasoning for this decision..."
                    rows={3}
                  />
                </div>
                
                {reviewDecision === 'decline' && (
                  <div>
                    <label className="text-sm font-medium text-blue-800 mb-2 block">
                      Decline Reason
                    </label>
                    <Textarea
                      value={declinedReason}
                      onChange={(e) => setDeclinedReason(e.target.value)}
                      placeholder="Why is this theme off-strategy?"
                      rows={2}
                    />
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      if (onThemeReview && reviewDecision) {
                        onThemeReview(theme.id, reviewDecision, reviewNotes, declinedReason)
                        setShowReviewForm(false)
                        setReviewDecision('')
                        setReviewNotes('')
                        setDeclinedReason('')
                      }
                    }}
                    disabled={!reviewDecision}
                    className="flex-1"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Submit Review
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowReviewForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {theme.status === 'needs_review' && !showReviewForm && (
              <Button 
                className="flex-1"
                onClick={() => setShowReviewForm(true)}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Review Theme
              </Button>
            )}
            <Button variant="outline" className="flex-1">
              <Target className="mr-2 h-4 w-4" />
              Create Initiative
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
