/**
 * Export utilities for CSV and Excel files
 * Provides functions to export data in long format
 */

/**
 * Convert data to CSV format and download
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 */
export const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    try {
        // Get headers from first object
        const headers = Object.keys(data[0]);

        // Create CSV content
        const csvContent = [
            headers.join(','), // Header row
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header];
                    // Escape commas and quotes in CSV
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        alert('Failed to export CSV file. Please try again.');
    }
};

/**
 * Convert data to Excel format and download
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 */
export const exportToExcel = async (data, filename) => {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    try {
        // Dynamically import xlsx library
        const XLSX = await import('xlsx');

        // Convert data to worksheet format
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Create workbook and add worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');

        // Auto-size columns
        const maxWidth = Object.keys(data[0]).reduce((max, key) => {
            const length = Math.max(
                key.length,
                ...data.map(row => String(row[key]).length)
            );
            return Math.max(max, length);
        }, 0);

        worksheet['!cols'] = [{ width: maxWidth + 2 }];

        // Generate and download file
        XLSX.writeFile(workbook, `${filename}.xlsx`);

    } catch (error) {
        console.error('Error exporting to Excel:', error);

        // Fallback to CSV if Excel export fails
        console.log('Falling back to CSV export...');
        exportToCSV(data, filename);
    }
};
