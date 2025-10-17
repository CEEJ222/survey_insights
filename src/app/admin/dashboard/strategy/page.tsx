'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Compass, Target, TrendingUp, Clock, Users, AlertCircle } from 'lucide-react'

export default function StrategyPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Strategy & Vision</h1>
          <p className="text-gray-600 mt-1">
            Define your company vision, strategy, and strategic objectives
          </p>
        </div>
        <Button>
          <Compass className="mr-2 h-4 w-4" />
          Edit Strategy
        </Button>
      </div>

      {/* Current Strategy Status */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vision</CardTitle>
            <Compass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">v2</div>
            <p className="text-xs text-muted-foreground">
              Last updated Q1 2025
            </p>
            <Badge variant="secondary" className="mt-2">
              Active
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Strategy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">v3</div>
            <p className="text-xs text-muted-foreground">
              Desktop-First with Strategic Mobile
            </p>
            <Badge variant="secondary" className="mt-2">
              Active
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OKRs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Active for Q2 2025
            </p>
            <Badge variant="secondary" className="mt-2">
              On Track
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Current Vision */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Compass className="mr-2 h-5 w-5" />
            Current Vision
          </CardTitle>
          <CardDescription>
            Your company's north star - what you're working towards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Vision Statement</h3>
              <p className="text-blue-800">
                "Become the most trusted construction intelligence platform for mid-market contractors"
              </p>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                Updated Q1 2025
              </div>
              <Button variant="outline" size="sm">
                View History
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="mr-2 h-5 w-5" />
            Current Strategy
          </CardTitle>
          <CardDescription>
            How you plan to achieve your vision
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Title</h4>
              <p className="text-gray-700">Desktop-First with Strategic Mobile</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Target Customer</h4>
              <p className="text-gray-700">
                Mid-market construction firms (50-500 employees) with dedicated estimating teams
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2 text-green-700">Problems We Solve</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Inaccurate takeoffs costing projects $50K+</li>
                  <li>• Fragmented bid management across tools</li>
                  <li>• Poor project intelligence for pre-construction</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 text-red-700">Problems We DON'T Solve</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Field execution / project management</li>
                  <li>• Accounting / financial management</li>
                  <li>• Small contractors (&lt;10 employees)</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">How We Win</h4>
              <p className="text-gray-700">
                Most accurate takeoff engine + best-in-class desktop UX for power users
              </p>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                Updated Q1 2025
              </div>
              <Button variant="outline" size="sm">
                View History
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active OKRs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Q2 2025 Objectives
          </CardTitle>
          <CardDescription>
            Key results that drive your strategy forward
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Reduce churn by 20%</h4>
                <Badge variant="secondary">On Track</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Churn rate</span>
                  <span>10.5% / 9.6% target</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '75%'}}></div>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Increase enterprise MAU</h4>
                <Badge variant="secondary">On Track</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Monthly active users</span>
                  <span>520 / 750 target</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '69%'}}></div>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Improve NPS</h4>
                <Badge variant="outline">Behind</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Net Promoter Score</span>
                  <span>47 / 55 target</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{width: '38%'}}></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center text-amber-800">
            <AlertCircle className="mr-2 h-5 w-5" />
            Strategy Setup Required
          </CardTitle>
          <CardDescription className="text-amber-700">
            This is a preview of your strategy dashboard. The actual data will appear once you set up your vision and strategy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="bg-amber-600 hover:bg-amber-700">
            <Compass className="mr-2 h-4 w-4" />
            Set Up Strategy
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}