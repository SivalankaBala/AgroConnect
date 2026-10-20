/**
 * AgroConnect — Automated Test Suite for Order Confirmation, Rejection & Buyer Notifications
 */
const mongoose = require('mongoose');
const { spawn } = require('child_process');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';
let serverProcess = null;

async function checkServer() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureServerRunning() {
  const isUp = await checkServer();
  if (isUp) return;

  console.log('Starting backend server for test suite...');
  serverProcess = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'ignore',
    shell: true
  });

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 800));
    if (await checkServer()) {
      console.log('Backend server successfully started.');
      return;
    }
  }
  throw new Error('Could not connect to backend server on port 5000');
}

async function runTests() {
  console.log('=== Starting AgroConnect Order Actions & Notifications Test Suite ===\n');
  await ensureServerRunning();

  const timestamp = Date.now();
  const farmerEmail = `farmer_${timestamp}@test.com`;
  const buyerEmail = `buyer_${timestamp}@test.com`;
  const otherFarmerEmail = `other_farmer_${timestamp}@test.com`;
  const password = 'Password@123';

  // 1. Register Farmer
  const farmerRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Farmer', email: farmerEmail, password, role: 'Farmer' })
  });
  const farmerData = await farmerRegRes.json();
  const farmerToken = farmerData.token;
  console.log('✓ Farmer registered successfully.');

  // 2. Register Buyer
  const buyerRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Buyer', email: buyerEmail, password, role: 'Buyer' })
  });
  const buyerData = await buyerRegRes.json();
  const buyerToken = buyerData.token;
  console.log('✓ Buyer registered successfully.');

  // 3. Register Other Farmer (for unauthorized test)
  const otherFarmerRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Other Farmer', email: otherFarmerEmail, password, role: 'Farmer' })
  });
  const otherFarmerData = await otherFarmerRegRes.json();
  const otherFarmerToken = otherFarmerData.token;
  console.log('✓ Other Farmer registered successfully.');

  // 4. Farmer lists a crop
  const cropRes = await fetch(`${BASE_URL}/api/crops`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${farmerToken}` },
    body: JSON.stringify({
      name: 'Organic Basmati Rice',
      category: 'Grains',
      price: 65,
      unit: 'kg',
      quantity: 500,
      location: 'Kakinada, AP',
      farmerName: 'Test Farmer',
      description: 'Fresh harvest'
    })
  });
  const cropData = await cropRes.json();
  const cropId = cropData.crop?._id || cropData._id;
  console.log('✓ Crop listed successfully (ID:', cropId, ')');

  // 5. Buyer submits 2 enquiries
  const enq1Res = await fetch(`${BASE_URL}/api/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({
      buyerName: 'Test Buyer',
      buyerEmail,
      message: 'Need 100 kg Rice urgently',
      cropId
    })
  });
  const enq1Data = await enq1Res.json();
  const enquiry1Id = enq1Data.enquiry._id;

  const enq2Res = await fetch(`${BASE_URL}/api/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({
      buyerName: 'Test Buyer',
      buyerEmail,
      message: 'Need 50 kg Rice sample',
      cropId
    })
  });
  const enq2Data = await enq2Res.json();
  const enquiry2Id = enq2Data.enquiry._id;
  console.log('✓ Buyer submitted 2 enquiries (IDs:', enquiry1Id, enquiry2Id, ')');

  // Test 6: Unauthorized farmer cannot confirm order
  const unauthRes = await fetch(`${BASE_URL}/api/enquiries/${enquiry1Id}/confirm`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${otherFarmerToken}` }
  });
  if (unauthRes.status === 403) {
    console.log('✓ Unauthorized farmer correctly blocked with 403 Forbidden.');
  } else {
    throw new Error(`Expected 403 for unauthorized farmer, got ${unauthRes.status}`);
  }

  // Test 7: Authorized farmer confirms Enquiry 1
  const confirmRes = await fetch(`${BASE_URL}/api/enquiries/${enquiry1Id}/confirm`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${farmerToken}` }
  });
  const confirmData = await confirmRes.json();
  if (confirmRes.ok && confirmData.enquiry.status === 'confirmed') {
    console.log('✓ Enquiry 1 confirmed successfully by authorized farmer.');
  } else {
    throw new Error(`Confirmation failed: ${JSON.stringify(confirmData)}`);
  }

  // Test 8: Duplicate confirmation is blocked
  const dupConfirmRes = await fetch(`${BASE_URL}/api/enquiries/${enquiry1Id}/confirm`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${farmerToken}` }
  });
  if (dupConfirmRes.status === 400) {
    console.log('✓ Duplicate confirmation correctly blocked with 400.');
  } else {
    throw new Error(`Expected 400 for duplicate confirmation, got ${dupConfirmRes.status}`);
  }

  // Test 9: Rejecting confirmed order is blocked
  const rejectConfirmedRes = await fetch(`${BASE_URL}/api/enquiries/${enquiry1Id}/reject`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${farmerToken}` }
  });
  if (rejectConfirmedRes.status === 400) {
    console.log('✓ Rejecting confirmed order correctly blocked with 400.');
  } else {
    throw new Error(`Expected 400 for rejecting confirmed order, got ${rejectConfirmedRes.status}`);
  }

  // Test 10: Authorized farmer rejects Enquiry 2
  const rejectRes = await fetch(`${BASE_URL}/api/enquiries/${enquiry2Id}/reject`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${farmerToken}` }
  });
  const rejectData = await rejectRes.json();
  if (rejectRes.ok && rejectData.enquiry.status === 'rejected') {
    console.log('✓ Enquiry 2 rejected successfully by authorized farmer.');
  } else {
    throw new Error(`Rejection failed: ${JSON.stringify(rejectData)}`);
  }

  // Test 11: Re-rejecting is blocked
  const dupRejectRes = await fetch(`${BASE_URL}/api/enquiries/${enquiry2Id}/reject`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${farmerToken}` }
  });
  if (dupRejectRes.status === 400) {
    console.log('✓ Duplicate rejection correctly blocked with 400.');
  } else {
    throw new Error(`Expected 400 for duplicate rejection, got ${dupRejectRes.status}`);
  }

  // Test 12: Buyer fetches notifications
  const notifRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${buyerToken}` }
  });
  const notifData = await notifRes.json();
  if (notifRes.ok && notifData.notifications.length === 2 && notifData.unreadCount === 2) {
    console.log('✓ Buyer has 2 unread notifications in database.');
    const confirmedNotif = notifData.notifications.find((n) => n.status === 'confirmed');
    const rejectedNotif = notifData.notifications.find((n) => n.status === 'rejected');

    if (confirmedNotif && confirmedNotif.title === 'Order Confirmed!' && confirmedNotif.message.includes('confirmed by the farmer')) {
      console.log('✓ Order Confirmed notification title & message verified perfectly.');
    } else {
      throw new Error(`Confirmed notification text mismatch: ${JSON.stringify(confirmedNotif)}`);
    }

    if (rejectedNotif && rejectedNotif.title === 'Order Update' && rejectedNotif.message.includes('could not be accepted')) {
      console.log('✓ Order Update (Rejected) notification title & message verified perfectly.');
    } else {
      throw new Error(`Rejected notification text mismatch: ${JSON.stringify(rejectedNotif)}`);
    }

    // Test 13: Other user cannot see buyer's notifications
    const otherNotifRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${farmerToken}` }
    });
    const otherNotifData = await otherNotifRes.json();
    if (otherNotifData.notifications.length === 0) {
      console.log('✓ Other users receive 0 notifications (private isolation verified).');
    } else {
      throw new Error('Notifications isolation leaked to another user!');
    }

    // Test 14: Mark single notification as read
    const markReadRes = await fetch(`${BASE_URL}/api/notifications/${confirmedNotif._id}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    const markReadData = await markReadRes.json();
    if (markReadRes.ok && markReadData.notification.read === true) {
      console.log('✓ Single notification marked as read.');
    } else {
      throw new Error(`Failed to mark single notification read: ${JSON.stringify(markReadData)}`);
    }

    // Verify unread count is now 1
    const verifyUnreadRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    const verifyUnreadData = await verifyUnreadRes.json();
    if (verifyUnreadData.unreadCount === 1) {
      console.log('✓ Unread count decremented to 1.');
    } else {
      throw new Error(`Expected unread count 1, got ${verifyUnreadData.unreadCount}`);
    }

    // Test 15: Mark all notifications as read
    const markAllRes = await fetch(`${BASE_URL}/api/notifications/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    if (markAllRes.ok) {
      console.log('✓ Mark all notifications as read succeeded.');
    }

    const finalNotifRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    const finalNotifData = await finalNotifRes.json();
    if (finalNotifData.unreadCount === 0) {
      console.log('✓ Final unread count is 0 after mark-all-read.');
    } else {
      throw new Error(`Expected unread count 0, got ${finalNotifData.unreadCount}`);
    }
  } else {
    throw new Error(`Notification test failed: ${JSON.stringify(notifData)}`);
  }

  console.log('\n=== ALL 15 BACKEND TESTS PASSED SUCCESSFULLY! ===');
  if (serverProcess) {
    serverProcess.kill();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  if (serverProcess) serverProcess.kill();
  process.exit(1);
});
