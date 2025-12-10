export function parseLocalizedDate(dateStr: string): Date | null {
    // Try direct parsing first using standard Date constructor
    let date = new Date(dateStr);
    if (!isNaN(date.getTime()) && dateStr.includes('-')) {
        return date;
    }

    // Handle Turkish format abbreviations
    const trMonths: Record<string, number> = {
        'Oca': 0, 'Şub': 1, 'Mar': 2, 'Nis': 3, 'May': 4, 'Haz': 5,
        'Tem': 6, 'Ağu': 7, 'Eyl': 8, 'Eki': 9, 'Kas': 10, 'Ara': 11
    };

    // Pattern: "8 Ara 2025" or "6 Ara 2025"
    const trMatch = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (trMatch) {
        const day = parseInt(trMatch[1]);
        const monthStr = trMatch[2];
        const year = parseInt(trMatch[3]);

        const month = trMonths[monthStr];
        if (month !== undefined) {
            return new Date(year, month, day);
        }
    }

    // English format: "Dec 8, 2025" or similar
    const enMonths: Record<string, number> = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };

    const enMatch = dateStr.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/);
    if (enMatch) {
        const monthStr = enMatch[1];
        const day = parseInt(enMatch[2]);
        const year = parseInt(enMatch[3]);

        const month = enMonths[monthStr];
        if (month !== undefined) {
            return new Date(year, month, day);
        }
    }

    return null;
}

export function formatDate(date: Date, locale: string = 'en-US'): string {
    return date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

export function toLocalDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
