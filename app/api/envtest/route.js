export async function GET() {
  return Response.json({
    AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_ID: process.env.AIRTABLE_TABLE_ID,
    AIRTABLE_DOCTORS_TABLE: process.env.AIRTABLE_DOCTORS_TABLE,
  });
}