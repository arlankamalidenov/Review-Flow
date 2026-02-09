/**
 * Format date to readable Russian format
 * Example: "12 Октября, 2025"
 */
export const formatDate = (dateString: string, locale: 'ru' | 'en' = 'ru'): string => {
    if (!dateString) return '—';
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return '—';

    if (locale === 'ru') {
        const months = [
            'Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня',
            'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'
        ];

        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();

        return `${day} ${month}, ${year}`;
    }

    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
};

/**
 * Format date to short format with time
 * Example: "12 Oct, 14:30"
 */
export const formatDateShort = (dateString: string): string => {
    if (!dateString) return '—';
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Strip HTML tags from string safely
 */
export const stripHtml = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
};

/**
 * Get country flag emoji from ISO code
 * Example: "US" -> "🇺🇸", "RU" -> "🇷🇺"
 */
export const getCountryFlag = (countryCode: string): string => {
    if (!countryCode || countryCode.length !== 2) return '🌍';

    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));

    return String.fromCodePoint(...codePoints);
};

/**
 * Get country name from ISO code
 */
export const getCountryName = (countryCode: string): string => {
    const countries: Record<string, string> = {
        'US': 'United States',
        'RU': 'Russia',
        'GB': 'United Kingdom',
        'DE': 'Germany',
        'FR': 'France',
        'ES': 'Spain',
        'IT': 'Italy',
        'CN': 'China',
        'JP': 'Japan',
        'KR': 'South Korea',
        'IN': 'India',
        'BR': 'Brazil',
        'CA': 'Canada',
        'AU': 'Australia',
        'MX': 'Mexico',
        'NL': 'Netherlands',
        'SE': 'Sweden',
        'NO': 'Norway',
        'PL': 'Poland',
        'TR': 'Turkey',
    };

    return countries[countryCode.toUpperCase()] || countryCode.toUpperCase();
};
