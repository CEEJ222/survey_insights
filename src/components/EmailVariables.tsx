'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Copy, Check, User, Link, Calendar, Building, Mail } from 'lucide-react'
import { useState } from 'react'

interface EmailVariablesProps {
  onVariableClick?: (variable: string) => void
}

export default function EmailVariables({ onVariableClick }: EmailVariablesProps) {
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null)

  const copyToClipboard = async (variable: string) => {
    try {
      await navigator.clipboard.writeText(variable)
      setCopiedVariable(variable)
      setTimeout(() => setCopiedVariable(null), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const handleVariableClick = (variable: string) => {
    if (onVariableClick) {
      onVariableClick(variable)
    }
    copyToClipboard(variable)
  }

  const variables = [
    {
      category: 'Recipient Information',
      icon: <User className="h-4 w-4" />,
      variables: [
        {
          name: '{name}',
          description: 'Recipient\'s name (or "there" if not provided)',
          example: 'John Doe'
        },
        {
          name: '{email}',
          description: 'Recipient\'s email address',
          example: 'john@example.com'
        }
      ]
    },
    {
      category: 'Survey Links',
      icon: <Link className="h-4 w-4" />,
      variables: [
        {
          name: '{link}',
          description: 'Unique survey link for this recipient',
          example: 'https://yoursurveyapp.com/survey/abc123?token=xyz789'
        }
      ]
    },
    {
      category: 'Date & Time',
      icon: <Calendar className="h-4 w-4" />,
      variables: [
        {
          name: '{date}',
          description: 'Current date in readable format',
          example: 'January 15, 2024'
        },
        {
          name: '{time}',
          description: 'Current time in readable format',
          example: '2:30 PM'
        },
        {
          name: '{datetime}',
          description: 'Current date and time',
          example: 'January 15, 2024 at 2:30 PM'
        }
      ]
    },
    {
      category: 'Company Information',
      icon: <Building className="h-4 w-4" />,
      variables: [
        {
          name: '{company_name}',
          description: 'Your company name',
          example: 'Acme Corporation'
        },
        {
          name: '{company_email}',
          description: 'Your company contact email',
          example: 'contact@acme.com'
        }
      ]
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Variables
        </CardTitle>
        <CardDescription>
          Click any variable to copy it to your clipboard, or use the copy button
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {variables.map((category, categoryIndex) => (
            <AccordionItem key={categoryIndex} value={`category-${categoryIndex}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  {category.icon}
                  <span className="font-medium">{category.category}</span>
                  <Badge variant="secondary" className="ml-2">
                    {category.variables.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {category.variables.map((variable, variableIndex) => (
                    <div
                      key={variableIndex}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-mono bg-background px-2 py-1 rounded border">
                            {variable.name}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVariableClick(variable.name)}
                            className="h-6 w-6 p-0"
                          >
                            {copiedVariable === variable.name ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {variable.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Example: <span className="font-mono">{variable.example}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> Variables are case-sensitive and must be wrapped in curly braces. 
            They will be automatically replaced when the email is sent.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
