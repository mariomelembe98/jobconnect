const currencyFormatter = new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN',
    minimumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('pt-MZ');

export function formatCurrency(value: string | number): string {
    return currencyFormatter.format(Number(value));
}

export function formatNumber(value: number): string {
    return numberFormatter.format(value);
}

export function formatDate(value: string | Date, options: Intl.DateTimeFormatOptions = {}): string {
    return new Intl.DateTimeFormat('pt-MZ', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Africa/Maputo',
        ...options,
    }).format(new Date(value));
}

export function formatDateTime(value: string | Date): string {
    return formatDate(value, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatFileSize(bytes: number | null): string {
    if (!bytes) return '—';

    const units = ['B', 'KB', 'MB', 'GB'];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / 1024 ** exponent;

    return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function initials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}
