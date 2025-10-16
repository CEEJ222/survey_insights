'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export default function TestAIPage() {
  const [text, setText] = useState('Absolutely love this product! The onboarding was smooth and the UI is beautiful. Best tool I\'ve used this year!')
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
        const errorData = await response.json()
        throw new Error(errorData.error || 'AI analysis failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Failed to analyze feedback')
    } finally {
      setLoading(false)
    }
  }

  const sampleTexts = [
    {
      label: 'Positive',
      text: 'Absolutely love this product! The onboarding was smooth and the UI is beautiful. Best tool I\'ve used this year!'
    },
    {
      label: 'Negative', 
      text: 'This is frustrating. The app crashes constantly and customer support hasn\'t responded in 3 days. Need this fixed ASAP!'
    },
    {
      label: 'Mixed',
      text: 'The features are great but the dashboard is really slow with large datasets. Would be perfect if you fix the performance issues.'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🤖 AI Analysis Test</h1>
          <p className="text-gray-600">Test the AI analysis on any feedback text</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Test Section */}
          <Card>
            <CardHeader>
              <CardTitle>Test Feedback</CardTitle>
              <CardDescription>
                Enter feedback text to see AI analysis in action
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="feedback-text">Feedback Text</Label>
                <Textarea
                  id="feedback-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter feedback text here..."
                  className="min-h-[120px]"
                />
              </div>
              
              <Button 
                onClick={testAI} 
                disabled={loading || !text.trim()}
                className="w-full"
              >
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
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>
                AI-powered insights from your feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">📝 Summary</h4>
                    <p className="text-sm bg-gray-50 p-3 rounded border">{result.summary}</p>
                  </div>

                  {/* Sentiment */}
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">😊 Sentiment Analysis</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Negative</span>
                          <span>Positive</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              result.sentiment.score > 0.3 ? 'bg-green-500' : 
                              result.sentiment.score < -0.3 ? 'bg-red-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${((result.sentiment.score + 1) / 2) * 100}%` }}
                          />
                        </div>
                        <div className="text-center mt-1">
                          <span className="text-sm font-medium">
                            {result.sentiment.score.toFixed(2)} ({result.sentiment.label})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">🏷️ Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {result.tags.map((tag: string, index: number) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Priority Score */}
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">⚠️ Priority Score</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Low (0)</span>
                          <span>High (100)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              result.priorityScore > 70 ? 'bg-red-500' : 
                              result.priorityScore > 40 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${result.priorityScore}%` }}
                          />
                        </div>
                        <div className="text-center mt-1">
                          <span className="text-sm font-medium">
                            {result.priorityScore}/100
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Click "Analyze with AI" to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sample Texts */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💡 Sample Feedback to Try
            </CardTitle>
            <CardDescription>
              Click any sample to test different types of feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {sampleTexts.map((sample, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="font-medium text-sm">{sample.label}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setText(sample.text)}
                    className="w-full text-left justify-start h-auto p-3"
                  >
                    <span className="text-xs leading-relaxed">{sample.text}</span>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            🚀 AI Integration is working! Try different feedback texts to see how the AI analyzes sentiment, 
            generates tags, and calculates priority scores.
          </p>
        </div>
      </div>
    </div>
  )
}


