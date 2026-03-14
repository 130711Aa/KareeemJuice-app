/**
 * Netlify Function: serve raw JSON for Bluetooth Print app in production.
 * This replaces the Vite middleware used in development.
 *
 * URL: /.netlify/functions/print-data?d=<base64_json>
 */
exports.handler = async (event, context) => {
    try {
        const encoded = event.queryStringParameters.d

        if (!encoded) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing data' }),
                headers: { 'Content-Type': 'application/json' }
            }
        }

        // Decode base64 → raw JSON string
        // We use Buffer because this is a Node.js environment
        const jsonStr = Buffer.from(encoded, 'base64').toString('utf-8')

        // Validate it's actually valid JSON
        JSON.parse(jsonStr)

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Allow app to fetch
            },
            body: jsonStr
        }
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
            headers: { 'Content-Type': 'application/json' }
        }
    }
}
