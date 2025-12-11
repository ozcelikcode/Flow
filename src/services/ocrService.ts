/**
 * OCR Service using Tesseract.js
 * Provides image text extraction with Turkish language support
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

        // Read file as data URL (will be garbage collected after use)
        const dataUrl = await readFileAsDataURL(file);

        onProgress?.({ status: 'OCR başlatılıyor...', progress: 10 });

        // Perform OCR - use 'eng' first as it's more reliable, Turkish characters will still be recognized
        const result = await Tesseract.recognize(
            dataUrl,
            'eng', // English is more reliable for numbers and common patterns
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
                            progress: 10 + Math.round((m.progress || 0) * 85)
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
