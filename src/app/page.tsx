import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, BarChart3, Send } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Survey Insights
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Collect open-ended feedback and gain valuable insights
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/admin/login">
              <Button size="lg">Admin Dashboard</Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="border-t-4 border-t-blue-500">
            <CardHeader>
              <Send className="h-12 w-12 text-blue-500 mb-2" />
              <CardTitle>Send Surveys</CardTitle>
              <CardDescription>
                Create unique links for each respondent and send via email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• One-time email blasts</li>
                <li>• Recurring schedules</li>
                <li>• Trigger-based sending</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-green-500">
            <CardHeader>
              <FileText className="h-12 w-12 text-green-500 mb-2" />
              <CardTitle>Collect Responses</CardTitle>
              <CardDescription>
                Simple, clean survey interface that respondents love
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Open-ended questions</li>
                <li>• Mobile-friendly</li>
                <li>• Track completion rates</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-purple-500">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-purple-500 mb-2" />
              <CardTitle>Analyze Insights</CardTitle>
              <CardDescription>
                Review all responses and gain actionable insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• View all responses</li>
                <li>• Filter and search</li>
                <li>• AI-powered insights (coming soon)</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Ready to start collecting feedback?
              </CardDescription>
            </CardHeader>
            <CardContent className="text-left space-y-4">
              <div>
                <h3 className="font-semibold mb-2">For Admins:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  <li>Sign up or log in to your admin account</li>
                  <li>Create your first survey with custom questions</li>
                  <li>Generate unique links for your respondents</li>
                  <li>Send surveys via email</li>
                  <li>Review responses and insights</li>
                </ol>
              </div>
              <div>
                <h3 className="font-semibold mb-2">For Respondents:</h3>
                <p className="text-sm text-gray-600">
                  Simply click the unique link in your email, answer the questions, and submit. It's that easy!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

