'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, Mail, User } from 'lucide-react'

interface EmailPreviewProps {
  recipients: Array<{
    id: string
    email: string
    name: string
  }>
  emailSubject: string
  emailBody: string
  selectedSurveyId?: string
}

export default function EmailPreview({ 
  recipients, 
  emailSubject, 
  emailBody, 
  selectedSurveyId 
}: EmailPreviewProps) {
  // Filter out recipients without email addresses
  const validRecipients = recipients.filter(r => r.email.trim())
  
  // Generate preview data for the first valid recipient
  const previewRecipient = validRecipients[0]
  
  // Create a sample survey link (in real implementation, this would be the actual link)
  const sampleLink = selectedSurveyId 
    ? `https://yoursurveyapp.com/survey/${selectedSurveyId}?token=abc123def456`
    : 'https://yoursurveyapp.com/survey/sample-survey?token=abc123def456'
  
  // Replace placeholders in subject and body
  const renderText = (text: string, recipientName: string, link: string) => {
    return text
      .replace(/{name}/g, recipientName || 'Recipient')
      .replace(/{link}/g, link)
  }
  
  const previewSubject = previewRecipient 
    ? renderText(emailSubject, previewRecipient.name, sampleLink)
    : emailSubject.replace(/{name}/g, 'Recipient').replace(/{link}/g, sampleLink)
    
  const previewBody = previewRecipient
    ? renderText(emailBody, previewRecipient.name, sampleLink)
    : emailBody.replace(/{name}/g, 'Recipient').replace(/{link}/g, sampleLink)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Email Preview
          </CardTitle>
          <CardDescription>
            This is how the email will appear to your recipients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {validRecipients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Add recipients to see email preview</p>
            </div>
          ) : (
            <>
              {/* Email Header */}
              <div className="border-b pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">To: {previewRecipient?.email}</span>
                  {previewRecipient?.name && (
                    <Badge variant="secondary" className="text-xs">
                      {previewRecipient.name}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Subject: <span className="font-medium text-foreground">{previewSubject}</span>
                </div>
              </div>

              {/* Email Body Preview */}
              <div className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {previewBody.split('\n').map((line, index) => {
                      // Check if this line contains a URL
                      const urlRegex = /(https?:\/\/[^\s]+)/g
                      const parts = line.split(urlRegex)
                      
                      return (
                        <div key={index}>
                          {parts.map((part, partIndex) => {
                            if (urlRegex.test(part)) {
                              return (
                                <a
                                  key={partIndex}
                                  href={part}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline break-all"
                                >
                                  {part}
                                </a>
                              )
                            }
                            return part
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Recipients Summary */}
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Will be sent to {validRecipients.length} recipient{validRecipients.length !== 1 ? 's' : ''}
                  </span>
                  {validRecipients.length > 1 && (
                    <Badge variant="outline" className="text-xs">
                      +{validRecipients.length - 1} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Placeholder Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-xs text-blue-800">
                  <strong>Preview:</strong> This shows how the email will look with placeholders replaced. Each recipient will receive a unique survey link when the email is sent.
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
