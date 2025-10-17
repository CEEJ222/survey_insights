// Test script to manually process the survey response
const { createAIOrchestrator } = require('./src/lib/ai/orchestrator');

async function testTagProcessing() {
  try {
    console.log('🧪 Testing tag processing for survey response...');
    
    const companyId = '7dd73527-565d-4098-9475-210bd58af35e';
    const responseId = '34d6e8aa-a2bc-4513-8eea-c194b8f5ded9';
    const customerId = '05c42d16-39ba-472c-9d22-2383f1f60ccb';
    
    // The actual response text from the survey
    const responseText = 'Very user friendly n/a Not very accurate n/a';
    
    const orchestrator = createAIOrchestrator(companyId);
    
    console.log('📝 Processing response text:', responseText);
    console.log('🏢 Company ID:', companyId);
    console.log('📋 Response ID:', responseId);
    console.log('👤 Customer ID:', customerId);
    
    const result = await orchestrator.processSurveyResponse(
      responseText,
      responseId,
      customerId
    );
    
    console.log('✅ Processing complete!');
    console.log('📊 Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testTagProcessing();
