# Troubleshooting Guide

**Common issues and solutions for Survey Insights**

---

## 🔍 Quick Diagnosis

**Start here to identify your issue:**

| Symptom | Likely Cause | Jump to |
|---------|--------------|---------|
| Can't run `npm` commands | Node.js not installed | [Node.js Issues](#nodejs-issues) |
| Port 3000 already in use | Another app running | [Port Issues](#port-issues) |
| Database connection errors | Wrong Supabase config | [Database Issues](#database-issues) |
| Can't create admin account | Auth not set up | [Authentication Issues](#authentication-issues) |
| Email not sending | SMTP config wrong | [Email Issues](#email-issues) |
| Git push rejected | Need to pull first | [Git Issues](#git-issues) |
| Changes not showing | Need to restart | [Development Issues](#development-issues) |

---

## Node.js Issues

### "npm: command not found" or "node: command not found"

**Problem**: Node.js is not installed or not in your PATH

**Solution**:
1. Download Node.js from [nodejs.org](https://nodejs.org) (get LTS version)
2. Install it
3. Restart your terminal
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### "npm ERR! EACCES: permission denied"

**Problem**: Permission issues (common on Mac/Linux)

**Solution**:
```bash
# Don't use sudo! Instead, fix npm permissions:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

### "npm install" fails with errors

**Problem**: Corrupted package cache or lock file

**Solution**:
```bash
# Clean install
rm -rf node_modules
rm package-lock.json
npm cache clean --force
npm install
```

---

## Port Issues

### "Port 3000 already in use" or "EADDRINUSE"

**Problem**: Another app is using port 3000

**Solution 1**: Stop the other app
```bash
# Find what's using port 3000 (Mac/Linux)
lsof -ti:3000

# Kill it
kill -9 $(lsof -ti:3000)
```

**Solution 2**: Use a different port
```bash
npm run dev -- -p 3001
# Then open http://localhost:3001
```

**Solution 3**: Stop all Node processes
```bash
# Mac/Linux
killall node

# Windows
taskkill /F /IM node.exe
```

---

## Database Issues

### "Connection refused" or "Failed to connect to Supabase"

**Problem**: Wrong Supabase configuration

**Checklist**:
1. ✅ `.env.local` file exists in project root
2. ✅ All three Supabase variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. ✅ No extra spaces or quotes around values
4. ✅ Supabase project is active (check supabase.com)
5. ✅ Copied the full keys (they're very long!)

**Solution**:
```bash
# Check your .env.local file
cat .env.local

# Each line should look like:
# NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# (no quotes, no spaces, no trailing characters)
```

### "RLS policy violation" or "row-level security policy"

**Problem**: Database security policies not created

**Solution**:
1. Go to Supabase → SQL Editor
2. Copy entire contents of `supabase/schema.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Verify no errors
6. Check Table Editor - you should see 6 tables

### "Table doesn't exist" errors

**Problem**: Database schema not created

**Solution**:
Same as above - run the full `schema.sql` file

### "Duplicate key value violates unique constraint"

**Problem**: Trying to create something that already exists (like email)

**Solution**:
- Use a different email address
- Or delete the existing record in Supabase Table Editor

---

## Authentication Issues

### Can't create admin account

**Problem**: Multiple possible causes

**Diagnostic Steps**:

1. **Check browser console** (F12 → Console tab)
   - Look for specific error messages

2. **Check terminal output**
   - Look for API route errors

3. **Common causes & fixes**:

   **If error says "User already exists"**:
   - That email is already registered
   - Try a different email
   - Or delete user from Supabase: Authentication → Users

   **If error says "Invalid credentials"**:
   - Check your `.env.local` has correct `SUPABASE_SERVICE_ROLE_KEY`
   - Make sure it's the service_role key, not the anon key

   **If error says "Email not confirmed"**:
   - In Supabase: Authentication → Settings
   - Disable "Confirm email" (for development)

   **If page just reloads with no error**:
   - Check terminal for errors
   - Check all `.env.local` values are correct

### Can't login after creating account

**Problem**: Wrong credentials or account not created

**Solution**:
1. Go to Supabase → Authentication → Users
2. Check if your user exists
3. Check if user has entry in `admin_users` table too
4. Try password reset or create new account

---

## Email Issues

### Emails not sending

**Problem**: SMTP configuration issues

**Diagnostic Steps**:

1. **Check if SMTP vars are set** in `.env.local`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   ```

2. **For Gmail users**:
   - ✅ 2-Factor Authentication is enabled
   - ✅ App Password is created (not your regular password)
   - ✅ App Password has no spaces
   - ✅ Using `smtp.gmail.com` and port `587`

3. **Check terminal for errors** when sending

**Solution if still not working**:
```bash
# Test with a simple email test
# Check terminal output for specific error
```

**Common Gmail errors**:

- **"Invalid login"**: Wrong app password or 2FA not enabled
- **"Username and Password not accepted"**: Need to use App Password, not regular password
- **"Less secure apps"**: Outdated - use App Password instead

### Emails going to spam

**Problem**: Email provider marking as spam

**Solution**:
- Check spam folder
- Add sender to contacts
- For production, use a real email service (SendGrid, etc.)

### Survey link in email doesn't work

**Problem**: Wrong app URL in environment

**Solution**:
Check `.env.local`:
```env
# For local development:
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For production:
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Git Issues

### "git: command not found"

**Problem**: Git not installed

**Solution**:
- **Mac**: `brew install git` (install Homebrew first)
- **Windows**: Download from [git-scm.com](https://git-scm.com)
- **Linux**: `sudo apt-get install git` or `sudo yum install git`

### "Git push rejected" or "failed to push"

**Problem**: Remote has changes you don't have

**Solution**:
```bash
# Get remote changes
git pull origin main

# If successful (no conflicts):
git push origin main

# If there are conflicts:
# See "Merge conflicts" section below
```

### Merge conflicts

**Problem**: You and your collaborator edited the same lines

**Solution**:
```bash
# After git pull shows conflicts:

# 1. Open the conflicted file
# You'll see markers like:
<<<<<<< HEAD
Your changes
=======
Their changes
>>>>>>> main

# 2. Edit the file:
#    - Keep the correct code
#    - Delete the conflict markers (<<<, ===, >>>)
#    - Save the file

# 3. Mark as resolved:
git add .
git commit -m "Resolve merge conflict"
git push origin main
```

**Pro tip**: When in doubt, call your collaborator and decide together!

### ".env.local in the commit"

**Problem**: You accidentally committed secrets

**Solution**:
```bash
# Remove from last commit (if not pushed yet)
git rm --cached .env.local
git commit --amend -m "Remove .env.local"

# If already pushed - the secrets are public!
# 1. Immediately rotate all secrets in Supabase
# 2. Update .env.local with new secrets
# 3. Tell collaborator to update theirs too
```

### "Changes not staged for commit"

**Problem**: Files are modified but not added

**Solution**:
```bash
# Add all changes
git add .

# Or add specific file
git add path/to/file.tsx
```

---

## Development Issues

### Changes not showing in browser

**Problem**: Browser cache or dev server needs restart

**Solution**:
```bash
# 1. Hard refresh browser
# - Mac: Cmd + Shift + R
# - Windows: Ctrl + Shift + R

# 2. If that doesn't work, restart dev server
# Stop with Ctrl+C
npm run dev

# 3. If still not working
# Delete .next folder and restart
rm -rf .next
npm run dev

# 4. Nuclear option
rm -rf .next node_modules
npm install
npm run dev
```

### "Module not found" errors

**Problem**: Missing package or wrong import path

**Solution**:
```bash
# 1. Install dependencies
npm install

# 2. Check import path is correct
# Should be: import X from './path/to/file'
# Not: import X from 'wrong/path'

# 3. Restart dev server
```

### TypeScript errors

**Problem**: Type mismatches or missing types

**Quick fixes**:
- Add `// @ts-ignore` above the error line (temporary!)
- Add types: `const x: string = "hello"`
- Check imports are correct

**Proper solution**:
- Read the error message carefully
- Fix the actual type issue
- Learn TypeScript basics

### "Hydration error" or "Text content does not match"

**Problem**: Server-rendered HTML doesn't match client HTML

**Common causes**:
- Using `new Date()` or random numbers
- Using browser-only code during server render
- Mismatched HTML tags

**Solution**:
- Use `useEffect` for browser-only code
- Use `useState` for dynamic values
- Check you're not nesting `<p>` inside `<p>` or similar

---

## Environment Issues

### "NEXT_PUBLIC_* variable is undefined"

**Problem**: Environment variable not loading

**Solution**:
1. ✅ Variable is in `.env.local`
2. ✅ Variable starts with `NEXT_PUBLIC_` (for client-side)
3. ✅ Dev server was restarted after adding variable
4. ✅ No spaces around `=`

```bash
# Restart dev server (required after .env.local changes)
# Ctrl+C to stop
npm run dev
```

### ".env.local not loading"

**Problem**: File in wrong location or wrong name

**Solution**:
```bash
# Check file exists in root
ls -la .env.local

# Should be in project root, not in a subfolder
# Correct: /survey_insights/.env.local
# Wrong: /survey_insights/src/.env.local

# Check the name exactly
# Correct: .env.local
# Wrong: .env, env.local, .env.local.txt
```

---

## Supabase-Specific Issues

### "Failed to fetch" from Supabase

**Problem**: Network or CORS issue

**Solution**:
1. Check internet connection
2. Check Supabase project is active
3. Check URL doesn't have typos
4. Check you're using `https://`, not `http://`

### "Invalid API key"

**Problem**: Wrong key or expired key

**Solution**:
1. Go to Supabase → Settings → API
2. Copy the keys again (they're long!)
3. Make sure you're using:
   - `anon public` for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` for `SUPABASE_SERVICE_ROLE_KEY`
4. Update `.env.local`
5. Restart dev server

### "Rate limit exceeded"

**Problem**: Too many requests (uncommon in development)

**Solution**:
- Wait a few minutes
- Check for infinite loops in your code
- Check Supabase dashboard for limits

---

## Browser-Specific Issues

### Page stuck loading

**Solution**:
1. Check browser console (F12) for errors
2. Check network tab (F12 → Network) for failed requests
3. Try different browser
4. Clear browser cache
5. Check terminal for API errors

### "CORS error"

**Problem**: Browser security blocking requests

**Solution**:
- Restart dev server
- Check `NEXT_PUBLIC_APP_URL` matches your current URL
- For production, check Vercel/Supabase CORS settings

---

## Performance Issues

### "npm install" taking forever

**Solution**:
```bash
# Clean cache
npm cache clean --force

# Use faster registry (optional)
npm config set registry https://registry.npmjs.org/
```

### Dev server slow to start

**Normal**: 5-10 seconds is normal
**Slow**: 30+ seconds

**Solution**:
```bash
# Delete .next build folder
rm -rf .next

# Exclude from antivirus scanning
# Add node_modules and .next to antivirus exclusions
```

### Hot reload not working

**Problem**: Changes require manual refresh

**Solution**:
- Check you're editing files inside `src/`
- Restart dev server
- Check no syntax errors in code

---

## When All Else Fails

### The Nuclear Option

```bash
# WARNING: This deletes node_modules and build files
# Your code and .env.local are safe!

# Stop dev server (Ctrl+C)

# Delete everything installable
rm -rf node_modules
rm -rf .next
rm package-lock.json

# Clean install
npm cache clean --force
npm install

# Start fresh
npm run dev
```

### Still Stuck?

1. **Read the error message carefully** - It usually tells you what's wrong
2. **Google the exact error** - Copy/paste into Google
3. **Check GitHub Issues** - Others might have had same problem
4. **Ask your collaborator** - Two heads are better than one
5. **Stack Overflow** - Search or ask a question
6. **Start fresh** - Delete project, re-clone, try again

---

## Prevention Tips

### Avoid Issues Before They Happen

1. **Pull before you code**
   ```bash
   git pull origin main
   ```

2. **Commit working code**
   - Don't commit broken code
   - Test before committing

3. **Keep dependencies updated**
   ```bash
   npm outdated  # See what's outdated
   npm update    # Update packages
   ```

4. **Don't edit node_modules**
   - Never manually edit installed packages
   - They get overwritten on npm install

5. **Keep .env.local backed up**
   - Store in password manager
   - Share securely with team

6. **Restart server after changes**
   - Environment variables
   - Package.json modifications
   - Config file changes

---

## Getting Help

### Information to Provide When Asking for Help

1. **Exact error message** (copy/paste, don't retype)
2. **What you were trying to do**
3. **What you expected to happen**
4. **What actually happened**
5. **Steps you already tried**
6. **Your environment**:
   ```bash
   node --version
   npm --version
   # Operating system (Mac/Windows/Linux)
   ```

### Where to Ask

- **Your collaborator** - First line of defense
- **Google** - Most errors have been solved
- **Stack Overflow** - Be specific in your question
- **GitHub Issues** - For bugs in packages
- **Discord/Slack communities** - For Next.js, React, Supabase

---

## Useful Debugging Commands

```bash
# Check Node version
node --version

# Check npm version
npm --version

# Check installed packages
npm list --depth=0

# Check for outdated packages
npm outdated

# Verify git status
git status

# See recent git commits
git log --oneline -10

# Check what's running on port 3000
lsof -ti:3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Check environment variables are loading
# Add console.log in your code:
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
```

---

**Remember: Every developer faces these issues. You're not alone! 💪**

**Most problems can be solved by:**
1. Reading the error
2. Restarting the dev server
3. Googling the error
4. Asking for help

**You've got this! 🚀**

