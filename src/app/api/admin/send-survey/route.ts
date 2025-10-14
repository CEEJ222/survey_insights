import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

interface Recipient {
  email: string
  name?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { surveyId, recipients, emailSubject, emailBody } = body

    if (!surveyId || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Survey ID and recipients are required' },
        { status: 400 }
      )
    }

    // Create survey links for each recipient
    const surveyLinks: any[] = []
    for (const recipient of recipients as Recipient[]) {
      const token = crypto.randomBytes(32).toString('hex')
      
      const linkData = {
        survey_id: surveyId,
        token,
        respondent_email: recipient.email || null,
        respondent_name: recipient.name || null,
        status: 'pending',
      }
      
      const { data: link, error } = await (supabaseAdmin
        .from('survey_links')
        .insert(linkData as any)
        .select()
        .single() as any)

      if (error) {
        console.error('Error creating survey link:', error)
        continue
      }

      if (link) {
        surveyLinks.push({ token: link.token, recipient })
      }
    }

    // Send emails (if SMTP is configured)
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        })

        for (const link of surveyLinks) {
          const surveyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/survey/${link.token}`
          const recipientName = link.recipient?.name || 'there'
          const recipientEmail = link.recipient?.email
          
          if (!recipientEmail) continue
          
          const personalizedBody = emailBody
            .replace(/\{name\}/g, recipientName)
            .replace(/\{link\}/g, surveyUrl)

          await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: recipientEmail,
            subject: emailSubject,
            text: personalizedBody,
            html: personalizedBody.replace(/\n/g, '<br>'),
          })
        }
      } catch (emailError) {
        console.error('Error sending emails:', emailError)
        // Continue even if emails fail - links are still created
      }
    }

    return NextResponse.json({
      success: true,
      linksCreated: surveyLinks.length,
      message: `Created ${surveyLinks.length} survey links`,
    })
  } catch (error) {
    console.error('Error sending survey:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

