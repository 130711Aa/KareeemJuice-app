import { supabase } from './supabase'

/**
 * Upload gambar produk ke Supabase Storage dan return public URL.
 * Jika gagal, fallback ke base64 (tetap bisa tampil tapi berat).
 *
 * @param {File} file - File gambar yang akan diupload
 * @param {string} [folder='products'] - Subfolder dalam bucket
 * @returns {Promise<string>} URL publik gambar
 */
export async function uploadProductImage(file, folder = 'products') {
    if (!file) throw new Error('No file provided')

    // Kompres gambar dulu sebelum upload
    const compressedFile = await compressImage(file, 800, 0.75)

    // Generate nama file unik
    const ext = file.name.split('.').pop().toLowerCase()
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, compressedFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: compressedFile.type,
        })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path)

    return publicUrl
}

/**
 * Kompres gambar menggunakan canvas sebelum upload.
 * Mengurangi ukuran file secara signifikan.
 *
 * @param {File} file - File gambar asli
 * @param {number} maxWidth - Lebar maksimum output (px)
 * @param {number} quality - Kualitas JPEG (0-1)
 * @returns {Promise<Blob>} Blob gambar yang sudah dikompres
 */
export function compressImage(file, maxWidth = 800, quality = 0.75) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file)

        img.onload = () => {
            URL.revokeObjectURL(url)

            const canvas = document.createElement('canvas')
            let { width, height } = img

            // Scale down jika lebih besar dari maxWidth
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width)
                width = maxWidth
            }

            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, width, height)

            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob)
                    else reject(new Error('Canvas toBlob failed'))
                },
                'image/jpeg',
                quality
            )
        }

        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error('Image load failed'))
        }

        img.src = url
    })
}

/**
 * Fallback: Konversi file ke base64 data URL (untuk kasus storage error)
 * @param {File} file
 * @returns {Promise<string>}
 */
export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}
