// ============================================================================
// TAG NORMALIZER TESTS
// ============================================================================
// Manual test file for tag normalization
// Run these tests to verify normalization works correctly
// ============================================================================

import { createTagNormalizer } from '../tag-normalizer'

// Test company ID (use your actual company ID)
const TEST_COMPANY_ID = 'your-company-id-here'

/**
 * Test 1: Basic tag normalization
 */
export async function testBasicNormalization() {
  console.log('\n🧪 Test 1: Basic Tag Normalization')
  console.log('=' .repeat(50))

  const normalizer = createTagNormalizer(TEST_COMPANY_ID)

  const testCases = [
    {
      input: ['slow', 'dashboard', 'loading'],
      expected: 'Should normalize "slow" and "loading" to "performance"',
    },
    {
      input: ['pricing', 'price', 'cost'],
      expected: 'Should normalize to single "pricing" tag',
    },
    {
      input: ['ui', 'interface', 'design'],
      expected: 'Should normalize to "ux"',
    },
    {
      input: ['bug', 'error', 'broken'],
      expected: 'Should normalize to "bug"',
    },
  ]

  for (const testCase of testCases) {
    console.log(`\nInput: ${JSON.stringify(testCase.input)}`)
    console.log(`Expected: ${testCase.expected}`)

    try {
      const result = await normalizer.normalizeTags(testCase.input)
      console.log(`✅ Result: ${JSON.stringify(result)}`)
    } catch (error) {
      console.error(`❌ Error:`, error)
    }
  }
}

/**
 * Test 2: Duplicate detection
 */
export async function testDuplicateDetection() {
  console.log('\n🧪 Test 2: Duplicate Detection')
  console.log('='.repeat(50))

  const normalizer = createTagNormalizer(TEST_COMPANY_ID)

  try {
    console.log('\nDetecting duplicates in company tags...')
    const duplicates = await normalizer.detectDuplicates()

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found (or not enough data)')
    } else {
      console.log(`\n✅ Found ${duplicates.length} duplicate groups:\n`)

      duplicates.forEach((dup, i) => {
        console.log(`${i + 1}. Merge "${dup.variants.join('", "')}" → "${dup.canonical}"`)
        console.log(`   Confidence: ${(dup.confidence * 100).toFixed(0)}%`)
        console.log(`   Reasoning: ${dup.reasoning}`)
        console.log(`   Affects: ${dup.affectedCount || '?'} items`)
        console.log()
      })
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

/**
 * Test 3: Detailed normalization (with changes)
 */
export async function testDetailedNormalization() {
  console.log('\n🧪 Test 3: Detailed Normalization')
  console.log('='.repeat(50))

  const normalizer = createTagNormalizer(TEST_COMPANY_ID)

  const testTags = ['slow', 'sluggish', 'dashboard', 'ui', 'expensive']

  console.log(`\nInput tags: ${JSON.stringify(testTags)}`)

  try {
    const result = await normalizer.normalizeTagsDetailed(testTags)

    console.log(`\n✅ Normalization complete:`)
    console.log(`   Original: ${JSON.stringify(result.originalTags)}`)
    console.log(`   Normalized: ${JSON.stringify(result.normalizedTags)}`)
    console.log(`   Cached: ${result.cached}`)

    if (result.changes.length > 0) {
      console.log(`\n   Changes made:`)
      result.changes.forEach((change) => {
        console.log(`   - "${change.from}" → "${change.to}"`)
      })
    } else {
      console.log(`   No changes needed`)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('🚀 Starting Tag Normalizer Tests')
  console.log('='.repeat(50))

  await testBasicNormalization()
  await testDetailedNormalization()
  await testDuplicateDetection()

  console.log('\n✅ All tests complete!')
}

// Uncomment to run tests directly
// runAllTests()



