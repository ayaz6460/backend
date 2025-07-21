import axios from 'axios';

const payload = {
  assistantId: '7b18ca6f-1aab-466c-a329-c13fc555b1de', // Replace with your real assistant ID
  phoneNumber: '+916304334300' // Must be E.164 format
};

try {
  const response = await axios.post('https://api.vapi.ai/call', payload, {
    headers: {
      'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  console.log("✅ Call Triggered:", response.data);
} catch (error) {
  console.error("❌ Call failed:", error.response?.data || error.message);
}
