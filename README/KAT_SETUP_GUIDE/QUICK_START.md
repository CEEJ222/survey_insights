# Quick Start Cheat Sheet

**Survey Insights - Commands & Workflows for Beginners**

Print this out or keep it handy while working!

---

## 🚀 First Time Setup

### 1. Check Prerequisites
```bash
node --version    # Should be v18+
git --version     # Any version
```

### 2. Clone & Install
```bash
git clone <repo-url>
cd survey_insights
npm install       # Takes 2-5 minutes
```

### 3. Setup Environment
```bash
# Create .env.local file
touch .env.local

# Add these (get from Supabase):
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Setup Database
1. Go to [supabase.com](https://supabase.com) → Your Project
2. SQL Editor → New Query
3. Copy/paste all of `supabase/schema.sql`
4. Click Run

### 5. Start Development
```bash
npm run dev
```
Open: http://localhost:3000

---

## 📅 Daily Workflow

### Before You Start Coding
```bash
git pull origin main    # Get latest changes
npm install            # Get new packages (if any)
npm run dev           # Start the app
```

### After Making Changes
```bash
git status            # See what you changed
git add .            # Stage all changes
git commit -m "Your message here"    # Save changes
git push origin main  # Share with team
```

---

## 🔥 Most Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Run production build
```

### Git Basics
```bash
git status           # What changed?
git add .            # Stage everything
git commit -m "msg"  # Save changes
git push             # Upload to GitHub
git pull             # Download from GitHub
git log              # See history
```

### Terminal Navigation
```bash
ls                   # List files
cd folder_name       # Enter folder
cd ..                # Go up one level
pwd                  # Where am I?
code .               # Open VS Code here
```

---

## 🆘 Common Errors & Quick Fixes

### "npm: command not found"
➜ Install Node.js from [nodejs.org](https://nodejs.org)

### "Port 3000 already in use"
```bash
# Stop existing server (Ctrl+C)
# Or use a different port:
npm run dev -- -p 3001
```

### "Connection refused" / Database errors
1. Check `.env.local` values
2. Verify Supabase project is active
3. Confirm you ran `schema.sql`

### "Git push rejected"
```bash
git pull origin main  # Get their changes first
git push origin main  # Now push yours
```

### App not loading changes
1. Stop server (Ctrl+C)
2. `npm run dev` again
3. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### Really stuck?
```bash
# Nuclear option: Clean reinstall
rm -rf node_modules
npm install
npm run dev
```

---

## 📂 Project Structure (Where Things Are)

```
survey_insights/
├── src/
│   ├── app/
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── survey/         # Survey pages (for respondents)
│   │   └── api/            # Backend API routes
│   ├── components/         # Reusable UI components
│   ├── lib/                # Utility functions
│   └── types/              # TypeScript types
├── supabase/
│   └── schema.sql          # Database structure
├── .env.local              # Your secrets (NEVER COMMIT!)
└── package.json            # Project dependencies
```

---

## 🔗 Important URLs

### Development
- **App**: http://localhost:3000
- **Admin Login**: http://localhost:3000/admin/login
- **Admin Signup**: http://localhost:3000/admin/signup

### External Services
- **Supabase Dashboard**: https://supabase.com/dashboard
- **GitHub**: https://github.com

---

## 🤝 Collaboration Quick Tips

### Sharing Code
1. **Push often**: Don't wait days to share your work
2. **Pull before pushing**: Always get latest changes first
3. **Descriptive commits**: "Add email validation" not "fix stuff"
4. **Communicate**: Let your teammate know about big changes

### Avoiding Conflicts
- Work on different files when possible
- Pull frequently (several times a day)
- Don't leave uncommitted changes for days

### If You Get a Merge Conflict
1. Don't panic! It's normal
2. Open the file in your editor
3. Look for `<<<<<<< HEAD` markers
4. Keep the right code, delete the markers
5. `git add .` → `git commit -m "Resolve conflict"` → `git push`

---

## 📚 Where to Learn More

### Documentation
- **README.md** - Complete beginner guide
- **SETUP.md** - Detailed setup & troubleshooting
- **ARCHITECTURE.md** - Code structure

### Learning Resources
- [JavaScript Basics](https://javascript.info)
- [Git Tutorial](https://git-scm.com/book/en/v2)
- [Next.js Tutorial](https://nextjs.org/learn)
- [React Docs](https://react.dev/learn)

---

## 🎯 Testing Checklist

After setup, verify everything works:

- [ ] `npm run dev` starts without errors
- [ ] Can access http://localhost:3000
- [ ] Can create admin account
- [ ] Can login to dashboard
- [ ] Can create a survey
- [ ] Can view responses page

---

## 💡 Pro Tips

1. **Use VS Code**: Best beginner-friendly editor
2. **Install extensions**: 
   - ESLint
   - Prettier
   - GitLens
3. **Learn shortcuts**:
   - `Ctrl+C` = Stop server
   - `Cmd/Ctrl+F` = Search in file
   - `Cmd/Ctrl+Shift+F` = Search in all files
4. **Read error messages**: They usually tell you what's wrong!
5. **Google error messages**: Someone has probably solved it
6. **Ask for help**: Your collaborator is there to help!

---

## 🎨 Making Changes

### Editing Pages
- Admin pages: `src/app/admin/`
- Survey pages: `src/app/survey/`
- Homepage: `src/app/page.tsx`

### Editing Styles
- Global styles: `src/app/globals.css`
- Component styles: Tailwind classes in JSX

### Editing Database
1. Update `supabase/schema.sql`
2. Run new SQL in Supabase SQL Editor
3. Tell your teammate to run it too

---

**Keep this handy! You'll reference it often in your first few weeks. 📌**

---

**Questions? Check README.md or SETUP.md for more details!**

