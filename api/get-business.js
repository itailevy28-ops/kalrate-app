export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const slug = req.query.slug;
    if (!slug) {
        return res.status(400).json({ error: 'Missing slug parameter' });
    }

    const token = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_NAME;

    if (!token || !baseId || !tableName) {
        return res.status(500).json({ error: 'Server configuration missing' });
    }

    const airtableUrl = `https://api.airtable.com/v1/${baseId}/${encodeURIComponent(tableName)}?filterByFormula={slug}='${slug}'`;

    try {
        const response = await fetch(airtableUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch from Airtable' });
        }

        const data = await response.json();

        if (!data.records || data.records.length === 0) {
            return res.status(404).json({ error: 'Business not found' });
        }

        const fields = data.records[0].fields;
        
        return res.status(200).json({
            name: fields.name || '',
            logo: fields.logo || '',
            google: fields.google || '',
            instagram: fields.instagram || '',
            facebook: fields.facebook || '',
            tiktok: fields.tiktok || '',
            whatsapp: fields.whatsapp || '',
            website: fields.website || ''
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
