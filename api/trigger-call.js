import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  const { pin, reason } = req.body;

  if (!pin || !reason) {
    return res.status(400).json({ error: 'PIN and reason are required' });
  }

  try {
    // Step 1: Fetch student data from Google Sheets
    const sheetResponse = await axios.get(
      `https://sheets.googleapis.com/v4/spreadsheets/${process.env.SHEET_ID}/values/STUDENT_DB!A2:E?key=${process.env.GOOGLE_API_KEY}`
    );

    const rows = sheetResponse.data.values;
    const studentRow = rows.find(row => row[0] === pin);

    if (!studentRow) {
      return res.status(404).json({ error: 'Student not found for given PIN' });
    }

    const [_, name, parentName, phone, language] = studentRow;

    // Step 2: Make the Vapi call
    const vapiPayload = {
      assistantId: process.env.VAPI_ASSISTANT_ID,
      customer: {
        name: parentName,
        phoneNumber: `+91${phone}` // Direct phone number format
      },
      metadata: {
        studentName: name,
        reason: reason,
        pin: pin,
        language: language || 'en'
      }
    };

    const vapiResponse = await axios.post(
      'https://api.vapi.ai/call',
      vapiPayload,
      {
        headers: {
          Authorization: `Bearer ${process.env.VAPI_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return res.status(200).json({ success: true, vapiResponse: vapiResponse.data });

  } catch (error) {
    console.error('Vapi Call Error:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      details: error.response?.data || error.message
    });
  }
}

