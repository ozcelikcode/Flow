/**
 * PDF Service using PDF.js
 * Extracts text from PDF files for receipt parsing
 */

import * as pdfjsLib from 'pdfjs-dist';
import { parseReceiptText, type ParsedReceiptData } from './receiptParser';

// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PDFProgress {
    status: string;
    progress: number;
    currentPage?: number;
    totalPages?: number;
}

export interface PDFResult {
    success: boolean;
    data?: ParsedReceiptData;
    error?: string;
}

/**
 * Extract text from PDF file
 */
export async function processPDFFile(
    file: File,
    onProgress?: (progress: PDFProgress) => void
): Promise<PDFResult> {
    try {
        // Validate file type
        if (file.type !== 'application/pdf') {
            return {
                success: false,
                error: 'Desteklenmeyen dosya formatı. PDF dosyası yükleyin.'
            };
        }

        onProgress?.({
            status: 'PDF yükleniyor...',
            progress: 10
        });

        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        onProgress?.({
            status: 'PDF işleniyor...',
            progress: 20
        });

        // Load PDF document
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;
        let fullText = '';

        onProgress?.({
            status: 'Metin çıkarılıyor...',
            progress: 30,
            totalPages
        });

        // Extract text from each page
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Combine text items
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');

            fullText += pageText + '\n';

            onProgress?.({
                status: `Sayfa ${pageNum}/${totalPages} işleniyor...`,
                progress: 30 + Math.round((pageNum / totalPages) * 60),
                currentPage: pageNum,
                totalPages
            });
        }

        onProgress?.({
            status: 'Veri ayrıştırılıyor...',
            progress: 95
        });

        // Parse the extracted text
        const parsedData = parseReceiptText(fullText);

        onProgress?.({
            status: 'Tamamlandı!',
            progress: 100
        });

        return {
            success: true,
            data: parsedData
        };

    } catch (error) {
        console.error('PDF Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'PDF işlemi başarısız oldu.'
        };
    }
}
