'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export default function AITestPage() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const testAI = async () => {
    if (!text.trim()) {
      setError('Please enter some feedback text')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/admin/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error('AI analysis failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Failed to analyze feedback')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">🤖 AI Analysis Test</h1>
        <p className="text-gray-600 mt-2">
          Test the AI analysis on any feedback text
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Feedback</CardTitle>
          <CardDescription>
            Enter feedback text to see AI analysis in action
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text">Feedback Text</Label>
            <Textarea
              id="text"
              placeholder="e.g., The onboarding process was confusing and I almost gave up. The dashboard is slow and takes forever to load. Otherwise, I love the product!"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
            />
          </div>

          <Button onClick={testAI} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze with AI'
            )}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📝 Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{result.summary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>😊 Sentiment Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Score:</span>
                  <span className="font-semibold">
                    {result.sentiment.score.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Label:</span>
                  <span
                    className={`font-semibold px-3 py-1 rounded-full ${
                      result.sentiment.label === 'positive'
                        ? 'bg-green-100 text-green-700'
                        : result.sentiment.label === 'negative'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {result.sentiment.label}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        result.sentiment.score > 0
                          ? 'bg-green-500'
                          : result.sentiment.score < 0
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                      }`}
                      style={{
                        width: `${((result.sentiment.score + 1) / 2) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Very Negative</span>
                    <span>Neutral</span>
                    <span>Very Positive</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🏷️ Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.tags.map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>⚠️ Priority Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Urgency Level:</span>
                  <span className="font-semibold text-2xl">
                    {result.priorityScore}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      result.priorityScore >= 75
                        ? 'bg-red-500'
                        : result.priorityScore >= 50
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${result.priorityScore}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Low Priority</span>
                  <span>Medium</span>
                  <span>High Priority</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {result.cost && (
            <Card>
              <CardHeader>
                <CardTitle>💰 Cost Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Tokens:</span>
                    <span>{result.cost.totalTokens}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Cost:</span>
                    <span className="font-semibold">
                      ${result.cost.estimatedCost.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cache Hit:</span>
                    <span>{result.cost.cacheHit ? '✅ Yes (Free!)' : '❌ No'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle>💡 Sample Feedback to Try</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="font-semibold">Positive:</p>
          <p className="text-gray-700 italic">
            "Absolutely love this product! The onboarding was smooth and the UI is beautiful. Best tool I've used this year!"
          </p>
          
          <p className="font-semibold mt-4">Negative:</p>
          <p className="text-gray-700 italic">
            "This is frustrating. The app crashes constantly and customer support hasn't responded in 3 days. Need this fixed ASAP!"
          </p>
          
          <p className="font-semibold mt-4">Mixed:</p>
          <p className="text-gray-700 italic">
            "The features are great but the dashboard is really slow with large datasets. Would be perfect if you fix the performance issues."
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

