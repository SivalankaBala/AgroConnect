// Comprehensive Chat & Socket.IO Test Suite for AgroConnect
const { io: ioClient } = require('socket.io-client');
const { spawn } = require('child_process');

const BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function isServerAlive() {
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureServer() {
  if (await isServerAlive()) {
    console.log('[INFO] Backend server is already running on port 5000.\n');
    return null;
  }

  console.log('[INFO] Backend server is not running on port 5000. Launching instance for tests...');
  const child = spawn(process.execPath, ['server.js'], {
    cwd: __dirname,
    stdio: 'ignore'
  });

  const start = Date.now();
  while (Date.now() - start < 15000) {
    await new Promise((r) => setTimeout(r, 600));
    if (await isServerAlive()) {
      console.log('[INFO] Backend server launched successfully!\n');
      return child;
    }
  }

  console.warn('[WARN] Server did not become ready within 15s. Proceeding with tests...\n');
  return child;
}

async function runChatTests() {
  console.log('=== Starting AgroConnect Chat & Real-Time Test Suite ===\n');
  let spawnedServer = null;
  try {
    spawnedServer = await ensureServer();
  } catch (err) {
    console.warn('[WARN] Could not auto-start server:', err.message);
  }

  const timestamp = Date.now();
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${message}`);
      failedCount++;
    }
  }

  try {
    // 1. Unauthenticated checks
    console.log('--- Test 1: Protected route access without token ---');
    const unauthConvs = await fetch(`${BASE_URL}/chat/conversations`);
    assert(unauthConvs.status === 401, 'GET /chat/conversations rejects unauthenticated requests with 401');

    const unauthUnread = await fetch(`${BASE_URL}/chat/unread-count`);
    assert(unauthUnread.status === 401, 'GET /chat/unread-count rejects unauthenticated requests with 401');

    // 2. Register Farmer 1
    console.log('\n--- Test 2: Register Farmer 1 & Buyer 1 ---');
    const farmerEmail = `chat_farmer_${timestamp}@agroconnect.test`;
    const regFarmerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Appala Naidu',
        email: farmerEmail,
        password: 'Password123!',
        role: 'Farmer'
      })
    });
    const regFarmerData = await regFarmerRes.json();
    assert(regFarmerRes.status === 201, 'Farmer 1 registered successfully');
    const farmerToken = regFarmerData.token;
    const farmerId = regFarmerData.user.id;

    // Register Buyer 1
    const buyerEmail = `chat_buyer_${timestamp}@agroconnect.test`;
    const regBuyerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kakinada Retailer',
        email: buyerEmail,
        password: 'Password123!',
        role: 'Buyer'
      })
    });
    const regBuyerData = await regBuyerRes.json();
    assert(regBuyerRes.status === 201, 'Buyer 1 registered successfully');
    const buyerToken = regBuyerData.token;
    const buyerId = regBuyerData.user.id;

    // Register Farmer 2 (for privacy testing)
    const farmer2Email = `chat_farmer2_${timestamp}@agroconnect.test`;
    const regFarmer2Res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Chinna Rao',
        email: farmer2Email,
        password: 'Password123!',
        role: 'Farmer'
      })
    });
    const regFarmer2Data = await regFarmer2Res.json();
    const farmer2Token = regFarmer2Data.token;
    const farmer2Id = regFarmer2Data.user.id;

    // Register Buyer 2 (for privacy testing)
    const buyer2Email = `chat_buyer2_${timestamp}@agroconnect.test`;
    const regBuyer2Res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Vizag Trader',
        email: buyer2Email,
        password: 'Password123!',
        role: 'Buyer'
      })
    });
    const regBuyer2Data = await regBuyer2Res.json();
    const buyer2Token = regBuyer2Data.token;
    const buyer2Id = regBuyer2Data.user.id;

    // 3. Farmer 1 creates a crop listing
    console.log('\n--- Test 3: Create crop listing for chat testing ---');
    const cropRes = await fetch(`${BASE_URL}/crops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`
      },
      body: JSON.stringify({
        name: 'Guntur Sannam Chilli',
        category: 'Spices',
        price: 180,
        unit: 'kg',
        quantity: 500,
        location: 'Guntur'
      })
    });
    const cropData = await cropRes.json();
    assert(cropRes.status === 201, 'Farmer 1 created crop listing');
    const cropId = cropData._id || cropData.crop?._id;

    // 4. Create/Get Conversation between Buyer 1 and Farmer 1
    console.log('\n--- Test 4: Buyer creates conversation with Farmer 1 ---');
    const convRes = await fetch(`${BASE_URL}/chat/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`
      },
      body: JSON.stringify({
        recipientId: farmerId,
        cropId: cropId
      })
    });
    const convData = await convRes.json();
    assert(convRes.status === 201 || convRes.status === 200, 'POST /chat/conversations returns 201/200');
    assert(!!convData._id, 'Conversation has valid _id');
    const conversationId = convData._id;

    // 5. Duplicate conversation check: Re-opening does NOT create a duplicate
    console.log('\n--- Test 5: Re-opening chat returns same conversation (no duplicates) ---');
    const dupCheckRes = await fetch(`${BASE_URL}/chat/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`
      },
      body: JSON.stringify({
        recipientId: farmerId,
        cropId: cropId
      })
    });
    const dupCheckData = await dupCheckRes.json();
    assert(dupCheckRes.status === 200, 'Re-opening returns 200 OK');
    assert(dupCheckData._id === conversationId, 'Existing conversation ID returned without duplicating');

    // 6. Validation: self-messaging rejected
    console.log('\n--- Test 6: Self-messaging validation ---');
    const selfMsgRes = await fetch(`${BASE_URL}/chat/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`
      },
      body: JSON.stringify({
        recipientId: buyerId
      })
    });
    assert(selfMsgRes.status === 400, 'Cannot start conversation with yourself (400 Bad Request)');

    // 7. Buyer sends a message in the conversation
    console.log('\n--- Test 7: Buyer sends message to Farmer ---');
    const msg1Text = 'Namaskaram! Is this Guntur Sannam Chilli available for delivery to Kakinada?';
    const sendMsgRes = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`
      },
      body: JSON.stringify({
        text: msg1Text
      })
    });
    const sendMsgData = await sendMsgRes.json();
    assert(sendMsgRes.status === 201, 'POST message in conversation returns 201 Created');
    assert(sendMsgData.message.text === msg1Text, 'Saved message text matches input');
    assert(sendMsgData.message.sender._id === buyerId || sendMsgData.message.sender.name === 'Kakinada Retailer', 'Sender populated correctly');
    assert(sendMsgData.message.read === false, 'Message initial read status is false');

    // 8. Empty message validation
    console.log('\n--- Test 8: Empty message rejection ---');
    const emptyMsgRes = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`
      },
      body: JSON.stringify({ text: '   ' })
    });
    assert(emptyMsgRes.status === 400, 'Empty message rejected with 400 Bad Request');

    // 9. Check unread count for Farmer 1
    console.log('\n--- Test 9: Unread message count check for Farmer 1 ---');
    const farmerUnreadRes = await fetch(`${BASE_URL}/chat/unread-count`, {
      headers: { Authorization: `Bearer ${farmerToken}` }
    });
    const farmerUnreadData = await farmerUnreadRes.json();
    assert(farmerUnreadRes.status === 200, 'GET /chat/unread-count returns 200');
    assert(farmerUnreadData.unreadCount >= 1, `Farmer 1 has ${farmerUnreadData.unreadCount} unread message(s)`);

    // Buyer unread count should be 0 (sent by buyer)
    const buyerUnreadRes = await fetch(`${BASE_URL}/chat/unread-count`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    const buyerUnreadData = await buyerUnreadRes.json();
    assert(buyerUnreadData.unreadCount === 0, 'Buyer unread count is 0 for own messages');

    // 10. Farmer fetches messages -> auto marks as read
    console.log('\n--- Test 10: Farmer loads messages & auto-marks as read ---');
    const farmerFetchMsgs = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${farmerToken}` }
    });
    const farmerMsgsData = await farmerFetchMsgs.json();
    assert(farmerFetchMsgs.status === 200, 'GET conversation messages returns 200 OK');
    assert(farmerMsgsData.messages.length >= 1, 'Farmer retrieved message history');
    assert(farmerMsgsData.messages[0].text === msg1Text, 'First message content verified');

    // Verify unread count is now 0 for Farmer 1
    const farmerAfterRead = await fetch(`${BASE_URL}/chat/unread-count`, {
      headers: { Authorization: `Bearer ${farmerToken}` }
    });
    const farmerAfterData = await farmerAfterRead.json();
    assert(farmerAfterData.unreadCount === 0, 'Farmer unread count cleared to 0 after loading conversation');

    // 11. Farmer replies to Buyer
    console.log('\n--- Test 11: Farmer replies to Buyer ---');
    const replyText = 'Avunu sir, we have 500kg fresh batch ready. Transportation to Kakinada can be arranged!';
    const replyRes = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`
      },
      body: JSON.stringify({ text: replyText })
    });
    const replyData = await replyRes.json();
    assert(replyRes.status === 201, 'Farmer reply sent with 201 Created');
    assert(replyData.message.text === replyText, 'Reply message stored properly');

    // 12. Buyer sees unread count of 1
    console.log('\n--- Test 12: Buyer sees unread message from Farmer ---');
    const buyerNewUnread = await fetch(`${BASE_URL}/chat/unread-count`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    const buyerNewData = await buyerNewUnread.json();
    assert(buyerNewData.unreadCount === 1, 'Buyer has 1 unread message after Farmer reply');

    // 13. Privacy & Isolation check: Buyer 2 and Farmer 2 cannot access Buyer 1's conversation
    console.log('\n--- Test 13: Privacy & Cross-participant access prevention ---');
    const unauthorizedGet = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${buyer2Token}` }
    });
    assert(unauthorizedGet.status === 403, 'Buyer 2 blocked from reading Buyer 1 conversation (403 Forbidden)');

    const unauthorizedPost = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmer2Token}`
      },
      body: JSON.stringify({ text: 'Unauthorized message attempt' })
    });
    assert(unauthorizedPost.status === 403, 'Farmer 2 blocked from posting in Farmer 1 conversation (403 Forbidden)');

    // Buyer 2 conversation list does not contain Buyer 1's conversation
    const buyer2Convs = await fetch(`${BASE_URL}/chat/conversations`, {
      headers: { Authorization: `Bearer ${buyer2Token}` }
    });
    const buyer2ConvsData = await buyer2Convs.json();
    const hasLeakedConv = buyer2ConvsData.some(c => c._id === conversationId);
    assert(!hasLeakedConv, 'Buyer 2 conversation list is strictly isolated (0 leakage)');

    // 14. Real-time Socket.IO test
    console.log('\n--- Test 14: Socket.IO Real-time Connection & Message Delivery ---');
    let socketReceivedMessage = null;

    await new Promise((resolve) => {
      // Connect Buyer socket
      const buyerSocket = ioClient(SOCKET_URL, {
        auth: { token: buyerToken },
        transports: ['websocket']
      });

      // Connect Farmer socket
      const farmerSocket = ioClient(SOCKET_URL, {
        auth: { token: farmerToken },
        transports: ['websocket']
      });

      farmerSocket.on('connect', () => {
        farmerSocket.emit('join_conversation', conversationId);
      });

      farmerSocket.on('new_message', (msg) => {
        socketReceivedMessage = msg;
        buyerSocket.disconnect();
        farmerSocket.disconnect();
        resolve();
      });

      buyerSocket.on('connect', () => {
        buyerSocket.emit('join_conversation', conversationId);
        // Send a message via socket
        setTimeout(() => {
          buyerSocket.emit('send_message', {
            conversationId,
            text: 'Real-time test message via Socket.IO!'
          });
        }, 500);
      });

      // Timeout after 6s in case socket is delayed
      setTimeout(() => {
        buyerSocket.disconnect();
        farmerSocket.disconnect();
        resolve();
      }, 6000);
    });

    assert(!!socketReceivedMessage, 'Farmer socket received real-time "new_message" event');
    assert(socketReceivedMessage?.text === 'Real-time test message via Socket.IO!', 'Real-time message text verified');

    console.log('\n=======================================');
    console.log(`TOTAL TESTS: ${passedCount + failedCount}`);
    console.log(`PASSED: ${passedCount}`);
    console.log(`FAILED: ${failedCount}`);
    console.log('=======================================');

    if (failedCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    if (err.cause?.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
      console.error('\n[ERROR] Connection refused! The AgroConnect backend server is not running on http://localhost:5000.');
      console.error('Please start the backend server before running tests:');
      console.error('   cd C:\\Projects\\AgroConnect\\backend');
      console.error('   npm start\n');
    } else {
      console.error('Chat test suite failed with error:', err);
    }
    process.exit(1);
  } finally {
    if (spawnedServer) {
      try {
        spawnedServer.kill();
      } catch {}
    }
  }
}

runChatTests();
