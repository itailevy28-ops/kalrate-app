import Airtable from 'airtable';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { slug } = req.query;
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME;

  // דיבאג: נראה בדיוק מה ורסל שולפת מהכספת
  console.log("--- DEBUG VERCEL KEYS ---");
  console.log("SLUG RECEIVED:", slug);
  console.log("TOKEN EXISTS?:", !!token);
  console.log("BASE ID VALUE:", baseId ? `[${baseId}]` : "MISSING");
  console.log("TABLE NAME VALUE:", tableName ? `[${tableName}]` : "MISSING");

  if (!token || !baseId || !tableName) {
    return res.status(500).json({ error: "Missing configuration keys." });
  }

  try {
    const base = new Airtable({ apiKey: token.trim() }).base(baseId.trim());

    console.log("Attempting Airtable fetch...");
    
    const records = await base(tableName.trim()).select({
      filterByFormula: `{slug} = '${slug.trim()}'`,
      maxRecords: 1
    }).firstPage();

    console.log("Airtable responded successfully. Records found:", records ? records.length : 0);

    if (!records || records.length === 0) {
      return res.status(404).json({ error: "Business not found in Airtable." });
    }

    return res.status(200).json(records[0].fields);

  } catch (error) {
    // הדפסת השגיאה המלאה והגולמית מאיירטייבל לתוך הלוגים של ורסל
    console.error("--- CRITICAL AIRTABLE ERROR ---");
    console.error("Error Message:", error.message);
    console.error("Error Status Code:", error.statusCode);
    console.error("Full Error Object:", JSON.stringify(error));
    
    return res.status(500).json({ 
      error: "Internal server error connecting to database.",
      details: error.message 
    });
  }
}
