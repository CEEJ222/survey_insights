'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Tag, 
  TrendingUp, 
  Search, 
  Merge, 
  Trash2, 
  Edit3,
  BarChart3,
  Filter,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase/client'

interface TagData {
  id: string
  name: string
  normalized_name: string
  description?: string
  category: string
  color?: string
  usage_count: number
  avg_sentiment?: number
  first_seen?: string
  last_seen?: string
  is_system_tag: boolean
  is_active: boolean
  recent_usage_count: number
  trend: 'up' | 'down' | 'stable'
}

interface ThemeData {
  id: string
  title: string
  description: string
  supporting_tags: string[]
  feedback_count: number
  avg_sentiment: number
  confidence: number
}

export default function TagsThemesSettings() {
  const [tags, setTags] = useState<TagData[]>([])
  const [themes, setThemes] = useState<ThemeData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [mergeMode, setMergeMode] = useState(false)
  const [mergeTarget, setMergeTarget] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    loadTags()
    loadThemes()
  }, [])

  const loadTags = async () => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('No authenticated user')
      }

      // Get the admin user record to get company_id
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (adminError || !adminUser) {
        throw new Error('Admin user not found')
      }

      // Query the new tags table
      const { data, error } = await supabase
        .from('tags')
        .select(`
          id,
          name,
          normalized_name,
          description,
          category,
          color,
          usage_count,
          avg_sentiment,
          first_used,
          last_used,
          is_system_tag,
          is_active,
          created_at,
          updated_at
        `)
        .eq('company_id', (adminUser as any).company_id)
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error fetching tags:', error)
        throw error
      }

      console.log('🔍 Fetched tags:', data?.length || 0, 'tags')
      console.log('🏢 Company ID:', (adminUser as any).company_id)

      // Get recent usage counts for trend calculation
      const tagIds = (data as any[])?.map(tag => tag.id) || []
      let recentUsageData: Record<string, number> = {}
      
      if (tagIds.length > 0) {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const { data: recentUsage } = await supabase
          .from('tag_usages')
          .select('tag_id')
          .in('tag_id', tagIds)
          .gte('used_at', thirtyDaysAgo.toISOString())
        
        // Count recent usage per tag
        recentUsageData = ((recentUsage as any[]) || []).reduce((acc, usage) => {
          acc[usage.tag_id] = (acc[usage.tag_id] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }

      // Transform data and calculate trends
      const tagsWithTrends = (data || []).map((tag: any) => {
        const recentCount = recentUsageData[tag.id] || 0
        const previousCount = Math.max(0, tag.usage_count - recentCount)
        const trend = recentCount > previousCount ? 'up' : 
                     recentCount < previousCount ? 'down' : 'stable'
        
        return {
          ...tag,
          first_seen: tag.first_used,
          last_seen: tag.last_used,
          recent_usage_count: recentCount,
          trend
        }
      })

      setTags(tagsWithTrends)
    } catch (error) {
      console.error('Error loading tags:', error)
      toast({
        title: 'Error',
        description: 'Failed to load tags',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadThemes = async () => {
    // Mock theme data for now - will be replaced with actual theme discovery
    setThemes([
      {
        id: '1',
        title: 'User Experience Issues',
        description: 'Feedback related to interface complexity and learning curve',
        supporting_tags: ['complicated', 'interface', 'learning', 'training'],
        feedback_count: 12,
        avg_sentiment: -0.3,
        confidence: 0.85
      },
      {
        id: '2',
        title: 'Process Efficiency',
        description: 'Positive feedback about streamlined workflows and automation',
        supporting_tags: ['streamlined', 'automated', 'organizing', 'tracking'],
        feedback_count: 8,
        avg_sentiment: 0.75,
        confidence: 0.92
      }
    ])
  }

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.normalized_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tag.description && tag.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    tag.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleTagSelect = (tag: string) => {
    if (mergeMode) {
      if (selectedTags.includes(tag)) {
        setSelectedTags(selectedTags.filter(t => t !== tag))
      } else {
        setSelectedTags([...selectedTags, tag])
      }
    }
  }

  const handleMerge = async () => {
    if (selectedTags.length < 2 || !mergeTarget) {
      toast({
        title: 'Invalid Merge',
        description: 'Select at least 2 tags and provide a target tag name',
        variant: 'destructive'
      })
      return
    }

    try {
      // TODO: Implement actual merge logic using tag_merge_log table
      toast({
        title: 'Tags Merged',
        description: `Merged ${selectedTags.length} tags into "${mergeTarget}"`,
      })
      
      setSelectedTags([])
      setMergeTarget('')
      setMergeMode(false)
      loadTags()
    } catch (error) {
      toast({
        title: 'Merge Failed',
        description: 'Failed to merge tags',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteTag = async (tag: string) => {
    try {
      // TODO: Implement tag deletion logic
      toast({
        title: 'Tag Deleted',
        description: `Deleted tag "${tag}"`,
      })
      loadTags()
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete tag',
        variant: 'destructive'
      })
    }
  }

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-green-600'
    if (sentiment < -0.3) return 'text-red-600'
    return 'text-gray-600'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />
      case 'down': return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
      default: return <div className="h-3 w-3 rounded-full bg-gray-300" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tags & Themes</h1>
        <p className="text-gray-600 mt-2">
          Manage your feedback tags and discover emerging themes
        </p>
      </div>

      <Tabs defaultValue="tags" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags ({tags.length})
          </TabsTrigger>
          <TabsTrigger value="themes" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Themes ({themes.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Tags Tab */}
        <TabsContent value="tags" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tag Management</CardTitle>
                  <CardDescription>
                    View and manage all feedback tags
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={mergeMode ? "default" : "outline"}
                    onClick={() => {
                      setMergeMode(!mergeMode)
                      setSelectedTags([])
                      setMergeTarget('')
                    }}
                  >
                    <Merge className="h-4 w-4 mr-2" />
                    {mergeMode ? 'Cancel Merge' : 'Merge Tags'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {mergeMode && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Label htmlFor="merge-target">Merge into:</Label>
                      <Input
                        id="merge-target"
                        placeholder="New tag name"
                        value={mergeTarget}
                        onChange={(e) => setMergeTarget(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleMerge}
                        disabled={selectedTags.length < 2 || !mergeTarget}
                      >
                        Merge {selectedTags.length} tags
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid gap-3">
                  {filteredTags.map((tagData) => (
                    <div
                      key={tagData.id}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTags.includes(tagData.name)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleTagSelect(tagData.name)}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: tagData.color || '#6B7280' }}
                        >
                          <Tag className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{tagData.name}</span>
                            {getTrendIcon(tagData.trend)}
                            <Badge variant="outline" className="text-xs">
                              {tagData.category}
                            </Badge>
                            {tagData.is_system_tag && (
                              <Badge variant="secondary" className="text-xs">
                                AI
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{tagData.usage_count} uses</span>
                            <span>{tagData.recent_usage_count} recent</span>
                            {tagData.avg_sentiment && (
                              <span className={getSentimentColor(tagData.avg_sentiment)}>
                                {tagData.avg_sentiment > 0 ? '+' : ''}{tagData.avg_sentiment.toFixed(2)} sentiment
                              </span>
                            )}
                            {tagData.last_seen && (
                              <span className="text-xs">
                                Last: {new Date(tagData.last_seen).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {tagData.description && (
                            <p className="text-xs text-gray-500 mt-1">{tagData.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {tagData.usage_count}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTag(tagData.name)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Themes Tab */}
        <TabsContent value="themes" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Theme Discovery</CardTitle>
                  <CardDescription>
                    AI-discovered themes from your feedback patterns
                  </CardDescription>
                </div>
                <Button variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Run Theme Discovery
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {themes.map((theme) => (
                  <div key={theme.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{theme.title}</h3>
                          <Badge variant={theme.confidence > 0.8 ? "default" : "secondary"}>
                            {Math.round(theme.confidence * 100)}% confidence
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{theme.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-4 w-4" />
                            {theme.feedback_count} feedback items
                          </span>
                          <span className={getSentimentColor(theme.avg_sentiment)}>
                            {theme.avg_sentiment > 0 ? '+' : ''}{theme.avg_sentiment.toFixed(2)} avg sentiment
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {theme.supporting_tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tags.length}</div>
                <p className="text-xs text-gray-600">Unique tags created</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Themes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{themes.length}</div>
                <p className="text-xs text-gray-600">AI-discovered themes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Sentiment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tags.length > 0 
                    ? (tags.reduce((sum, tag) => sum + (tag.avg_sentiment || 0), 0) / tags.length).toFixed(2)
                    : '0.00'
                  }
                </div>
                <p className="text-xs text-gray-600">Across all tags</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tag Usage Trends</CardTitle>
              <CardDescription>
                Most popular tags over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tags.slice(0, 10).map((tag, index) => (
                  <div key={tag.name} className="flex items-center gap-3">
                    <div className="w-8 text-sm text-gray-500">#{index + 1}</div>
                    <Tag className="h-4 w-4 text-gray-400" />
                    <span className="flex-1 font-medium">{tag.name}</span>
                    <Badge variant="secondary">{tag.usage_count}</Badge>
                    {getTrendIcon(tag.trend)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
