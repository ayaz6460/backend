import express from 'express';
import axios from 'axios';
import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

const SHEET_ID = process.env.SHEET_ID;
const VAPI_TOKEN = process.env.VAPI_TOKEN;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // optional if using OAuth2

// Fetch student info from Google Sheet
async function getStudentDetails(pin) {
  const sheets = google.sheets({ version: 'v4', auth: process.env.GOOGLE_SHEETS_API_KEY });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'STUDENT_DB!A2:E',
  });

  const rows = res.data.values;
  const student = rows.find(row => row[0] === pin);
  if (!student) return null;

  return {
    name: student[1],
    parentName: student[2],
    phone: student[3],
    language: student[4]
  };
}

// Vapi Call API
async function makeVapiCall(student, reason) {
  return await axios.post(
    'https://api.vapi.ai/call',
    {
      assistantId: 'your-vapi-assistant-id',
      customer: {
        name: student.parentName,
        phoneNumber: {
          twilioAccountSid: 'YOUR_TWILIO_SID',
          twilioPhoneNumber: '+91' + student.phone // E.164 format
        }
      },
      metadata: {
        studentName: student.name,
        reason: reason
      }
    },
    {
      headers: {
        Authorization: `Bearer ${VAPI_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
}

app.post('/api/trigger-call', async (req, res) => {
  const { pin, reason } = req.body;

  const student = await getStudentDetails(pin);
  if (!student) return res.status(404).send({ error: 'Student not found' });

  try {
    const response = await makeVapiCall(student, reason);
    res.send({ success: true, data: response.data });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).send({ error: 'Failed to make call' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
