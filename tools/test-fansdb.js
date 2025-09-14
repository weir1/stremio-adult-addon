const FansDBService = require('../src/services/fansdbService');
const streamHandler = require('../src/handlers/streamHandler');

// =====================================================================================
const FANSDB_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJjMzkxZTNhMy1iOWI1LTQxMmMtODlhNC03ZGY5ZjI1MmRjMDQiLCJzdWIiOiJBUElLZXkiLCJpYXQiOjE3NTAyNDc4MjJ9.H2bNZNBBo307rqdsi-6_QD5_iF7Dl0MXlrGLknxdHqA';
const TEST_PERFORMER_ID = '00a42493-3682-4352-8b67-1a218b05b4df'; // Angela White
const TEST_SCENE_ID = '00a68b6b-836a-4123-be8b-2d0b2833533c';
// =====================================================================================

async function runTest() {
  if (!FANSDB_API_KEY) {
    console.error('❌ FansDB API key is missing.');
    return;
  }

  const fansdbService = new FansDBService(FANSDB_API_KEY);

  console.log('🚀 Starting FansDB test...');

  // 1. Test getTopPerformers
  console.log('\n=================================');
  console.log('Step 1: Calling getTopPerformers');
  console.log('=================================');
  try {
    const performers = await fansdbService.getTopPerformers();
    if (performers.length > 0) {
      console.log('✅ Test Passed: getTopPerformers returned performers.');
      console.log('Sample performer:', performers[0]);
    } else {
      console.error('❌ Test Failed: getTopPerformers returned no performers.');
    }
  } catch (error) {
    console.error('❌ An error occurred during getTopPerformers:', error);
  }

  // 2. Test getPerformerMeta
  console.log('\n=================================');
  console.log(`Step 2: Calling getPerformerMeta for performer ${TEST_PERFORMER_ID}`);
  console.log('=================================');
  try {
    const meta = await fansdbService.getPerformerMeta(TEST_PERFORMER_ID);
    if (meta) {
      console.log('✅ Test Passed: getPerformerMeta returned metadata.');
      console.log('Performer meta:', meta);
    } else {
      console.error('❌ Test Failed: getPerformerMeta returned no metadata.');
    }
  } catch (error) {
    console.error('❌ An error occurred during getPerformerMeta:', error);
  }

  // 3. Test stream handler
  console.log('\n=================================');
  console.log(`Step 3: Calling stream handler for scene ${TEST_SCENE_ID}`);
  console.log('=================================');
  try {
    const userConfig = { fansdbApiKey: FANSDB_API_KEY, enableFansDB: true };
    const streams = await streamHandler.handle({ type: 'movie', id: `fansdb-scene:${TEST_PERFORMER_ID}:${TEST_SCENE_ID}` }, userConfig);
    if (streams.streams.length > 0) {
      console.log('✅ Test Passed: Stream handler returned streams.');
      console.log('Sample stream:', streams.streams[0]);
    } else {
      console.log('🟡 Info: Stream handler returned no streams. This might be expected if no torrents are found for the scene.');
    }
  } catch (error) {
    console.error('❌ An error occurred during the stream handler test:', error);
  }

  console.log('\n🚀 Test finished.');
}

runTest();
