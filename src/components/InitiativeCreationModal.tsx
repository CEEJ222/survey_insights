'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Users, Target, Calendar, User, Users2, FileText } from 'lucide-react'

interface InitiativeCreationModalProps {
  isOpen: boolean
  onClose: () => void
  theme: any
  onInitiativeCreated: () => void
}

export default function InitiativeCreationModal({
  isOpen,
  onClose,
  theme,
  onInitiativeCreated
}: InitiativeCreationModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    objective_id: '',
    owner_id: '',
    team_ids: [] as string[],
    effort: 'M',
    target_quarter: '',
    timeline_bucket: 'next',
    pm_notes: ''
  })
  const [objectives, setObjectives] = useState<any[]>([])
  const [adminUsers, setAdminUsers] = useState<any[]>([])

  useEffect(() => {
    if (isOpen && theme) {
      // Pre-fill form with theme data
      setFormData({
        title: theme.name || '',
        description: theme.description || '',
        objective_id: '',
        owner_id: '',
        team_ids: [],
        effort: 'M',
        target_quarter: '',
        timeline_bucket: 'next',
        pm_notes: ''
      })
      
      // Load objectives and users
      loadObjectives()
      loadAdminUsers()
    }
  }, [isOpen, theme])

  const loadObjectives = async () => {
    try {
      const response = await fetch('/api/admin/objectives')
      if (response.ok) {
        const data = await response.json()
        setObjectives(data.objectives || [])
      }
    } catch (error) {
      console.error('Error loading objectives:', error)
    }
  }

  const loadAdminUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setAdminUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error loading admin users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!theme) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/initiatives/from-theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          theme_id: theme.id,
          ...formData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create initiative')
      }

      onInitiativeCreated()
    } catch (error) {
      console.error('Error creating initiative:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!isOpen || !theme) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Initiative from Theme</h2>
            <p className="text-gray-600 mt-1">Transform approved theme into actionable initiative</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Source Theme Info */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-800 text-lg flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Source Theme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-gray-900">{theme.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{theme.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4 text-gray-500" />
                    <span>{theme.customerCount || theme.customer_count} customers</span>
                  </div>
                  <div className="flex items-center">
                    <Target className="mr-2 h-4 w-4 text-gray-500" />
                    <span>Priority: {theme.finalPriority || theme.priority}/100</span>
                  </div>
                </div>

                {theme.strategicAlignment && (
                  <div className="flex items-center">
                    <Badge variant={theme.strategicAlignment >= 70 ? 'default' : 'destructive'}>
                      Strategic: {theme.strategicAlignment}/100
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Initiative Details */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Initiative Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter initiative title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the initiative goals and expected outcomes"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="pm_notes">PM Notes</Label>
                <Textarea
                  id="pm_notes"
                  value={formData.pm_notes}
                  onChange={(e) => handleInputChange('pm_notes', e.target.value)}
                  placeholder="Additional notes about this initiative"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="owner">Owner</Label>
                <Select value={formData.owner_id} onValueChange={(value) => handleInputChange('owner_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {adminUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="objective">Link to OKR</Label>
                <Select value={formData.objective_id} onValueChange={(value) => handleInputChange('objective_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select OKR" />
                  </SelectTrigger>
                  <SelectContent>
                    {objectives.map((objective) => (
                      <SelectItem key={objective.id} value={objective.id}>
                        {objective.objective} (Q{objective.quarter})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="effort">Effort Size</Label>
                <Select value={formData.effort} onValueChange={(value) => handleInputChange('effort', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XS">XS - 1-2 weeks</SelectItem>
                    <SelectItem value="S">S - 2-4 weeks</SelectItem>
                    <SelectItem value="M">M - 1-2 months</SelectItem>
                    <SelectItem value="L">L - 2-4 months</SelectItem>
                    <SelectItem value="XL">XL - 4+ months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timeline_bucket">Timeline Bucket</Label>
                <Select value={formData.timeline_bucket} onValueChange={(value) => handleInputChange('timeline_bucket', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">Now - Current quarter</SelectItem>
                    <SelectItem value="next">Next - Next quarter</SelectItem>
                    <SelectItem value="later">Later - Future quarters</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="target_quarter">Target Quarter</Label>
                <Input
                  id="target_quarter"
                  value={formData.target_quarter}
                  onChange={(e) => handleInputChange('target_quarter', e.target.value)}
                  placeholder="e.g., Q2 2025"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Initiative'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
