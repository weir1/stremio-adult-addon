const FansDBService = require('../src/services/fansdbService');

const FANSDB_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJjMzkxZTNhMy1iOWI1LTQxMmMtODlhNC03ZGY5ZjI1MmRjMDQiLCJzdWIiOiJBUElLZXkiLCJpYXQiOjE3NTAyNDc4MjJ9.H2bNZNBBo307rqdsi-6_QD5_iF7Dl0MXlrGLknxdHqA';
const TEST_PERFORMER_ID = '00a42493-3682-4352-8b67-1a218b05b4df'; // Angela White

async function runTest() {
  if (!FANSDB_API_KEY) {
    console.error('❌ FansDB API key is missing.');
    return;
  }

  const fansdbService = new FansDBService(FANSDB_API_KEY);

  console.log('🚀 Starting FansDB programmatic test...');

  console.log('\n=================================');
  console.log('Step 1: Calling getTopPerformers (simplified query)');
  console.log('=================================');
  try {
    const performers = await fansdbService.getTopPerformers();
    if (performers && performers.length > 0) {
      console.log('✅ Test Passed: getTopPerformers returned performers.');
      console.log('Sample performer:', performers[0]);
    } else {
      console.error('❌ Test Failed: getTopPerformers returned no performers or an error occurred.');
    }
  } catch (error) {
    console.error('❌ An error occurred during getTopPerformers:', error);
  }

  console.log('\n=================================');
  console.log(`Step 2: Calling getPerformerMeta for performer ${TEST_PERFORMER_ID} (simplified query)`);
  console.log('=================================');
  try {
    const meta = await fansdbService.getPerformerMeta(TEST_PERFORMER_ID);
    if (meta) {
      console.log('✅ Test Passed: getPerformerMeta returned metadata.');
      console.log('Performer meta:', meta);
    } else {
      console.error('❌ Test Failed: getPerformerMeta returned no metadata or an error occurred.');
    }
  } catch (error) {
    console.error('❌ An error occurred during getPerformerMeta:', error);
  }

  console.log('\n🚀 Test finished.');
}

runTest();
