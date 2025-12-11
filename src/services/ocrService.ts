/**
 * OCR Service using Tesseract.js
 * Provides image text extraction with Turkish language support
 * Includes image preprocessing for better accuracy
 */

import Tesseract from 'tesseract.js';
import { parseReceiptText, type ParsedReceiptData } from './receiptParser';

export interface OCRProgress {
    status: string;
    progress: number; // 0-100
}

export interface OCRResult {
    success: boolean;
    data?: ParsedReceiptData;
    error?: string;
    rawText?: string; // For debugging
}

/**
 * Read file as base64 data URL
 */
function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Dosya okunamadı'));
        reader.readAsDataURL(file);
    });
}

/**
 * Load image from data URL
 */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Görüntü yüklenemedi'));
        img.src = dataUrl;
    });
}

/**
 * Preprocess image for better OCR accuracy
 * - Converts to grayscale
 * - Enhances contrast
 * - Applies adaptive thresholding for low-light images
 */
async function preprocessImage(dataUrl: string): Promise<string> {
    const img = await loadImage(dataUrl);

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    // Set canvas size to image size (max 2000px for performance)
    const maxSize = 2000;
    let width = img.width;
    let height = img.height;

    if (width > maxSize || height > maxSize) {
        const scale = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
    }

    canvas.width = width;
    canvas.height = height;

    // Draw image
    ctx.drawImage(img, 0, 0, width, height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Step 1: Convert to grayscale and calculate histogram
    const grayscale = new Uint8Array(width * height);
    const histogram = new Array(256).fill(0);

    for (let i = 0; i < data.length; i += 4) {
        // Weighted grayscale (human perception)
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        grayscale[i / 4] = gray;
        histogram[gray]++;
    }

    // Step 2: Calculate optimal threshold using Otsu's method
    const totalPixels = width * height;
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];

    let sumB = 0;
    let wB = 0;
    let maxVariance = 0;
    let threshold = 128;

    for (let t = 0; t < 256; t++) {
        wB += histogram[t];
        if (wB === 0) continue;

        const wF = totalPixels - wB;
        if (wF === 0) break;

        sumB += t * histogram[t];

        const mB = sumB / wB;
        const mF = (sum - sumB) / wF;

        const variance = wB * wF * (mB - mF) * (mB - mF);

        if (variance > maxVariance) {
            maxVariance = variance;
            threshold = t;
        }
    }

    // Step 3: Enhance contrast using histogram stretching
    let minGray = 255, maxGray = 0;
    for (let i = 0; i < grayscale.length; i++) {
        if (grayscale[i] < minGray) minGray = grayscale[i];
        if (grayscale[i] > maxGray) maxGray = grayscale[i];
    }

    const range = maxGray - minGray;
    const contrastFactor = range > 0 ? 255 / range : 1;

    // Step 4: Apply processing to image data
    for (let i = 0; i < grayscale.length; i++) {
        // Contrast enhancement
        let value = Math.round((grayscale[i] - minGray) * contrastFactor);

        // Clamp value
        value = Math.max(0, Math.min(255, value));

        // Apply mild sharpening by increasing contrast
        if (value < threshold) {
            value = Math.max(0, value - 20); // Darken dark pixels
        } else {
            value = Math.min(255, value + 20); // Lighten light pixels
        }

        // Set RGB to same value (grayscale)
        const idx = i * 4;
        data[idx] = value;     // R
        data[idx + 1] = value; // G
        data[idx + 2] = value; // B
        // Alpha stays the same
    }

    // Put processed data back
    ctx.putImageData(imageData, 0, 0);

    // Return as data URL
    return canvas.toDataURL('image/png');
}

/**
 * Process image file and extract receipt data
 */
export async function processReceiptImage(
    file: File,
    onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> {
    try {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp'];
        if (!validTypes.includes(file.type.toLowerCase())) {
            return {
                success: false,
                error: 'Desteklenmeyen dosya formatı. JPEG, PNG veya BMP kullanın.'
            };
        }

        onProgress?.({ status: 'Dosya okunuyor...', progress: 5 });

        // Read file as data URL
        const dataUrl = await readFileAsDataURL(file);

        onProgress?.({ status: 'Görüntü iyileştiriliyor...', progress: 15 });

        // Preprocess image for better OCR
        const processedImage = await preprocessImage(dataUrl);

        onProgress?.({ status: 'OCR başlatılıyor...', progress: 25 });

        // Perform OCR with Turkish language for better character recognition
        const result = await Tesseract.recognize(
            processedImage,
            'tur', // Turkish for proper Ö, İ, Ş, Ü, Ç, Ğ recognition
            {
                logger: (m) => {
                    if (onProgress && m.status) {
                        const statusMap: Record<string, string> = {
                            'loading tesseract core': 'OCR motoru yükleniyor...',
                            'initializing tesseract': 'Başlatılıyor...',
                            'loading language traineddata': 'Dil paketi yükleniyor...',
                            'initializing api': 'API hazırlanıyor...',
                            'recognizing text': 'Metin tanınıyor...',
                        };

                        onProgress({
                            status: statusMap[m.status] || m.status,
                            progress: 25 + Math.round((m.progress || 0) * 70)
                        });
                    }
                }
            }
        );

        const extractedText = result.data.text;
        console.log('OCR Raw Text:', extractedText); // Debug log

        // Parse the extracted text
        const parsedData = parseReceiptText(extractedText);

        onProgress?.({ status: 'Tamamlandı!', progress: 100 });

        return {
            success: true,
            data: parsedData,
            rawText: extractedText
        };

    } catch (error) {
        console.error('OCR Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'OCR işlemi başarısız oldu.'
        };
    }
}
