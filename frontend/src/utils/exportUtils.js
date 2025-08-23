/**
 * Export utilities for CSV and Excel
 */

/**
 * Export data to CSV
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Filename for the download
 */
export const exportToCSV = (data, filename = 'export.csv') => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
};

/**
 * Export data to Excel
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Filename for the download
 */
export const exportToExcel = async (data, filename = 'export.xlsx') => {
    if (!data || data.length === 0) return;

    try {
        const XLSX = await import('xlsx');
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, filename);
    } catch (error) {
        console.error('Excel export failed:', error);
        // Fallback to CSV if Excel export fails
        exportToCSV(data, filename.replace('.xlsx', '.csv'));
    }
};
