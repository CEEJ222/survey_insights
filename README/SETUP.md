# Setup Guide

**Detailed step-by-step instructions for setting up Survey Insights.**

> 📘 **Note**: If you're a beginner, start with the **README.md** file first - it has a simplified quick-start guide. Come back here when you need more advanced setup options like email configuration, production deployment, or detailed troubleshooting.

---

## Table of Contents

1. [Supabase Setup](#1-supabase-setup)
2. [Local Development Setup](#2-local-development-setup)
3. [Email Setup](#3-email-setup-optional-but-recommended)
4. [Creating Your First Admin Account](#4-create-your-first-admin-account)
5. [Creating Your First Survey](#5-create-your-first-survey)
6. [Sending Your First Survey](#6-send-your-first-survey)
7. [Testing End-to-End](#7-complete-a-survey-test)
8. [Production Deployment](#8-production-deployment)
9. [Common Issues](#common-issues)
10. [Collaboration Workflows](#collaboration-workflows)

---

## 1. Supabase Setup

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - Project name: `survey-insights`
   - Database Password: (generate a strong password and save it)
   - Region: (choose closest to your users)
5. Wait for project to finish setting up (~2 minutes)

### Get Your API Keys

1. In your Supabase project, go to Settings → API
2. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

### Run Database Schema

1. In Supabase, go to SQL Editor
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql` from this project
4. Paste into the SQL editor
5. Click "Run"
6. Verify all tables were created:
   - Go to Table Editor
   - You should see: `companies`, `admin_users`, `surveys`, `survey_links`, `survey_responses`, `survey_schedules`

### Verify RLS Policies

1. Go to Authentication → Policies
2. Each table should have policies enabled
3. If not, re-run the schema.sql file

## 2. Local Development Setup

### Install Node.js

Ensure you have Node.js 18 or higher:
```bash
node --version
```

If not installed, download from [nodejs.org](https://nodejs.org)

### Clone and Install

```bash
cd survey_insights
npm install
```

### Configure Environment Variables

1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` with your values:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key

   # Email Configuration (optional for now)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You should see the Survey Insights homepage!

## 3. Email Setup (Optional but Recommended)

### Option A: Gmail

1. **Enable 2-Factor Authentication**
   - Go to Google Account settings
   - Security → 2-Step Verification
   - Follow setup process

2. **Create App Password**
   - Still in Security settings
   - Search for "App passwords"
   - Select app: "Mail"
   - Select device: "Other" (enter "Survey Insights")
   - Copy the 16-character password

3. **Update .env.local**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your.email@gmail.com
   SMTP_PASSWORD=abcd efgh ijkl mnop  # (remove spaces)
   ```

### Option B: Other Email Providers

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
```

#### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_aws_smtp_username
SMTP_PASSWORD=your_aws_smtp_password
```

### Test Email Sending

1. Create an admin account
2. Create a survey
3. Try sending to your own email
4. Check spam folder if not received

## 4. Create Your First Admin Account

1. Navigate to [http://localhost:3000/admin/signup](http://localhost:3000/admin/signup)
2. Fill in the form:
   - Company Name: Your company
   - Full Name: Your name
   - Email: Your work email
   - Password: Strong password (min 6 characters)
3. Click "Create Account"
4. You'll be redirected to login
5. Login with your credentials

## 5. Create Your First Survey

1. From the dashboard, click "Create New Survey"
2. Enter survey details:
   - Title: "Customer Satisfaction Survey"
   - Description: "We'd love to hear your feedback"
3. Add questions:
   - "What do you like most about our product?"
   - "What could we improve?"
   - "Any additional feedback?"
4. Click "Create & Activate"

## 6. Send Your First Survey

1. Go to the survey detail page
2. Click "Send Survey"
3. Add a test recipient:
   - Email: your personal email
   - Name: Your name
4. Customize the email if desired
5. Click "Send Survey"
6. Check your email for the survey link

## 7. Complete a Survey (Test)

1. Check your email
2. Click the survey link
3. Answer all questions
4. Submit the survey
5. Go back to admin dashboard
6. Navigate to "Responses"
7. You should see your test response!

## 8. Production Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables**
   - In Vercel project settings
   - Go to Settings → Environment Variables
   - Add all variables from your `.env.local`
   - Make sure to update `NEXT_PUBLIC_APP_URL` to your Vercel URL

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Visit your live site!

### Update Supabase Settings

1. In Supabase, go to Authentication → URL Configuration
2. Add your Vercel URL to:
   - Site URL
   - Redirect URLs
3. This allows authentication to work on production

## Common Issues

### "Connection Refused" Error

**Problem**: Can't connect to Supabase

**Solution**: 
- Double-check your Supabase URL and keys
- Ensure project is active in Supabase dashboard
- Check for typos in `.env.local`

### "RLS Policy Violation" Error

**Problem**: Can't access data in database

**Solution**:
- Ensure RLS policies are created (re-run schema.sql)
- Check that you're logged in as admin
- Verify admin_users record exists for your user

### Email Not Sending

**Problem**: Survey emails aren't being delivered

**Solution**:
- Verify SMTP credentials
- Check Gmail app password is correct
- Ensure 2FA is enabled (for Gmail)
- Check spam folder
- Review server logs for errors

### Admin Signup Fails

**Problem**: Can't create admin account

**Solution**:
- Ensure Supabase Auth is enabled
- Check service role key is correct
- Verify database schema is fully created
- Check browser console for errors

### Survey Link Returns 404

**Problem**: Survey link doesn't work

**Solution**:
- Verify survey_links table has the token
- Check survey status is "active"
- Ensure link hasn't expired
- Try generating a new link

## Next Steps

Now that everything is set up:

1. ✅ Create more surveys
2. ✅ Import bulk recipients via CSV
3. ✅ Monitor response rates
4. ✅ Analyze feedback patterns
5. 🔮 Plan AI integration for insights (future)

## Collaboration Workflows

### Setting Up for Multiple Developers

When working with another developer, here are the recommended workflows:

#### Initial Setup (First Developer)

**1. Initialize Git Repository**
```bash
# In the project root
git init
git add .
git commit -m "Initial project setup"
```

**2. Create GitHub Repository**
- Go to [github.com](https://github.com)
- Click "New Repository"
- Name it `survey-insights`
- **Don't** initialize with README (you already have one)
- Click "Create Repository"

**3. Push Code to GitHub**
```bash
# Add the remote (replace with your actual URL)
git remote add origin https://github.com/your-username/survey-insights.git

# Push the code
git branch -M main
git push -u origin main
```

**4. Share Credentials Securely**

⚠️ **NEVER commit `.env.local` to Git!** It contains secret keys.

Share environment variables with your collaborator via:
- Password manager (1Password, LastPass, Bitwarden)
- Encrypted message (Signal, ProtonMail)
- Secure note-sharing service

Share these exact values:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

#### Collaborator Setup

**1. Clone the Repository**
```bash
# Navigate to your projects folder
cd ~/Documents

# Clone the repository
git clone https://github.com/your-username/survey-insights.git
cd survey-insights
```

**2. Install Dependencies**
```bash
npm install
```

**3. Create `.env.local` File**
```bash
touch .env.local
```

Open `.env.local` in your editor and paste the credentials your collaborator shared with you.

**4. Decide on Database Strategy**

**Option A: Share Same Supabase Project** (Recommended for collaboration)
- Both developers use the same Supabase project
- Same `.env.local` values
- See the same data
- Good for: Working together on the same features

**Option B: Separate Supabase Projects** (For independent development)
- Each developer creates their own Supabase project
- Different `.env.local` values
- Separate data
- Good for: Testing features independently without affecting each other

**5. Start Development**
```bash
npm run dev
```

---

#### Daily Workflow

**Before Starting Work (Get Latest Changes)**
```bash
# Pull latest changes from GitHub
git pull origin main

# Install any new dependencies (if package.json changed)
npm install
```

**After Making Changes (Share Your Work)**
```bash
# Check what you changed
git status

# Add your changes
git add .

# Commit with a descriptive message
git commit -m "Add email validation to signup form"

# Push to GitHub
git push origin main
```

**Communicating Changes**
- Use descriptive commit messages
- Let your collaborator know when you push major changes
- If you both edit the same file, Git might create a "merge conflict" - don't panic!
  - Search "how to resolve git merge conflict" for help
  - Or ask your collaborator to help

---

#### Handling Merge Conflicts

If both of you edit the same lines of code, Git will ask you to resolve conflicts:

```bash
# You'll see a message like:
# "CONFLICT (content): Merge conflict in src/app/page.tsx"

# Open the file in your editor. You'll see:
<<<<<<< HEAD
Your changes here
=======
Their changes here
>>>>>>> main

# Delete the markers and keep the correct version
# Then:
git add .
git commit -m "Resolve merge conflict"
git push origin main
```

**Tips to Avoid Conflicts:**
- Work on different files when possible
- Communicate who's editing what
- Pull changes frequently (`git pull`)
- Push your changes regularly

---

#### Using Branches (Intermediate)

For cleaner collaboration, use feature branches:

```bash
# Create a new branch for your feature
git checkout -b feature/email-templates

# Make your changes...

# Commit changes to your branch
git add .
git commit -m "Add email template customization"

# Push your branch
git push origin feature/email-templates

# On GitHub, create a "Pull Request" to merge into main
# Your collaborator can review and merge
```

---

#### Database Schema Changes

If you need to modify the database structure:

**1. Update `supabase/schema.sql`**
```sql
-- Add your changes (new tables, columns, etc.)
ALTER TABLE surveys ADD COLUMN tags TEXT[];
```

**2. Run in Your Supabase Project**
- Go to Supabase SQL Editor
- Run the new SQL commands

**3. Commit and Share**
```bash
git add supabase/schema.sql
git commit -m "Add tags column to surveys table"
git push origin main
```

**4. Tell Your Collaborator**
- They need to run the same SQL in their Supabase project
- Message them: "Hey, I updated the database schema. Run the new SQL from schema.sql lines X-Y"

---

#### Shared vs Individual Supabase Projects

**Shared Project (Same Database)**

✅ **Pros:**
- See same data
- No duplication of test data
- True collaboration

❌ **Cons:**
- Can interfere with each other's testing
- Both need access to same Supabase project
- Database changes affect both immediately

**Individual Projects (Separate Databases)**

✅ **Pros:**
- Independent testing environment
- No interference
- Can experiment freely

❌ **Cons:**
- Need to manage separate API keys
- Can't see each other's test data
- Need to keep databases in sync manually

**Recommendation for Beginners:** Start with shared project, move to individual if you're constantly stepping on each other's toes.

---

### Troubleshooting Collaboration Issues

**"Git push rejected"**
- Your collaborator pushed changes first
- Solution: `git pull origin main` then `git push origin main`

**"My changes disappeared!"**
- They might have been overwritten in a merge
- Check `git log` to see commit history
- Use `git reflog` to find lost commits

**"Different data in our databases"**
- You're using different Supabase projects
- Either share same project or keep them separate (by design)

**"Package not found error"**
- Your collaborator added a new dependency
- Solution: `npm install` to get the new packages

---

## Need Help?

### Documentation Resources
- **README.md** - Quick start guide for beginners
- **ARCHITECTURE.md** - Code structure and patterns
- **supabase/schema.sql** - Database structure with comments

### External Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Git Documentation](https://git-scm.com/doc)

### Getting Unstuck
1. Read the error message carefully
2. Check browser console (F12 → Console tab)
3. Check terminal output
4. Search the error on Google/Stack Overflow
5. Check if `.env.local` values are correct
6. Try restarting the dev server (`Ctrl+C`, then `npm run dev`)
7. Ask your collaborator
8. If really stuck, try deleting `node_modules` and running `npm install` again

### Learning Resources for Beginners
- [JavaScript Basics](https://javascript.info)
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)
- [Next.js Tutorial](https://nextjs.org/learn)
- [React Basics](https://react.dev/learn)

---

## Contributing

When you make changes, follow these practices:

1. **Test your changes** - Make sure the app still works
2. **Write clear commit messages** - "Fix email validation" not "fix stuff"
3. **Pull before you push** - Get latest changes first
4. **Communicate** - Tell your team about major changes
5. **Ask questions** - Better to ask than break something!

---

**Happy Coding! 🚀**

