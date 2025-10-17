// Debug script to test survey link lookup
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugSurvey() {
  const token = '5a9ec29adac83c07fa5b778a5161baba005027fa8c669c8e74c2b510cbc941f5'
  
  console.log('Looking for survey link with token:', token)
  
  // Check if survey_links table exists and has data
  const { data: allLinks, error: allLinksError } = await supabase
    .from('survey_links')
    .select('*')
    .limit(5)
  
  console.log('All survey links:', allLinks)
  console.log('Error:', allLinksError)
  
  // Check specific token
  const { data: surveyLink, error: linkError } = await supabase
    .from('survey_links')
    .select('*')
    .eq('token', token)
    .single()
  
  console.log('Specific survey link:', surveyLink)
  console.log('Link error:', linkError)
  
  // Check surveys table
  const { data: surveys, error: surveysError } = await supabase
    .from('surveys')
    .select('*')
    .limit(5)
  
  console.log('All surveys:', surveys)
  console.log('Surveys error:', surveysError)
}

debugSurvey().catch(console.error)
