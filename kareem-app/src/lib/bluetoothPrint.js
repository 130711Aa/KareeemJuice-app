import { formatRupiah } from './utils'

/**
 * Build JSON payload for Bluetooth Print app
 * Docs: https://play.google.com/store/apps/details?id=mate.bluetoothprint
 *
 * Type Reference:
 *   0 = text (content, bold, align, format)
 *   1 = image (path, align)
 *   2 = barcode (value, width, height, align)
 *   3 = QR code (value, size, align)
 *   4 = HTML (content)
 *
 * align: 0=left, 1=center, 2=right
 * format: 0=normal, 1=doubleH, 2=doubleH+W, 3=doubleW, 4=small
 * bold: 0=no, 1=yes
 */
export function buildCaptainOrderJSON(order) {
    const entries = []

    const fmtDate = (iso) => {
        const d = new Date(iso)
        return d.toLocaleString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        })
    }

    // ---- Header ----
    entries.push({ type: 0, content: 'NOTA PESANAN', bold: 1, align: 1, format: 2 })
    entries.push({ type: 0, content: 'Kareeem Juice', bold: 0, align: 1, format: 4 })
    entries.push({ type: 0, content: '--------------------------------', bold: 0, align: 1, format: 0 })

    // ---- Order Info ----
    entries.push({ type: 0, content: `No  : ${order.order_number || '-'}`, bold: 1, align: 0, format: 0 })
    entries.push({ type: 0, content: `Tgl : ${fmtDate(order.created_at)}`, bold: 0, align: 0, format: 0 })
    entries.push({ type: 0, content: `Nama: ${order.customer_name || '-'}`, bold: 0, align: 0, format: 0 })
    entries.push({ type: 0, content: `Bayar: ${order.payment_method === 'cashless' ? 'QRIS' : 'Cash'}`, bold: 0, align: 0, format: 0 })
    entries.push({ type: 0, content: '--------------------------------', bold: 0, align: 1, format: 0 })

    // ---- Items ----
    const items = order.items || []
    items.forEach((item, i) => {
        const subtotal = formatRupiah((item.price || 0) * (item.quantity || 1))
        entries.push({
            type: 0,
            content: `${i + 1}. ${item.name} x${item.quantity}`,
            bold: 0, align: 0, format: 0
        })
        entries.push({
            type: 0,
            content: `   ${subtotal}`,
            bold: 0, align: 2, format: 0
        })
    })

    entries.push({ type: 0, content: '--------------------------------', bold: 0, align: 1, format: 0 })

    // ---- Total ----
    entries.push({ type: 0, content: `TOTAL: ${formatRupiah(order.total_amount)}`, bold: 1, align: 2, format: 0 })

    // ---- Notes ----
    if (order.notes) {
        entries.push({ type: 0, content: '--------------------------------', bold: 0, align: 1, format: 0 })
        entries.push({ type: 0, content: `Catatan: ${order.notes}`, bold: 1, align: 0, format: 0 })
    }

    entries.push({ type: 0, content: '--------------------------------', bold: 0, align: 1, format: 0 })
    entries.push({ type: 0, content: 'Kareeem Juice', bold: 0, align: 1, format: 4 })

    // Feed some empty lines for easier paper tearing
    entries.push({ type: 0, content: ' ', bold: 0, align: 0, format: 0 })
    entries.push({ type: 0, content: ' ', bold: 0, align: 0, format: 0 })

    return entries
}

/**
 * Trigger Bluetooth Print app via URL scheme.
 * Encodes JSON payload as base64 in the URL so the Vite middleware
 * can decode and serve it as raw application/json.
 */
export function triggerBluetoothPrint(order) {
    const payload = buildCaptainOrderJSON(order)

    // Bluetooth Print expects JSON_FORCE_OBJECT format (object with numeric keys)
    const obj = {}
    payload.forEach((entry, i) => {
        obj[String(i)] = entry
    })

    const jsonStr = JSON.stringify(obj)
    const encoded = btoa(unescape(encodeURIComponent(jsonStr)))

    // Dynamic URL: Vite middleware in DEV, Netlify Function in PROD
    const endpoint = import.meta.env.DEV 
        ? '/api/print-data' 
        : '/.netlify/functions/print-data'

    const responseUrl = `${window.location.origin}${endpoint}?d=${encoded}`

    // Open the Bluetooth Print app via custom URL scheme
    window.location.href = `my.bluetoothprint.scheme://${responseUrl}`
}


