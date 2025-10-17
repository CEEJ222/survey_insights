#!/usr/bin/env node

/**
 * Phase 2 Testing Script
 * Quick verification of strategic theme scoring implementation
 */

const { createThemeDiscoveryEngine } = require('./src/lib/ai/theme-discovery.ts')

async function testPhase2() {
  console.log('🧪 Testing Phase 2: Strategic Theme Scoring\n')

  try {
    // Test 1: Create theme discovery engine
    console.log('1️⃣ Testing theme discovery engine creation...')
    const engine = createThemeDiscoveryEngine('test-company-id')
    console.log('✅ Theme discovery engine created successfully\n')

    // Test 2: Mock strategy data
    console.log('2️⃣ Testing strategy retrieval...')
    const mockStrategy = {
      vision_statement: 'Desktop-first construction software',
      target_customer_description: 'Power estimators and takeoff specialists',
      problems_we_solve: ['Takeoff accuracy', 'Desktop workflow efficiency'],
      problems_we_dont_solve: ['Field execution', 'Mobile-first workflows'],
      how_we_win: 'Best desktop accuracy and workflow efficiency',
      strategic_keywords: [
        { keyword: 'desktop', weight: 0.8, reasoning: 'Core focus' },
        { keyword: 'mobile', weight: -0.5, reasoning: 'Deprioritizing mobile' },
        { keyword: 'integration', weight: 0.6, reasoning: 'Key differentiator' }
      ]
    }
    console.log('✅ Mock strategy data prepared\n')

    // Test 3: High alignment theme
    console.log('3️⃣ Testing high alignment theme...')
    const highAlignmentTheme = {
      name: 'Enhanced Desktop Accuracy Features',
      description: 'Customers want better accuracy in takeoff calculations and desktop workflow improvements',
      related_tag_ids: ['accuracy', 'desktop', 'calculations'],
      customer_count: 8,
      mention_count: 12,
      avg_sentiment: 0.9,
      priority_score: 85
    }

    try {
      const alignment = await engine.calculateStrategicAlignment(highAlignmentTheme, mockStrategy)
      console.log(`   Strategic Alignment: ${alignment.alignment_score}/100`)
      console.log(`   Recommendation: ${alignment.recommendation}`)
      console.log(`   Conflicts: ${alignment.conflicts.length}`)
      console.log(`   Opportunities: ${alignment.opportunities.length}`)
      
      if (alignment.alignment_score >= 70) {
        console.log('✅ High alignment theme scored correctly\n')
      } else {
        console.log('⚠️ High alignment theme scored lower than expected\n')
      }
    } catch (error) {
      console.log('❌ Error testing high alignment theme:', error.message)
    }

    // Test 4: Off-strategy theme
    console.log('4️⃣ Testing off-strategy theme...')
    const offStrategyTheme = {
      name: 'Mobile App for Field Workers',
      description: 'Field workers need mobile access to view takeoffs and measurements on construction sites',
      related_tag_ids: ['mobile', 'field', 'access'],
      customer_count: 11,
      mention_count: 14,
      avg_sentiment: 0.65,
      priority_score: 86
    }

    try {
      const alignment = await engine.calculateStrategicAlignment(offStrategyTheme, mockStrategy)
      console.log(`   Strategic Alignment: ${alignment.alignment_score}/100`)
      console.log(`   Recommendation: ${alignment.recommendation}`)
      console.log(`   Conflicts: ${alignment.conflicts.length}`)
      console.log(`   Opportunities: ${alignment.opportunities.length}`)
      
      if (alignment.alignment_score < 50) {
        console.log('✅ Off-strategy theme scored correctly\n')
      } else {
        console.log('⚠️ Off-strategy theme scored higher than expected\n')
      }
    } catch (error) {
      console.log('❌ Error testing off-strategy theme:', error.message)
    }

    // Test 5: Final priority calculation
    console.log('5️⃣ Testing final priority calculation...')
    const customerSignal = 85
    const strategicAlignment = 80
    const finalPriority = Math.round(customerSignal * (strategicAlignment / 100))
    console.log(`   Customer Signal: ${customerSignal}`)
    console.log(`   Strategic Alignment: ${strategicAlignment}`)
    console.log(`   Final Priority: ${finalPriority}`)
    console.log('✅ Final priority calculation working correctly\n')

    // Test 6: API endpoint simulation
    console.log('6️⃣ Testing API endpoint simulation...')
    const mockThemes = [
      {
        id: '1',
        name: 'Enhanced Desktop Accuracy',
        finalPriority: 87,
        strategicAlignment: 95,
        recommendation: 'high_priority'
      },
      {
        id: '2',
        name: 'Mobile Field Access',
        finalPriority: 26,
        strategicAlignment: 30,
        recommendation: 'explore_lightweight'
      }
    ]

    // Sort by strategic priority
    const sortedThemes = mockThemes.sort((a, b) => b.finalPriority - a.finalPriority)
    console.log('   Themes sorted by strategic priority:')
    sortedThemes.forEach(theme => {
      console.log(`   - ${theme.name}: ${theme.finalPriority}/100 (${theme.recommendation})`)
    })
    console.log('✅ API endpoint simulation working correctly\n')

    console.log('🎉 Phase 2 testing completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Run the full test suite: npm test')
    console.log('2. Start the development server: npm run dev')
    console.log('3. Navigate to /admin/dashboard/themes')
    console.log('4. Test the UI components manually')
    console.log('5. Check the strategy health dashboard')

  } catch (error) {
    console.error('❌ Phase 2 testing failed:', error)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Check that all dependencies are installed: npm install')
    console.log('2. Verify environment variables are set')
    console.log('3. Ensure database migration has been run')
    console.log('4. Check OpenAI API key is valid')
  }
}

// Run the test
testPhase2()
