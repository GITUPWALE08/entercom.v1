const BASE_URL = 'https://entercom-v1.onrender.com/api/v1';

async function checkEmail(emailAddress) {
  const [login, domain] = emailAddress.split('@');
  console.log(`Polling inbox for ${emailAddress}...`);
  
  for (let i = 0; i < 30; i++) {
    const res = await fetch(`https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`);
    const messages = await res.json();
    
    if (messages.length > 0) {
      console.log(`Found email! ID: ${messages[0].id}`);
      const msgRes = await fetch(`https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${messages[0].id}`);
      const msg = await msgRes.json();
      
      const body = msg.textBody || msg.htmlBody;
      const linkMatch = body.match(/https?:\/\/[^\s"'<]+/g);
      
      if (linkMatch) {
        const verifyLink = linkMatch.find(link => link.includes('verify'));
        if (verifyLink) {
          return verifyLink;
        }
      }
      return null;
    }
    
    await new Promise(r => setTimeout(r, 2000));
  }
  return null;
}

(async () => {
  const randomString = Math.random().toString(36).substring(7);
  const email = `test_customer_${randomString}@1secmail.com`;
  const password = "Password123!";

  console.log(`Starting API test with email: ${email}`);

  try {
    // 1. Register
    const registerResponse = await fetch(`${BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            first_name: 'Test',
            last_name: 'Customer',
            email: email,
            password: password,
            phone_number: '+234800' + Math.floor(1000000 + Math.random() * 9000000).toString(),
            role: 'customer'
        })
    });

    if (!registerResponse.ok) {
        const err = await registerResponse.text();
        throw new Error(`Registration failed: ${registerResponse.status} ${err}`);
    }
    
    console.log("Registration API successful.");

    // 2. Poll for email
    const verifyLink = await checkEmail(email);
    if (!verifyLink) {
      throw new Error("Could not find verification link in email.");
    }
    
    console.log(`Found verification link: ${verifyLink}`);

    // The verification link is usually for the frontend (e.g. /verify-email?token=xyz).
    // Let's extract the token and hit the backend API directly, or just fetch the verifyLink if it hits backend.
    // The frontend extracts `token` and POSTs to `/auth/verify-email/` or does GET.
    const urlObj = new URL(verifyLink);
    const token = urlObj.searchParams.get('token');
    
    if (token) {
        console.log(`Extracted token: ${token}. Verifying...`);
        const verifyResponse = await fetch(`${BASE_URL}/auth/verify-email/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        
        if (!verifyResponse.ok) {
            const err = await verifyResponse.text();
            console.log(`Verification failed: ${verifyResponse.status} ${err}`);
            // Sometimes GET is used instead of POST, let's just log and continue
        } else {
            console.log("Email verification API successful.");
        }
    } else {
        // If it's a direct backend link
        console.log("Visiting link directly...");
        await fetch(verifyLink);
    }

    // 3. Login
    const loginResponse = await fetch(`${BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: email,
            password: password
        })
    });

    if (!loginResponse.ok) {
        const err = await loginResponse.text();
        throw new Error(`Login failed: ${loginResponse.status} ${err}`);
    }

    const loginData = await loginResponse.json();
    console.log("✅ Successfully logged in! Access token received:", loginData.tokens?.access ? "YES" : "NO");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
})();
