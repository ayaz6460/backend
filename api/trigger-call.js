import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send({ message: 'Only POST requests allowed' });
  }

  const { pin, reason } = req.body;

  try {
    // Fetch student data from Google Sheets
    const SHEET_ID = process.env.SHEET_ID;
    const API_KEY = process.env.GOOGLE_API_KEY;
    const sheetRes = await axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/STUDENT_DB!A2:E?key=${API_KEY}`);
    
    const rows = sheetRes.data.values;
    const student = rows.find(row => row[0] === pin);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const studentData = {
      name: student[1],
      parentName: student[2],
      phone: student[3],
      language: student[4]
    };

    // Call Vapi API
    const vapiRes = await axios.post(
      'https://api.vapi.ai/call',
      {
        assistantId: process.env.VAPI_ASSISTANT_ID,
        customer: {
          name: studentData.parentName,
          phoneNumber: {
            phoneNumber: `+91${studentData.phone}`
          }
        },
        metadata: {
          studentName: studentData.name,
          reason: reason
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.VAPI_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json({ success: true, data: vapiRes.data });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Call failed', details: err.message });
  }
}
