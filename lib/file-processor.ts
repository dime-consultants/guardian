/**
 * File Processing Utilities
 * Handles conversion and generation of files for download
 */

export interface ProcessedFileData {
  filename: string;
  mimeType: string;
  content: string | ArrayBuffer;
}

/**
 * Convert text data to CSV format
 */
export const convertToCSV = (data: any[], filename: string = "export.csv"): ProcessedFileData => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Data must be a non-empty array");
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) => headers.map((header) => JSON.stringify(row[header] ?? "")).join(",")),
  ].join("\n");

  return {
    filename: filename.endsWith(".csv") ? filename : `${filename}.csv`,
    mimeType: "text/csv",
    content: csvContent,
  };
};

/**
 * Convert text data to XLSX format (simple version)
 * For production, consider using xlsx library
 */
export const convertToXLSX = (data: any[], filename: string = "export.xlsx"): ProcessedFileData => {
  // This creates a CSV wrapped as XLSX compatible format
  // For full XLSX support, install 'xlsx' package
  const csv = convertToCSV(data, filename);
  return {
    filename: filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    content: csv.content,
  };
};

/**
 * Convert data to JSON format
 */
export const convertToJSON = (data: any, filename: string = "export.json"): ProcessedFileData => {
  const jsonContent = JSON.stringify(data, null, 2);
  return {
    filename: filename.endsWith(".json") ? filename : `${filename}.json`,
    mimeType: "application/json",
    content: jsonContent,
  };
};

/**
 * Convert data to TXT format
 */
export const convertToTXT = (data: string | any, filename: string = "export.txt"): ProcessedFileData => {
  let content = typeof data === "string" ? data : JSON.stringify(data, null, 2);

  return {
    filename: filename.endsWith(".txt") ? filename : `${filename}.txt`,
    mimeType: "text/plain",
    content,
  };
};

/**
 * Generate a basic PDF (requires external library for full PDF support)
 * This creates a text-based format that can be opened as text
 */
export const generatePDF = (content: string, filename: string = "export.pdf"): ProcessedFileData => {
  // For full PDF support, consider using 'pdfkit' or 'jspdf'
  // This is a placeholder that creates a downloadable text file
  return {
    filename: filename.endsWith(".pdf") ? filename : `${filename}.pdf`,
    mimeType: "application/pdf",
    content,
  };
};

/**
 * Generate DOCX file (requires external library)
 * This creates a simple text-based format
 */
export const generateDOCX = (content: string, filename: string = "export.docx"): ProcessedFileData => {
  // For full DOCX support, consider using 'docx' package
  return {
    filename: filename.endsWith(".docx") ? filename : `${filename}.docx`,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    content,
  };
};

/**
 * Parse CSV content to array of objects
 */
export const parseCSV = (content: string): any[] => {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const data: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    data.push(row);
  }

  return data;
};

/**
 * Format data for display in chat
 */
export const formatDataForDisplay = (data: any, maxLines: number = 10): string => {
  if (typeof data === "string") {
    return data.split("\n").slice(0, maxLines).join("\n");
  }

  if (Array.isArray(data)) {
    return data
      .slice(0, maxLines)
      .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
      .join("\n");
  }

  return JSON.stringify(data, null, 2).split("\n").slice(0, maxLines).join("\n");
};

/**
 * Trigger file download in browser
 */
export const triggerDownload = (filename: string, content: string | ArrayBuffer, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Parse file based on type and return structured data
 */
export const parseFile = async (file: File): Promise<any> => {
  const content = await file.text();

  if (file.type.includes("csv") || file.name.endsWith(".csv")) {
    return parseCSV(content);
  }

  if (file.type.includes("json") || file.name.endsWith(".json")) {
    return JSON.parse(content);
  }

  // For other text files, return as-is
  return content;
};
