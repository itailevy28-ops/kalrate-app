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
  let token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME;

  if (!token || !baseId || !tableName) {
    return res.status(500).json({ error: "Missing configuration keys in Vercel." });
  }

  if (!slug) {
    return res.status(400).json({ error: "Slug parameter (?u=) is missing." });
  }

  let cleanToken = token.trim();
  if (cleanToken.startsWith('Bearer ')) {
    cleanToken = cleanToken.replace('Bearer ', '').trim();
  }

  const cleanBaseId = baseId.trim();
  const cleanTableName = tableName.trim();
  const cleanSlug = slug.trim();

  const filterFormula = `{slug}='${cleanSlug}'`;
  const url = `https://api.airtable.com/v0/${encodeURIComponent(cleanBaseId)}/${encodeURIComponent(cleanTableName)}?filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=1`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
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
      return res.status(404).json({ error: "Business not found in Airtable." });
    }

    return res.status(200).json(data.records[0].fields);

  } catch (error) {
    console.error("Server Crash Error:", error);
    return res.status(500).json({ error: "Internal server error.", details: error.message });
  }
}