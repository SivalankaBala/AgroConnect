// Comprehensive E2E Verification Script for AgroConnect
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== Starting AgroConnect Full E2E Test Suite ===\n');
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
    const unauthListings = await fetch(`${BASE_URL}/crops/my-listings`);
    assert(unauthListings.status === 401, 'GET /crops/my-listings rejects unauthenticated requests with 401');

    const unauthEnquiries = await fetch(`${BASE_URL}/enquiries/my-enquiries`);
    assert(unauthEnquiries.status === 401, 'GET /enquiries/my-enquiries rejects unauthenticated requests with 401');

    // 2. Register Farmer 1
    console.log('\n--- Test 2: Register & Login Farmer 1 ---');
    const farmerEmail = `farmer_${timestamp}@agroconnect.test`;
    const regFarmerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Venkata Ramana',
        email: farmerEmail,
        password: 'Password123!',
        role: 'Farmer'
      })
    });
    const regFarmerData = await regFarmerRes.json();
    assert(regFarmerRes.status === 201, `Farmer 1 registration returns 201 (email: ${farmerEmail})`);
    assert(!!regFarmerData.token, 'Registration returns JWT token');
    assert(regFarmerData.user.role === 'Farmer', 'Farmer 1 user role is "Farmer"');
    const farmer1Token = regFarmerData.token;
    const farmer1Id = regFarmerData.user.id;

    // 3. Register Farmer 2 (to test cross-ownership isolation)
    console.log('\n--- Test 3: Register Farmer 2 (Cross-isolation check) ---');
    const farmer2Email = `farmer2_${timestamp}@agroconnect.test`;
    const regFarmer2Res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Suryanarayana Raju',
        email: farmer2Email,
        password: 'Password123!',
        role: 'Farmer'
      })
    });
    const regFarmer2Data = await regFarmer2Res.json();
    assert(regFarmer2Res.status === 201, 'Farmer 2 registration returns 201');
    const farmer2Token = regFarmer2Data.token;

    // 4. Register Buyer
    console.log('\n--- Test 4: Register & Login Buyer ---');
    const buyerEmail = `buyer_${timestamp}@agroconnect.test`;
    const regBuyerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Tuni Wholesale Mart',
        email: buyerEmail,
        password: 'Password123!',
        role: 'Buyer'
      })
    });
    const regBuyerData = await regBuyerRes.json();
    assert(regBuyerRes.status === 201, 'Buyer registration returns 201');
    assert(regBuyerData.user.role === 'Buyer', 'Buyer user role is "Buyer"');
    const buyerToken = regBuyerData.token;
    const buyerId = regBuyerData.user.id;

    // 5. Role check: Buyer cannot create crop listing
    console.log('\n--- Test 5: Role-based authorization for crop creation ---');
    const buyerCropRes = await fetch(`${BASE_URL}/crops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`
      },
      body: JSON.stringify({
        name: 'Illegal Crop',
        category: 'Grains',
        price: 30,
        unit: 'kg',
        quantity: 100,
        location: 'Tuni'
      })
    });
    assert(buyerCropRes.status === 403, 'POST /crops rejects Buyer role with 403 Forbidden');

    // 6. Farmer 1 creates a crop listing
    console.log('\n--- Test 6: Farmer creates valid crop listing ---');
    const createCropRes = await fetch(`${BASE_URL}/crops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmer1Token}`
      },
      body: JSON.stringify({
        name: 'Organic BPT 5204 Paddy',
        category: 'Grains',
        price: 32,
        unit: 'kg',
        quantity: 1200,
        location: 'Tuni, Payakaraopeta',
        description: 'Prime quality aged rice paddy directly harvested.'
      })
    });
    const cropData = await createCropRes.json();
    assert(createCropRes.status === 201, 'POST /crops succeeds with 201 Created');
    assert(cropData.farmer.toString() === farmer1Id, 'Crop farmer ObjectId matches authenticated Farmer 1 ID');
    const testCropId = cropData._id;

    // 7. Verify crop in Farmer 1's dashboard
    console.log('\n--- Test 7: Verify crop in Farmer 1 Dashboard ---');
    const farmer1ListingsRes = await fetch(`${BASE_URL}/crops/my-listings`, {
      headers: { Authorization: `Bearer ${farmer1Token}` }
    });
    const farmer1Listings = await farmer1ListingsRes.json();
    assert(farmer1ListingsRes.status === 200, 'GET /crops/my-listings returns 200 OK');
    const foundInFarmer1 = farmer1Listings.some(c => c._id === testCropId);
    assert(foundInFarmer1, 'Created crop appears in Farmer 1 listings');

    // 8. Verify Farmer 2 DOES NOT see Farmer 1's listing in their private dashboard
    console.log('\n--- Test 8: Farmer isolation in my-listings ---');
    const farmer2ListingsRes = await fetch(`${BASE_URL}/crops/my-listings`, {
      headers: { Authorization: `Bearer ${farmer2Token}` }
    });
    const farmer2Listings = await farmer2ListingsRes.json();
    const foundInFarmer2 = farmer2Listings.some(c => c._id === testCropId);
    assert(!foundInFarmer2, 'Farmer 2 does NOT see Farmer 1 crops in their dashboard (strict isolation)');

    // 9. Buyer sends enquiry for Farmer 1's crop
    console.log('\n--- Test 9: Buyer sends enquiry for crop ---');
    const enquiryRes = await fetch(`${BASE_URL}/enquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`
      },
      body: JSON.stringify({
        cropId: testCropId,
        buyerName: 'Tuni Wholesale Mart',
        buyerEmail: buyerEmail,
        message: 'Requirement: 500 kg needed by Friday. Please confirm delivery.'
      })
    });
    const enquiryData = await enquiryRes.json();
    assert(enquiryRes.status === 201, 'POST /enquiries succeeds with 201 Created');
    assert(enquiryData.enquiry.buyer.toString() === buyerId, 'Enquiry buyer ObjectId matches authenticated Buyer ID');
    assert(enquiryData.enquiry.status === 'Pending', 'Initial enquiry status is "Pending"');
    const testEnquiryId = enquiryData.enquiry._id;

    // 10. Self-enquiry prevention: Farmer cannot enquire on own crop
    console.log('\n--- Test 10: Self-enquiry prevention ---');
    const selfEnquiryRes = await fetch(`${BASE_URL}/enquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmer1Token}`
      },
      body: JSON.stringify({
        cropId: testCropId,
        buyerName: 'Venkata Ramana',
        buyerEmail: farmerEmail,
        message: 'Testing self enquiry'
      })
    });
    assert(selfEnquiryRes.status === 400, 'POST /enquiries prevents farmer from enquiring on own crop (400 Bad Request)');

    // 11. Verify enquiry appears in Buyer Dashboard
    console.log('\n--- Test 11: Buyer Dashboard (GET /enquiries/my-enquiries) ---');
    const buyerEnquiriesRes = await fetch(`${BASE_URL}/enquiries/my-enquiries`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    const buyerEnquiries = await buyerEnquiriesRes.json();
    assert(buyerEnquiriesRes.status === 200, 'GET /enquiries/my-enquiries returns 200 OK');
    const foundInBuyer = buyerEnquiries.find(e => e._id === testEnquiryId);
    assert(!!foundInBuyer, 'Submitted enquiry appears in Buyer Dashboard');
    assert(foundInBuyer?.crop?.name === 'Organic BPT 5204 Paddy', 'Populated crop details (name, price, unit) present in response');

    // 12. Verify enquiry appears in Farmer 1's Dashboard
    console.log('\n--- Test 12: Farmer 1 Dashboard (GET /enquiries/farmer) ---');
    const farmerEnquiriesRes = await fetch(`${BASE_URL}/enquiries/farmer`, {
      headers: { Authorization: `Bearer ${farmer1Token}` }
    });
    const farmerEnquiries = await farmerEnquiriesRes.json();
    assert(farmerEnquiriesRes.status === 200, 'GET /enquiries/farmer returns 200 OK');
    const foundInFarmer = farmerEnquiries.find(e => e._id === testEnquiryId);
    assert(!!foundInFarmer, 'Enquiry appears in Farmer 1 incoming enquiries');

    // 13. Verify Farmer 2 DOES NOT receive Farmer 1's enquiries
    console.log('\n--- Test 13: Enquiry privacy isolation across farmers ---');
    const farmer2EnquiriesRes = await fetch(`${BASE_URL}/enquiries/farmer`, {
      headers: { Authorization: `Bearer ${farmer2Token}` }
    });
    const farmer2Enquiries = await farmer2EnquiriesRes.json();
    const foundInFarmer2Enq = farmer2Enquiries.some(e => e._id === testEnquiryId);
    assert(!foundInFarmer2Enq, 'Farmer 2 CANNOT see enquiries for Farmer 1 crops');

    // 14. Unauthorized status update attempt by Farmer 2
    console.log('\n--- Test 14: Cross-farmer enquiry status update prevention ---');
    const illegalPatchRes = await fetch(`${BASE_URL}/enquiries/${testEnquiryId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmer2Token}`
      },
      body: JSON.stringify({ status: 'Responded' })
    });
    assert(illegalPatchRes.status === 403, 'Farmer 2 cannot update Farmer 1 enquiry status (403 Forbidden)');

    // 15. Unauthorized status update attempt by Buyer
    console.log('\n--- Test 15: Buyer cannot update enquiry status ---');
    const buyerPatchRes = await fetch(`${BASE_URL}/enquiries/${testEnquiryId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`
      },
      body: JSON.stringify({ status: 'Closed' })
    });
    assert(buyerPatchRes.status === 403, 'Buyer cannot update enquiry status (403 Forbidden)');

    // 16. Legitimate status update by Farmer 1
    console.log('\n--- Test 16: Legitimate status update by owning Farmer 1 ---');
    const validPatchRes = await fetch(`${BASE_URL}/enquiries/${testEnquiryId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmer1Token}`
      },
      body: JSON.stringify({ status: 'Responded' })
    });
    const validPatchData = await validPatchRes.json();
    assert(validPatchRes.status === 200, 'Owning Farmer 1 updates enquiry status to "Responded" (200 OK)');
    assert(validPatchData.enquiry.status === 'Responded', 'Status confirmed updated in DB response');

    // 17. Verify status change is reflected in Buyer Dashboard
    console.log('\n--- Test 17: Buyer sees updated enquiry status ---');
    const buyerUpdatedRes = await fetch(`${BASE_URL}/enquiries/my-enquiries`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    const buyerUpdatedList = await buyerUpdatedRes.json();
    const buyerUpdatedEnquiry = buyerUpdatedList.find(e => e._id === testEnquiryId);
    assert(buyerUpdatedEnquiry?.status === 'Responded', 'Buyer Dashboard reflects updated status "Responded"');

    // 18. Farmer listing management: Update crop (PUT /api/crops/:id)
    console.log('\n--- Test 18: Farmer crop listing management (Edit / PUT) ---');
    const updateCropRes = await fetch(`${BASE_URL}/crops/${testCropId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmer1Token}`
      },
      body: JSON.stringify({
        price: 34,
        quantity: 1000,
        description: 'Updated price after wholesale booking.'
      })
    });
    const updateCropData = await updateCropRes.json();
    assert(updateCropRes.status === 200, 'Farmer 1 updates crop price & quantity (200 OK)');
    assert(updateCropData.crop.price === 34, 'Crop price successfully updated to 34');

    // 19. Unauthorized update attempt by Farmer 2
    console.log('\n--- Test 19: Cross-farmer crop edit prevention ---');
    const illegalCropEdit = await fetch(`${BASE_URL}/crops/${testCropId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmer2Token}`
      },
      body: JSON.stringify({ price: 10 })
    });
    assert(illegalCropEdit.status === 403, 'Farmer 2 cannot edit Farmer 1 crop listing (403 Forbidden)');

    // 20. Farmer listing management: Delete crop (DELETE /api/crops/:id)
    console.log('\n--- Test 20: Farmer crop listing management (Delete / DELETE) ---');
    const deleteRes = await fetch(`${BASE_URL}/crops/${testCropId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${farmer1Token}` }
    });
    assert(deleteRes.status === 200, 'Farmer 1 deletes own crop listing (200 OK)');

    // Verify deleted crop no longer in my-listings
    const afterDeleteRes = await fetch(`${BASE_URL}/crops/my-listings`, {
      headers: { Authorization: `Bearer ${farmer1Token}` }
    });
    const afterDeleteList = await afterDeleteRes.json();
    const stillExists = afterDeleteList.some(c => c._id === testCropId);
    assert(!stillExists, 'Deleted crop is completely removed from listings');

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
    console.error('Test suite failed with unexpected error:', err);
    process.exit(1);
  }
}

runTests();
