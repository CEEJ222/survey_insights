# Survey Insights

A modern, full-stack survey management platform for collecting and analyzing open-ended customer feedback.

## Features

### Survey Respondent Experience
- **Simple, Clean UI**: Minimalist design to maximize completion rates
- **Unique Links**: Each respondent gets a personalized survey link
- **Mobile-Friendly**: Fully responsive design works on all devices
- **Progress Tracking**: Automatic tracking of opened/completed surveys

### Admin Dashboard
- **Authentication**: Secure login with Supabase Auth
- **Multi-Company Support**: Isolated data per company
- **Survey Management**: Create, edit, and manage surveys
- **Response Tracking**: Real-time response monitoring
- **Analytics Dashboard**: View completion rates and statistics

### Survey Distribution
- **Email Blasts**: Send one-time email campaigns
- **Unique Links**: Generate personalized links for each respondent
- **CSV Import**: Bulk import recipients via CSV
- **Email Templates**: Customizable email subject and body

### Future Enhancements
- **AI-Powered Insights**: Semantic search via OpenRouter API (DeepSeek or other free models)
- **Recurring Surveys**: Schedule automatic recurring surveys
- **Trigger-Based Sending**: Event-driven survey distribution
- **Advanced Analytics**: Automatic insight generation from responses

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: Shadcn UI + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Email**: Nodemailer
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and project
- SMTP credentials (optional, for email sending)

### Installation

1. **Clone and Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and add your credentials:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Email (optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password

   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Set Up Supabase Database**
   
   In your Supabase project, go to the SQL Editor and run the schema from `supabase/schema.sql`

4. **Run Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
survey_insights/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin pages
│   │   │   ├── login/         # Login page
│   │   │   ├── signup/        # Signup page
│   │   │   └── dashboard/     # Admin dashboard
│   │   │       ├── surveys/   # Survey management
│   │   │       ├── send/      # Send surveys
│   │   │       └── responses/ # View responses
│   │   ├── survey/            # Survey respondent pages
│   │   │   └── [token]/       # Dynamic survey page
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   └── ui/               # Shadcn UI components
│   ├── lib/                   # Utility functions
│   │   ├── supabase/         # Supabase clients
│   │   ├── auth.ts           # Auth helpers
│   │   └── utils.ts          # General utilities
│   └── types/                 # TypeScript types
│       └── database.ts        # Database types
├── supabase/
│   └── schema.sql            # Database schema
└── public/                    # Static assets
```

## Usage Guide

### For Admins

#### 1. Create an Account
- Navigate to `/admin/signup`
- Enter company name, your name, email, and password
- Account is automatically verified (for development)

#### 2. Create a Survey
- Go to Dashboard → Surveys → Create Survey
- Enter survey title and description
- Add open-ended questions
- Save as draft or activate immediately

#### 3. Send Surveys
- From survey detail page, click "Send Survey"
- Choose between manual entry or CSV import
- Add recipient emails and names
- Customize email template
- Send to all recipients

#### 4. View Responses
- Navigate to Responses page
- Filter by survey or search responses
- View individual response details
- Export data (coming soon)

### For Respondents

1. Receive email with unique survey link
2. Click link to open survey
3. Answer all questions
4. Submit survey
5. See thank you confirmation

## Database Schema

### Core Tables

- **companies**: Company/organization data
- **admin_users**: Admin user accounts linked to companies
- **surveys**: Survey definitions with questions
- **survey_links**: Unique links for each respondent
- **survey_responses**: Submitted survey responses
- **survey_schedules**: Scheduled/recurring survey sending (future)

### Security

- Row Level Security (RLS) enabled on all tables
- Admins can only access their company's data
- Survey respondents access via token validation
- No authentication required for survey submission

## Email Configuration

### Using Gmail

1. Enable 2-Factor Authentication
2. Generate an App Password
3. Use in `.env.local`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your.email@gmail.com
   SMTP_PASSWORD=your_app_password
   ```

### Other Email Providers

Update SMTP settings in `.env.local` according to your provider's documentation.

### Without Email (Development)

Survey links are still created and accessible. Copy links manually from the admin dashboard.

## API Endpoints

### Public Endpoints

- `GET /api/survey/[token]` - Get survey details by token
- `POST /api/survey/[token]/submit` - Submit survey response

### Protected Endpoints (Require Authentication)

- `POST /api/admin/signup` - Create admin account
- `POST /api/admin/send-survey` - Send survey to recipients

## Future Enhancements

### AI-Powered Insights (Planned)

```typescript
// Example: Semantic search using OpenRouter API
const insights = await analyzeResponses({
  responses: surveyResponses,
  model: 'deepseek-chat',
  prompt: 'Identify common themes and sentiment'
})
```

### Recurring Surveys

Schedule surveys to be sent automatically:
- Daily, weekly, monthly cadences
- Custom schedules with cron expressions

### Trigger-Based Sending

Send surveys based on events:
- After purchase
- Post-support interaction
- Milestone achievements

## Contributing

This is a custom internal tool. For modifications:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit for review

## Troubleshooting

### Supabase Connection Issues

- Verify environment variables are correct
- Check Supabase project is active
- Ensure RLS policies are properly configured

### Email Not Sending

- Verify SMTP credentials
- Check firewall/network settings
- Review server logs for errors
- Test with a simple email first

### Authentication Issues

- Clear browser cache and cookies
- Verify Supabase Auth is enabled
- Check email confirmation settings

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact your development team.

