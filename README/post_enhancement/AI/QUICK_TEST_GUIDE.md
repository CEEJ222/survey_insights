# 🚀 Quick Test Guide - AI Integration

## ✅ Server is Running!

Your dev server is live at: **http://localhost:3000**

---

## 🧪 Quick Test (2 minutes)

### **Option 1: Public Test Page (No Login Required)**
- Go to: **http://localhost:3000/test-ai** ← **Start here!**

### **Option 2: Admin Dashboard (Requires Login)**
- Go to: http://localhost:3000/admin/login
- Use your admin credentials
- Click **"🤖 AI Test"** in the sidebar
- Or go directly to: http://localhost:3000/admin/dashboard/ai-test

### **Step 3: Try Sample Text**
Paste this into the text box:
```
The onboarding process was really confusing and I almost gave up. 
The dashboard is slow and takes forever to load. 
Otherwise, I love the product!
```

### **Step 4: Analyze**
- Click **"Analyze with AI"**
- Watch it work! (takes 2-3 seconds first time)
- Try again → should be instant (cached!)

---

## 📊 What You'll See

After clicking "Analyze with AI":

1. **📝 Summary** 
   - AI-generated 1-2 sentence summary
   
2. **😊 Sentiment Analysis**
   - Score: -1.0 (very negative) to 1.0 (very positive)
   - Label: positive/negative/neutral
   - Visual bar showing sentiment

3. **🏷️ Tags**
   - 3-5 relevant tags like: "onboarding", "confused", "dashboard", "slow", "positive"

4. **⚠️ Priority Score**
   - 0-100 urgency level
   - Color-coded: Red (high), Yellow (medium), Green (low)

---

## 💰 Check Costs

After running AI analysis, check the database:

```sql
-- View AI costs (run in Supabase SQL Editor)
SELECT 
  request_type,
  model,
  cache_hit,
  estimated_cost,
  created_at
FROM ai_cost_logs
ORDER BY created_at DESC
LIMIT 10;
```

**Expected cost per analysis:** ~$0.001-0.002 (less than 1/4 of a penny!)

---

## 🐛 If You See Errors

### TypeScript Warnings (Ignore These)
You might see TypeScript warnings in the terminal like:
```
Property 'status' does not exist on type 'never'
```

**→ These are safe to ignore!** They're type inference issues that don't affect runtime.

### Actual Errors to Fix

**If AI Test page shows "Unauthorized":**
- Make sure you're logged in
- Check your session hasn't expired

**If you see "AI analysis failed":**
- Check terminal for error details
- Verify OpenAI API key in `.env.local`
- Ensure OpenAI account has credits

**If nothing happens when clicking "Analyze":**
- Open browser console (F12)
- Check for JavaScript errors
- Refresh the page and try again

---

## 🎯 Next: Test Real Survey

### 1. Create a Survey
- Go to: http://localhost:3000/admin/dashboard/surveys
- Click "Create Survey"
- Add a few open-ended questions

### 2. Send to Yourself
- Generate a survey link
- Copy the link
- Open in incognito/private window

### 3. Submit Response
- Fill out the survey with text feedback
- Submit it

### 4. Watch Terminal
You'll see in your terminal:
```
🤖 Running AI analysis for response abc-123...
✅ AI analysis complete for response abc-123
   Sentiment: 0.65 (positive)
   Tags: onboarding, confused, dashboard
   Priority: 55/100
```

### 5. Check Database
```sql
SELECT 
  sentiment_score,
  ai_tags,
  priority_score,
  submitted_at
FROM survey_responses
ORDER BY submitted_at DESC
LIMIT 1;
```

You'll see the AI analysis stored!

---

## 📚 Full Documentation

- **`AI_INTEGRATION_GUIDE.md`** - Complete reference
- **`MIGRATION_GUIDE_TO_UNIFIED.md`** - Database migration
- **`TRANSFORMATION_SUMMARY.md`** - Project overview

---

## 🎉 Success Checklist

- [ ] Server is running (http://localhost:3000)
- [ ] Can log into admin dashboard
- [ ] AI Test page loads
- [ ] Can run AI analysis on sample text
- [ ] See results appear (summary, sentiment, tags, priority)
- [ ] (Optional) Submit real survey and see AI analysis in terminal

---

## 💡 Pro Tips

1. **Try the same text twice** - Second time will be instant (cached!)
2. **Check terminal logs** - Watch AI working in real-time
3. **View cost in database** - See how cheap it is
4. **Test different sentiments** - Try positive, negative, mixed feedback
5. **Sample texts provided** - Use the samples on the AI Test page

---

## 🚨 Quick Fixes

**Port 3000 already in use?**
```bash
pkill -f "next dev"
npm run dev
```

**Need to restart?**
```bash
npm run dev
```

**Clear cache and restart:**
```bash
rm -rf .next
npm run dev
```

---

## ✅ Ready to Test!

**Go to:** http://localhost:3000/admin/dashboard/ai-test

**Have fun!** 🤖✨

