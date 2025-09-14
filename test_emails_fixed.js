// Load environment variables first
require('dotenv').config();

const { sendLoginEmail, sendAdminNotification, sendApprovalEmail, sendRejectionEmail, sendUserApprovalEmail } = require('./dist/services/emailService');

async function testEmailFunctionality() {
  console.log('🧪 Testing Email Functionality...\n');
  
  // Check if environment variables are loaded
  console.log('📋 Environment Variables Check:');
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing');
  console.log('');

  const testEmail = 'test@example.com';
  const testName = 'Test User';
  const testAdmin = {
    name: 'Test Admin',
    email: 'admin@example.com',
    role: 'ADMIN'
  };

  try {
    // Test 1: Login Email
    console.log('1️⃣ Testing Login Email...');
    await sendLoginEmail(testEmail);
    console.log('✅ Login email test completed\n');

    // Test 2: Admin Notification Email
    console.log('2️⃣ Testing Admin Notification Email...');
    await sendAdminNotification(testAdmin);
    console.log('✅ Admin notification email test completed\n');

    // Test 3: Approval Email
    console.log('3️⃣ Testing Approval Email...');
    await sendApprovalEmail(testEmail, testName);
    console.log('✅ Approval email test completed\n');

    // Test 4: Rejection Email
    console.log('4️⃣ Testing Rejection Email...');
    await sendRejectionEmail(testEmail, testName);
    console.log('✅ Rejection email test completed\n');

    // Test 5: User Approval Email
    console.log('5️⃣ Testing User Approval Email...');
    await sendUserApprovalEmail(testEmail, testName);
    console.log('✅ User approval email test completed\n');

    console.log('🎉 All email tests completed successfully!');
    console.log('\n📧 Check your email inbox to verify the emails were sent.');
    console.log('📝 Note: Make sure EMAIL_USER and EMAIL_PASS are set in your .env file');

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if EMAIL_USER and EMAIL_PASS are set in .env');
    console.log('2. Verify Gmail app password is correct');
    console.log('3. Ensure Gmail 2FA is enabled');
    console.log('4. Check internet connection');
  }
}

// Run the test
testEmailFunctionality();
