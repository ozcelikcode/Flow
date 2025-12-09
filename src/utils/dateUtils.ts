export const parseDate = (dateStr: string): Date | null => {
    // 1. Try simpler ISO/standard date parsing
    const date = new Date(dateStr);
    if (!isNaN(date.getTime()) && dateStr.includes('-')) {
        return date;
    }

    // 2. Try parsing localized formats
    // Turkish Months
    const trMonths: Record<string, number> = {
        'Oca': 0, 'Şub': 1, 'Mar': 2, 'Nis': 3, 'May': 4, 'Haz': 5,
        'Tem': 6, 'Ağu': 7, 'Eyl': 8, 'Eki': 9, 'Kas': 10, 'Ara': 11,
        // Full names just in case
        'Ocak': 0, 'Şubat': 1, 'Mart': 2, 'Nisan': 3, 'Mayıs': 4, 'Haziran': 5,
        'Temmuz': 6, 'Ağustos': 7, 'Eylül': 8, 'Ekim': 9, 'Kasım': 10, 'Aralık': 11
    };

    // English Months
    const enMonths: Record<string, number> = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11,
        // Full names
        'January': 0, 'February': 1, 'March': 2, 'April': 3, 'June': 5,
        'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
    };

    // TR Format: "12 Ara 2025" or "12 Aralık 2025"
    const trMatch = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (trMatch) {
        const day = parseInt(trMatch[1]);
        const monthStr = trMatch[2]; // e.g. "Ara" or "Aralık"
        const year = parseInt(trMatch[3]);

        // Check TR months
        let month = trMonths[monthStr];
        // If not found, check if it's an English month name in this position (unlikely but possible)
        if (month === undefined) month = enMonths[monthStr];

        if (month !== undefined) {
            return new Date(year, month, day);
        }
    }

    // EN Format: "Dec 12, 2025" or "December 12, 2025"
    const enMatch = dateStr.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/);
    if (enMatch) {
        const monthStr = enMatch[1];
        const day = parseInt(enMatch[2]);
        const year = parseInt(enMatch[3]);

        let month = enMonths[monthStr];
        if (month === undefined) month = trMonths[monthStr];

        if (month !== undefined) {
            return new Date(year, month, day);
        }
    }

    // Fallback: Return the potentially invalid ISO parse if it wasn't filtered out earlier
    // or checks simple 'new Date' one last time
    const fallbackDate = new Date(dateStr);
    if (!isNaN(fallbackDate.getTime())) {
        return fallbackDate;
    }

    return null;
};

export const toLocalDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
