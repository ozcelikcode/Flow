/**
 * Receipt Parser Service
 * Parses Turkish receipts to extract amount and date information
 */

export interface ParsedReceiptData {
    amount: number | null;
    date: string | null; // ISO format YYYY-MM-DD
    time: string | null; // HH:MM format
    companyName: string | null; // Store/company name
    rawText: string;
    confidence: {
        amount: number; // 0-100
        date: number;   // 0-100
        time: number;   // 0-100
        companyName: number; // 0-100
        overall: number; // 0-100
    };
}

// Turkish amount patterns (TOPLAM, GENEL TOPLAM, TUTAR, etc.)
const AMOUNT_PATTERNS = [
    /GENEL\s*TOPLAM\s*[:.]?\s*([\d.,]+)\s*(TL|₺|TRY)?/gi,
    /TOPLAM\s*[:.]?\s*([\d.,]+)\s*(TL|₺|TRY)?/gi,
    /TOTAL\s*[:.]?\s*([\d.,]+)/gi, // English TOTAL
    /TUTAR\s*[:.]?\s*([\d.,]+)\s*(TL|₺|TRY)?/gi,
    /AMOUNT\s*[:.]?\s*([\d.,]+)/gi, // English AMOUNT
    /NAK[İI]T\s*[:.]?\s*([\d.,]+)/gi, // NAKİT with variations
    /CASH\s*[:.]?\s*([\d.,]+)/gi, // English CASH
    /ÖDENECEK\s*[:.]?\s*([\d.,]+)/gi,
    /ÖDENEN\s*[:.]?\s*([\d.,]+)/gi,
    /\*{2,}\s*([\d.,]+)\s*(TL|₺|TRY)?/gi, // **123,45 TL pattern
    /([\d]+[.,]\d{2})\s*(TL|₺|TRY)/gi, // Amount with TL suffix
    /TL\s*([\d]+[.,]\d{2})/gi, // TL prefix
    /₺\s*([\d]+[.,]\d{2})/gi, // ₺ prefix
];

// Turkish date patterns
const DATE_PATTERNS = [
    /(\d{2})[./-](\d{2})[./-](\d{4})/g, // DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
    /(\d{2})[./-](\d{2})[./-](\d{2})\b/g, // DD.MM.YY
    /(\d{4})[./-](\d{2})[./-](\d{2})/g, // YYYY-MM-DD (ISO format)
];

/**
 * Parse Turkish currency amount string to number
 */
function parseAmount(amountStr: string): number | null {
    if (!amountStr) return null;

    // Remove spaces
    let cleaned = amountStr.trim();

    // Turkish format: 1.234,56 -> 1234.56
    // First remove thousand separators (dots)
    // Then replace comma with dot for decimal

    // Check if it's Turkish format (has both . and ,)
    if (cleaned.includes('.') && cleaned.includes(',')) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
        // Only comma - it's decimal separator
        cleaned = cleaned.replace(',', '.');
    }
    // If only dots, assume last one is decimal if 2 digits after
    else if (cleaned.includes('.')) {
        const parts = cleaned.split('.');
        if (parts.length > 1 && parts[parts.length - 1].length === 2) {
            // Last part is decimal
            cleaned = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
        }
    }

    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}

/**
 * Parse date string to ISO format
 */
function parseDate(day: string, month: string, year: string): string | null {
    let fullYear = year;

    // Handle 2-digit year
    if (year.length === 2) {
        const yearNum = parseInt(year);
        fullYear = yearNum > 50 ? `19${year}` : `20${year}`;
    }

    const d = parseInt(day);
    const m = parseInt(month);
    const y = parseInt(fullYear);

    // Validate
    if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > 2100) {
        return null;
    }

    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Extract amount from text
 */
function extractAmount(text: string): { amount: number | null; confidence: number } {
    const amounts: { value: number; priority: number }[] = [];

    for (let i = 0; i < AMOUNT_PATTERNS.length; i++) {
        const pattern = AMOUNT_PATTERNS[i];
        pattern.lastIndex = 0; // Reset regex

        let match;
        while ((match = pattern.exec(text)) !== null) {
            const amount = parseAmount(match[1]);
            if (amount !== null && amount > 0) {
                // Higher priority for earlier patterns (GENEL TOPLAM > TOPLAM > TUTAR)
                amounts.push({ value: amount, priority: AMOUNT_PATTERNS.length - i });
            }
        }
    }

    if (amounts.length === 0) {
        return { amount: null, confidence: 0 };
    }

    // Sort by priority, then by value (highest value usually is total)
    amounts.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return b.value - a.value;
    });

    // Confidence based on pattern priority and if amount seems reasonable
    const bestMatch = amounts[0];
    let confidence = 50 + (bestMatch.priority * 5);

    // If multiple amounts found with same value, higher confidence
    const sameValueCount = amounts.filter(a => a.value === bestMatch.value).length;
    if (sameValueCount > 1) {
        confidence += 15;
    }

    return {
        amount: bestMatch.value,
        confidence: Math.min(95, confidence)
    };
}

/**
 * Extract date from text
 */
function extractDate(text: string): { date: string | null; confidence: number } {
    const dates: { value: string; isFullYear: boolean }[] = [];

    for (const pattern of DATE_PATTERNS) {
        pattern.lastIndex = 0;

        let match;
        while ((match = pattern.exec(text)) !== null) {
            let day: string, month: string, year: string;

            // Check if YYYY-MM-DD format
            if (match[1].length === 4) {
                year = match[1];
                month = match[2];
                day = match[3];
            } else {
                day = match[1];
                month = match[2];
                year = match[3];
            }

            const parsed = parseDate(day, month, year);
            if (parsed) {
                dates.push({
                    value: parsed,
                    isFullYear: year.length === 4
                });
            }
        }
    }

    if (dates.length === 0) {
        return { date: null, confidence: 0 };
    }

    // Prefer dates with full year, then most recent date
    dates.sort((a, b) => {
        if (a.isFullYear !== b.isFullYear) return a.isFullYear ? -1 : 1;
        return b.value.localeCompare(a.value); // Most recent first
    });

    const bestMatch = dates[0];
    let confidence = bestMatch.isFullYear ? 85 : 65;

    // Check if date is reasonable (not too far in past or future)
    const dateObj = new Date(bestMatch.value);
    const now = new Date();
    const diffDays = Math.abs((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
        confidence += 10;
    } else if (diffDays > 365) {
        confidence -= 20;
    }

    return {
        date: bestMatch.value,
        confidence: Math.max(0, Math.min(95, confidence))
    };
}

/**
 * Extract company/store name from receipt text
 * Usually the first meaningful line of the receipt
 */
function extractCompanyName(text: string): { companyName: string | null; confidence: number } {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    if (lines.length === 0) {
        return { companyName: null, confidence: 0 };
    }

    // Skip patterns that are NOT company names
    const skipPatterns = [
        /^(TARIH|DATE|SAAT|TIME|SATIS|KASA|KASIYER|FATURA|RECEIPT|TOPLAM|GENEL|TUTAR)/i,
        /^\d+[./-]\d+[./-]\d+/, // Date patterns
        /^[\d\s.,]+$/, // Only numbers
        /^[*=-]+$/, // Separator lines
        /^\*+/, // Lines starting with asterisks
        /^(TL|₺|TRY)/i, // Currency only
    ];

    // Look for the first valid company name (usually in first 5 lines)
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const line = lines[i];

        // Skip if too short or too long
        if (line.length < 3 || line.length > 50) continue;

        // Skip if matches skip patterns
        let shouldSkip = false;
        for (const pattern of skipPatterns) {
            if (pattern.test(line)) {
                shouldSkip = true;
                break;
            }
        }
        if (shouldSkip) continue;

        // Skip if mostly numbers
        const numCount = (line.match(/\d/g) || []).length;
        if (numCount > line.length * 0.5) continue;

        // This looks like a company name
        // Clean up the name (remove extra spaces, special chars at start/end)
        const cleanedName = line
            .replace(/^[*\-=\s]+/, '')
            .replace(/[*\-=\s]+$/, '')
            .trim();

        if (cleanedName.length >= 3) {
            // Higher confidence for earlier lines
            const confidence = 85 - (i * 10);
            return {
                companyName: cleanedName,
                confidence: Math.max(50, confidence)
            };
        }
    }

    return { companyName: null, confidence: 0 };
}

// Turkish time patterns
const TIME_PATTERNS = [
    /SAAT\s*[:.]?\s*(\d{1,2})[:.:](\d{2})(?:[:.:](\d{2}))?/gi, // SAAT: 14:30 or SAAT: 14:30:45
    /TIME\s*[:.]?\s*(\d{1,2})[:.:](\d{2})(?:[:.:](\d{2}))?/gi, // TIME: 14:30
    /(\d{1,2}):(\d{2}):(\d{2})/g, // HH:MM:SS format
    /\b(\d{1,2}):(\d{2})\b(?![\d])/g, // HH:MM format (not followed by more digits to avoid matching amounts)
];

/**
 * Extract time from text
 */
function extractTime(text: string): { time: string | null; confidence: number } {
    const times: { value: string; priority: number }[] = [];

    for (let i = 0; i < TIME_PATTERNS.length; i++) {
        const pattern = TIME_PATTERNS[i];
        pattern.lastIndex = 0; // Reset regex

        let match;
        while ((match = pattern.exec(text)) !== null) {
            const hour = parseInt(match[1]);
            const minute = parseInt(match[2]);

            // Validate time
            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                // Higher priority for earlier patterns (SAAT > TIME > HH:MM:SS > HH:MM)
                times.push({ value: formattedTime, priority: TIME_PATTERNS.length - i });
            }
        }
    }

    if (times.length === 0) {
        return { time: null, confidence: 0 };
    }

    // Sort by priority
    times.sort((a, b) => b.priority - a.priority);

    const bestMatch = times[0];
    let confidence = 50 + (bestMatch.priority * 10);

    // If found with SAAT keyword, higher confidence
    if (bestMatch.priority >= TIME_PATTERNS.length - 1) {
        confidence += 15;
    }

    return {
        time: bestMatch.value,
        confidence: Math.min(95, confidence)
    };
}

/**
 * Parse receipt text and extract relevant data
 */
export function parseReceiptText(text: string): ParsedReceiptData {
    const amountResult = extractAmount(text);
    const dateResult = extractDate(text);
    const timeResult = extractTime(text);
    const companyResult = extractCompanyName(text);

    // Calculate overall confidence
    let overall = 0;
    let count = 0;

    if (amountResult.amount !== null) {
        overall += amountResult.confidence;
        count++;
    }
    if (dateResult.date !== null) {
        overall += dateResult.confidence;
        count++;
    }
    if (timeResult.time !== null) {
        overall += timeResult.confidence;
        count++;
    }
    if (companyResult.companyName !== null) {
        overall += companyResult.confidence;
        count++;
    }

    return {
        amount: amountResult.amount,
        date: dateResult.date,
        time: timeResult.time,
        companyName: companyResult.companyName,
        rawText: text,
        confidence: {
            amount: amountResult.confidence,
            date: dateResult.confidence,
            time: timeResult.confidence,
            companyName: companyResult.confidence,
            overall: count > 0 ? Math.round(overall / count) : 0
        }
    };
}

