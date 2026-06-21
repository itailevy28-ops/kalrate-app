export default async function handler(req, res) {
  // הגדרת Headers ל-CORS
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

  // הדפסות דיבאג פנימיות
  console.log("--- DEBUG VERCEL KEYS ---");
  console.log("SLUG:", slug);
  console.log("BASE ID:", baseId ? `[${baseId.trim()}]` : "MISSING");
  console.log("TABLE NAME/ID:", tableName ? `[${tableName.trim()}]` : "MISSING");

  if (!token || !baseId || !tableName) {
    return res.status(500).json({ error: "Missing configuration keys in Vercel." });
  }

  if (!slug) {
    return res.status(400).json({ error: "Slug parameter (?u=) is missing." });
  }

  // בניית הכתובת בצורה ידנית ומאובטחת עם פילטר נקי מרווחים
  const cleanBaseId = baseId.trim();
  const cleanTableName = tableName.trim();
  const cleanSlug = slug.trim();
  
  const url = `https://api.airtable.com/v1/${cleanBaseId}/${cleanTableName}?filterByFormula=%7Bslug%7D%3D%27${encodeURIComponent(cleanSlug)}%27&maxRecords=1`;

  try {
    console.log("Fetching from Airtable URL:", url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("Airtable response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Airtable Raw Error:", errorText);
      return res.status(response.status).json({ error: "Error from Airtable API.", details: errorText });
    }

    const data = await response.json();
    
    if (!data.records || data.records.length === 0) {
      console.log("No records found for slug:", cleanSlug);
      return res.status(404).json({ error: "Business not found in Airtable." });
    }

    // החזרת השדות של העסק שנמצא
    return res.status(200).json(data.records[0].fields);

  } catch (error) {
    console.error("Server Crash Error:", error);
    return res.status(500).json({ error: "Internal server error.", details: error.message });
  }
}
