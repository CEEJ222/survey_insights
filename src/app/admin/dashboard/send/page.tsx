'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Plus, Trash2, Send, FileText, AlertCircle, Eye } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import EmailPreview from '@/components/EmailPreview'
import EmailVariables from '@/components/EmailVariables'

interface Survey {
  id: string
  title: string
  status: string
}

interface Recipient {
  id: string
  email: string
  name: string
}

export default function SendSurveyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [surveysLoading, setSurveysLoading] = useState(true)
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [selectedSurveyId, setSelectedSurveyId] = useState(
    searchParams.get('surveyId') || ''
  )
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: '1', email: '', name: '' },
  ])
  const [emailSubject, setEmailSubject] = useState('We would love your feedback')
  const [emailBody, setEmailBody] = useState(
    'Hi {name},\n\nWe value your opinion and would love to hear your feedback. Please take a few minutes to complete our survey.\n\nClick here to start: {link}\n\nThank you!'
  )
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    loadSurveys()
  }, [])

  const loadSurveys = async () => {
    try {
      setSurveysLoading(true)
      const { user } = await getCurrentUser()
      if (!user) {
        setSurveysLoading(false)
        return
      }

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('company_id')
        .eq('id', user.id)
        .single() as { data: { company_id: string } | null }

      if (!adminUser) {
        setSurveysLoading(false)
        return
      }

      // Load active surveys for the dropdown
      const { data: activeSurveys } = await supabase
        .from('surveys')
        .select('id, title, status')
        .eq('company_id', adminUser.company_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      let surveysToSet: { id: string; title: string; status: string }[] = activeSurveys || []

      // If a specific survey ID is provided in URL, check if it exists and load it
      const urlSurveyId = searchParams.get('surveyId')
      if (urlSurveyId) {
        const { data: specificSurvey, error } = await supabase
          .from('surveys')
          .select('id, title, status')
          .eq('id', urlSurveyId)
          .eq('company_id', adminUser.company_id)
          .single()

        if (specificSurvey && !error) {
          const survey = specificSurvey as { id: string; title: string; status: string }
          // If the specific survey is not active, show a message and set it as selected
          if (survey.status && survey.status !== 'active') {
            toast({
              title: 'Survey not active',
              description: `"${survey.title}" is in ${survey.status} status. Please activate it first to send.`,
              variant: 'destructive',
            })
          } else {
            // Add to surveys list if not already there
            const existsInList = surveysToSet.some(s => s.id === survey.id)
            if (!existsInList) {
              surveysToSet = [survey, ...surveysToSet]
            }
          }
          setSelectedSurveyId(survey.id)
        }
      }

      setSurveys(surveysToSet)
    } catch (error) {
      console.error('Error loading surveys:', error)
      toast({
        title: 'Error loading surveys',
        description: 'Failed to load surveys. Please refresh the page.',
        variant: 'destructive',
      })
    } finally {
      setSurveysLoading(false)
    }
  }

  const addRecipient = () => {
    setRecipients([
      ...recipients,
      { id: Date.now().toString(), email: '', name: '' },
    ])
  }

  const removeRecipient = (id: string) => {
    if (recipients.length === 1) {
      toast({
        title: 'Cannot remove',
        description: 'At least one recipient is required.',
        variant: 'destructive',
      })
      return
    }
    setRecipients(recipients.filter((r) => r.id !== id))
  }

  const updateRecipient = (id: string, field: 'email' | 'name', value: string) => {
    setRecipients(
      recipients.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    )
  }

  const handleSend = async () => {
    if (!selectedSurveyId) {
      toast({
        title: 'Select a survey',
        description: 'Please select a survey to send.',
        variant: 'destructive',
      })
      return
    }

    const validRecipients = recipients.filter((r) => r.email.trim())
    if (validRecipients.length === 0) {
      toast({
        title: 'No recipients',
        description: 'Please add at least one recipient with an email.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/send-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: selectedSurveyId,
          recipients: validRecipients,
          emailSubject,
          emailBody,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send survey')
      }

      toast({
        title: 'Surveys sent!',
        description: `Successfully sent to ${validRecipients.length} recipients.`,
      })

      router.push(`/admin/dashboard/surveys/${selectedSurveyId}`)
    } catch (error) {
      toast({
        title: 'Failed to send',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const parseCsvRecipients = (csv: string) => {
    const lines = csv.trim().split('\n')
    const newRecipients: Recipient[] = []

    lines.forEach((line, index) => {
      if (index === 0) return // Skip header if present
      const [email, name] = line.split(',').map((s) => s.trim())
      if (email) {
        newRecipients.push({
          id: Date.now().toString() + index,
          email,
          name: name || '',
        })
      }
    })

    if (newRecipients.length > 0) {
      setRecipients(newRecipients)
      toast({
        title: 'Recipients imported',
        description: `Imported ${newRecipients.length} recipients.`,
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Send Survey</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Generate unique links and send surveys to your recipients
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Survey</CardTitle>
            <CardDescription>Choose which survey to send</CardDescription>
          </CardHeader>
          <CardContent>
            {surveysLoading ? (
              <div className="w-full h-10 border border-input rounded-md bg-background px-3 py-2 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading surveys...</span>
              </div>
            ) : surveys.length === 0 ? (
              <div className="w-full border border-dashed border-muted-foreground/25 rounded-md p-6 text-center">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-sm font-medium text-foreground mb-1">No surveys available</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You need to create a survey before you can send it to recipients.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/admin/dashboard/surveys/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Survey
                </Button>
              </div>
            ) : (
              <Select value={selectedSurveyId} onValueChange={setSelectedSurveyId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a survey..." />
                </SelectTrigger>
                <SelectContent>
                  {surveys.map((survey) => (
                    <SelectItem key={survey.id} value={survey.id}>
                      {survey.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="manual" className="space-y-4">
          <TabsList>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="csv">Import CSV</TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Recipients</CardTitle>
                    <CardDescription>
                      Add recipients one by one
                    </CardDescription>
                  </div>
                  <Button type="button" onClick={addRecipient} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Recipient
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {recipients.map((recipient, index) => (
                  <div
                    key={recipient.id}
                    className="flex flex-col sm:flex-row gap-2 items-start p-3 sm:p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm">Email *</Label>
                        <Input
                          type="email"
                          placeholder="recipient@example.com"
                          value={recipient.email}
                          onChange={(e) =>
                            updateRecipient(recipient.id, 'email', e.target.value)
                          }
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm">Name (Optional)</Label>
                        <Input
                          placeholder="John Doe"
                          value={recipient.name}
                          onChange={(e) =>
                            updateRecipient(recipient.id, 'name', e.target.value)
                          }
                          className="text-sm"
                        />
                      </div>
                    </div>
                    {recipients.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRecipient(recipient.id)}
                        className="self-end sm:self-start"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="csv">
            <Card>
              <CardHeader>
                <CardTitle>Import from CSV</CardTitle>
                <CardDescription>
                  Paste CSV data (format: email, name)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="email@example.com, John Doe&#10;email2@example.com, Jane Smith"
                  rows={8}
                  onChange={(e) => parseCsvRecipients(e.target.value)}
                />
                <p className="text-sm text-gray-600 mt-2">
                  Format: email, name (one per line)
                </p>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Customize the email that will be sent (use {'{'}name{'}'} and {'{'}link{'}'} placeholders)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Message Body</Label>
                <Textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={8}
                />
              </div>
            </CardContent>
          </Card>

          <EmailVariables />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleSend} 
            disabled={loading || surveysLoading || surveys.length === 0} 
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Survey
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview Email
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Preview Dialog */}
      {showPreview && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowPreview(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Email Preview</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                ✕
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <EmailPreview
                recipients={recipients}
                emailSubject={emailSubject}
                emailBody={emailBody}
                selectedSurveyId={selectedSurveyId}
              />
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

