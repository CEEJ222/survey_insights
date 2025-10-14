# Survey Insights

A modern, full-stack survey management platform for collecting and analyzing open-ended customer feedback.

---

## 📚 Documentation for Beginners

**New to this project? Start here!**

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **README.md** (This file) | Complete setup guide | Setting up for the first time |
| **[COLLABORATION_GUIDE.md](COLLABORATION_GUIDE.md)** | Working with another developer | Sharing code, daily workflow |
| **[QUICK_START.md](QUICK_START.md)** | Command cheat sheet | Quick reference while coding |
| **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** | Fix common problems | When something isn't working |
| **[SETUP.md](SETUP.md)** | Advanced setup details | Email config, deployment |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Code structure | Understanding how the app works |

**👥 Setting up with a collaborator?** → Read **[COLLABORATION_GUIDE.md](COLLABORATION_GUIDE.md)** first!

**🆘 Something not working?** → Check **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**!

---

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

### 🚀 Quick Setup Guide for Beginners

This project is a Next.js web application that uses Supabase (cloud database) for storing data. Here's everything you need to get it running on your computer.

---

### Step 1: Prerequisites (Install These First)

Before you start, make sure you have these tools installed on your computer:

#### ✅ Node.js (JavaScript Runtime)
- **What it is**: Node.js lets you run JavaScript code on your computer (not just in browsers)
- **Check if installed**: Open Terminal/Command Prompt and type:
  ```bash
  node --version
  ```
  You should see something like `v18.0.0` or higher
  
- **If not installed**: Download from [nodejs.org](https://nodejs.org) (get the LTS version)

#### ✅ Git (Version Control)
- **What it is**: Git helps you download and manage code
- **Check if installed**: 
  ```bash
  git --version
  ```
  
- **If not installed**:
  - Mac: Install [Homebrew](https://brew.sh), then run `brew install git`
  - Windows: Download from [git-scm.com](https://git-scm.com)

#### ✅ Text Editor (To Edit Code)
- **Recommended**: [VS Code](https://code.visualstudio.com) - it's free and beginner-friendly
- **Alternatives**: Any text editor works (Cursor, Sublime, Atom, etc.)

#### ✅ Supabase Account (Cloud Database)
- **What it is**: Supabase provides your database and authentication (online, free tier available)
- **Sign up**: Go to [supabase.com](https://supabase.com) and create a free account

---

### Step 2: Get the Code

If you're the first person setting this up, you already have the code. If you're a collaborator:

#### Option A: Clone from GitHub (if code is on GitHub)
```bash
# Navigate to where you want the project
cd ~/Documents  # or wherever you keep projects

# Clone the repository
git clone <repository-url>
cd survey_insights
```

#### Option B: Get Code from Your Collaborator
1. Ask your collaborator to zip the entire `survey_insights` folder
2. Download and unzip it
3. Open Terminal and navigate to it:
   ```bash
   cd path/to/survey_insights
   ```

---

### Step 3: Install Project Dependencies

Dependencies are external code libraries this project needs to run.

```bash
# This reads package.json and installs everything needed
npm install
```

This might take 2-5 minutes. You'll see lots of text - that's normal!

---

### Step 4: Set Up Supabase Database

#### Create Your Supabase Project

1. Go to [supabase.com](https://supabase.com) and log in
2. Click **"New Project"**
3. Fill in:
   - **Organization**: Your organization (or create one)
   - **Project Name**: `survey-insights` 
   - **Database Password**: Generate and **save this password somewhere safe!**
   - **Region**: Choose closest to you (e.g., US East, Europe West)
4. Click **"Create Project"** and wait ~2 minutes for it to set up

#### Get Your API Keys

1. In your Supabase project, click **Settings** (bottom left) → **API**
2. You'll see three important values - copy these somewhere:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (another long string - **keep this secret!**)

#### Create Database Tables

1. In Supabase, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open the file `supabase/schema.sql` from this project in your text editor
4. Copy **all the SQL code** and paste it into the Supabase SQL Editor
5. Click **"Run"** (or press Cmd/Ctrl + Enter)
6. Verify tables were created:
   - Go to **Table Editor** (left sidebar)
   - You should see 6 tables: `companies`, `admin_users`, `surveys`, `survey_links`, `survey_responses`, `survey_schedules`

---

### Step 5: Configure Environment Variables

Environment variables tell the app where to find your database and how to send emails.

1. **Create the file**:
   In the root of the `survey_insights` folder, create a new file named `.env.local`
   
   ```bash
   # In your terminal, from the project root:
   touch .env.local
   ```

2. **Add your configuration**:
   Open `.env.local` in your text editor and paste this (replace with YOUR values):
   
   ```env
   # ==========================================
   # SUPABASE CONFIGURATION (Required)
   # ==========================================
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key-here
   
   # ==========================================
   # EMAIL CONFIGURATION (Optional - Skip for now)
   # ==========================================
   # Leave these empty or commented out if you don't want to send emails yet
   # SMTP_HOST=smtp.gmail.com
   # SMTP_PORT=587
   # SMTP_USER=your_email@gmail.com
   # SMTP_PASSWORD=your_gmail_app_password
   
   # ==========================================
   # APPLICATION URL
   # ==========================================
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Save the file** - this file should never be committed to Git (it's in `.gitignore`)

---

### Step 6: Start the Development Server

You're ready to run the app!

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.1.0
- Local:        http://localhost:3000
- Ready in 2.5s
```

Open your web browser and go to: **http://localhost:3000**

🎉 **Success!** You should see the Survey Insights homepage!

---

### Step 7: Create Your First Admin Account

1. In your browser, go to: http://localhost:3000/admin/signup
2. Fill in the form:
   - **Company Name**: Your company name
   - **Full Name**: Your name
   - **Email**: Your email
   - **Password**: At least 6 characters
3. Click **"Create Account"**
4. You'll be redirected to login - use the email/password you just created

---

### 📧 Optional: Set Up Email Sending

If you want to send survey emails (not required to test the app):

See the detailed instructions in `SETUP.md` - it explains how to set up Gmail or other email providers.

---

### 🤝 Working with Another Developer

#### Sharing Your Code

**Option 1: GitHub (Recommended)**
```bash
# Create a repository on GitHub first, then:
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/survey-insights.git
git push -u origin main
```

Your collaborator can then clone it:
```bash
git clone https://github.com/yourusername/survey-insights.git
```

**Option 2: Share Manually**
- Zip the entire project folder
- Send to your collaborator
- ⚠️ **DON'T include**:
  - `node_modules/` folder (too large - they'll run `npm install`)
  - `.env.local` file (has secrets - share these separately via secure method)

#### Sharing Your Supabase Project

**Option 1: Invite to Same Project** (Share same data)
1. In Supabase → Settings → Team Settings
2. Click "Invite" and add their email
3. They use the same `.env.local` values as you

**Option 2: Create Separate Projects** (Each has own data)
1. Each person creates their own Supabase project
2. Each person runs the `schema.sql` in their project
3. Each person has different values in `.env.local`

---

### 📚 Next Steps

Once you're up and running:

1. ✅ Create a survey (Dashboard → Surveys → Create New)
2. ✅ Send a test survey to yourself
3. ✅ Submit a response
4. ✅ View responses in the admin dashboard
5. 📖 Read `SETUP.md` for more advanced configuration

---

### 🆘 Common Issues

See detailed troubleshooting in `SETUP.md`, but here are the most common:

**"npm: command not found"**
- You need to install Node.js (see Step 1)

**"Connection refused" or database errors**
- Check your `.env.local` file has correct Supabase values
- Make sure you ran the `schema.sql` in Supabase

**"Port 3000 already in use"**
- Something else is using port 3000
- Stop other dev servers or run: `npm run dev -- -p 3001` (uses port 3001 instead)

**Can't create admin account**
- Make sure Supabase project is active
- Check that all three Supabase keys are correct in `.env.local`
- Check browser console (F12) for specific error messages

---

### 📖 More Documentation

- **SETUP.md** - Detailed setup guide with email configuration, deployment, etc.
- **ARCHITECTURE.md** - How the code is organized (for developers)
- **supabase/schema.sql** - Database structure

---

### Need Help?

1. Check the troubleshooting sections in `SETUP.md`
2. Look at browser console errors (press F12 in browser)
3. Check terminal output for error messages
4. Search the error message online
5. Ask your collaborator or development team

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

