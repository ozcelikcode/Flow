/**
 * OCR Service using Tesseract.js
 * Provides image text extraction with Turkish language support
 * Includes advanced image preprocessing for better accuracy
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
 * Advanced image preprocessing for OCR
 * - Upscales small images
 * - Converts to high-contrast grayscale
 * - Applies adaptive thresholding
 * - Reduces noise
 */
async function preprocessImage(dataUrl: string): Promise<string> {
    const img = await loadImage(dataUrl);

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    let width = img.width;
    let height = img.height;

    // Step 1: Upscale small images for better OCR
    // OCR works best with images at least 300 DPI equivalent
    const minDimension = 1200; // Target minimum dimension
    if (width < minDimension && height < minDimension) {
        const scaleFactor = minDimension / Math.min(width, height);
        width = Math.round(width * scaleFactor);
        height = Math.round(height * scaleFactor);
    }

    // Limit max size for performance
    const maxSize = 3000;
    if (width > maxSize || height > maxSize) {
        const scale = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
    }

    canvas.width = width;
    canvas.height = height;

    // Enable image smoothing for upscaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw image (scaled)
    ctx.drawImage(img, 0, 0, width, height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Step 2: Convert to grayscale and collect statistics
    const grayscale = new Float32Array(width * height);
    let minGray = 255, maxGray = 0;
    let sumGray = 0;

    for (let i = 0; i < data.length; i += 4) {
        // Weighted grayscale (human perception)
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        grayscale[i / 4] = gray;
        if (gray < minGray) minGray = gray;
        if (gray > maxGray) maxGray = gray;
        sumGray += gray;
    }

    const avgGray = sumGray / grayscale.length;
    const range = maxGray - minGray;

    // Step 3: Calculate histogram for Otsu's threshold
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < grayscale.length; i++) {
        histogram[Math.round(grayscale[i])]++;
    }

    // Otsu's method for optimal threshold
    const totalPixels = width * height;
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];

    let sumB = 0, wB = 0, maxVariance = 0, threshold = 128;

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

    // Step 4: Apply aggressive contrast enhancement and thresholding
    // For low contrast images (range < 100), use more aggressive processing
    const isLowContrast = range < 100;
    const isDark = avgGray < 100;

    for (let i = 0; i < grayscale.length; i++) {
        let value = grayscale[i];

        // Normalize to 0-255 range with contrast stretch
        if (range > 0) {
            value = ((value - minGray) / range) * 255;
        }

        // Apply gamma correction for dark images
        if (isDark) {
            value = 255 * Math.pow(value / 255, 0.6); // Gamma < 1 brightens
        }

        // Enhance contrast further
        // Apply S-curve for better contrast
        const normalized = value / 255;
        const contrasted = normalized < 0.5
            ? 2 * normalized * normalized
            : 1 - 2 * (1 - normalized) * (1 - normalized);
        value = contrasted * 255;

        // For very low contrast, apply adaptive thresholding
        if (isLowContrast) {
            // Simple binary thresholding with adjusted threshold
            const adjustedThreshold = (threshold - minGray) / range * 255;
            value = value > adjustedThreshold ? 255 : 0;
        } else {
            // Sharpen: Increase contrast at edges
            if (value < threshold) {
                value = Math.max(0, value * 0.7);
            } else {
                value = Math.min(255, value * 1.3);
            }
        }

        // Clamp
        value = Math.max(0, Math.min(255, Math.round(value)));

        // Set RGB to same value (grayscale)
        const idx = i * 4;
        data[idx] = value;
        data[idx + 1] = value;
        data[idx + 2] = value;
    }

    // Step 5: Simple noise reduction (3x3 median-like filter for edges)
    // Skip this for now to preserve text edges

    // Put processed data back
    ctx.putImageData(imageData, 0, 0);

    // Return as PNG for lossless quality
    return canvas.toDataURL('image/png', 1.0);
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

        console.log('Image preprocessed, starting OCR...'); // Debug

        onProgress?.({ status: 'OCR başlatılıyor...', progress: 25 });

        // Perform OCR with Turkish language
        const result = await Tesseract.recognize(
            processedImage,
            'tur', // Turkish for proper character recognition
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
