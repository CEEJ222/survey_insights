'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search, Users, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface Customer {
  id: string
  email: string
  fullName: string | null
  createdAt: string
  updatedAt: string
  lastActivityAt: string | null
  healthScore: number
  totalFeedback: number
  avgSentiment: number
  highPriorityCount: number
  recentFeedback: Array<{
    id: string
    sourceType: string
    sentimentScore: number
    priorityScore: number
    createdAt: string
  }>
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [healthFilter, setHealthFilter] = useState('')
  const [error, setError] = useState('')

  const fetchCustomers = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })
      
      if (search) params.append('search', search)
      if (healthFilter) params.append('health', healthFilter)

      const response = await fetch(`/api/admin/customers?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers')
      }

      const data = await response.json()
      setCustomers(data.customers)
      setPagination(data.pagination)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers(1)
  }, [search, healthFilter])

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getHealthScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4" />
    if (score >= 60) return <TrendingUp className="h-4 w-4" />
    return <AlertTriangle className="h-4 w-4" />
  }

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-green-600'
    if (score < -0.3) return 'text-red-600'
    return 'text-gray-600'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    return formatDate(dateString)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">👥 Customers</h1>
          <p className="text-gray-600 mt-2">
            Manage and analyze your customer feedback profiles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">{pagination.total} customers</span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customers by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={healthFilter} onValueChange={setHealthFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by health" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Health Scores</SelectItem>
                <SelectItem value="80">Excellent (80+)</SelectItem>
                <SelectItem value="60">Good (60-79)</SelectItem>
                <SelectItem value="40">Fair (40-59)</SelectItem>
                <SelectItem value="20">Poor (20-39)</SelectItem>
                <SelectItem value="0">Critical (0-19)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Profiles</CardTitle>
          <CardDescription>
            View and manage individual customer feedback profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading customers...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <Button onClick={() => fetchCustomers()} className="mt-2">
                Try Again
              </Button>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-600">
                {search || healthFilter 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Customers will appear here as they submit feedback'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-lg">
                          {customer.fullName || customer.email}
                        </h3>
                        <Badge className={getHealthScoreColor(customer.healthScore)}>
                          {getHealthScoreIcon(customer.healthScore)}
                          <span className="ml-1">{customer.healthScore}/100</span>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Email:</span> {customer.email}
                        </div>
                        <div>
                          <span className="font-medium">Feedback:</span> {customer.totalFeedback} items
                        </div>
                        <div>
                          <span className="font-medium">Avg Sentiment:</span> 
                          <span className={getSentimentColor(customer.avgSentiment)}>
                            {' '}{customer.avgSentiment.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Last Active:</span> {formatRelativeTime(customer.lastActivityAt)}
                        </div>
                      </div>

                      {customer.recentFeedback.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Recent Feedback:</span>
                          {customer.recentFeedback.map((feedback, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feedback.sourceType} 
                              <span className={getSentimentColor(feedback.sentimentScore)}>
                                {' '}{feedback.sentimentScore.toFixed(1)}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      )}

                      {customer.highPriorityCount > 0 && (
                        <div className="mt-2">
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {customer.highPriorityCount} high priority issues
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <Link href={`/admin/dashboard/customers/${customer.id}`}>
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} customers
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchCustomers(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchCustomers(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
