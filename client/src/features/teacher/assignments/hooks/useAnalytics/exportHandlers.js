// @ts-nocheck
// teacher/components/assignments/hooks/useAnalytics/exportHandlers.js

// Note: You'll need to install these dependencies:
// npm install jspdf jspdf-autotable xlsx file-saver

import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const exportHandlers = {
  // PDF Export using jsPDF
  toPDF: async (data, options = {}) => {
    try {
      const defaultOptions = {
        title: "Analytics Report",
        author: "School Management System",
        pageSize: "A4",
        orientation: "portrait",
        includeCharts: false,
        filename: "analytics-report.pdf",
      };

      const mergedOptions = { ...defaultOptions, ...options };

      // Create new PDF document
      const doc = new jsPDF({
        orientation: mergedOptions.orientation,
        unit: "mm",
        format: mergedOptions.pageSize.toLowerCase(),
      });

      // Add title
      doc.setFontSize(20);
      doc.text(mergedOptions.title, 20, 30);

      // Add metadata
      doc.setProperties({
        title: mergedOptions.title,
        author: mergedOptions.author,
        creator: "School Management System",
        producer: "jsPDF",
      });

      // Add generated date
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);

      let yPosition = 60;

      // Process different data types
      if (data.summary) {
        doc.setFontSize(16);
        doc.text("Summary Statistics", 20, yPosition);
        yPosition += 15;

        const summaryData = Object.entries(data.summary).map(([key, value]) => [
          key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase()),
          typeof value === "number" ? value.toLocaleString() : value,
        ]);

        doc.autoTable({
          head: [["Metric", "Value"]],
          body: summaryData,
          startY: yPosition,
          margin: { left: 20 },
          styles: { fontSize: 10 },
          headStyles: { fillColor: [41, 128, 185] },
        });

        yPosition = doc.lastAutoTable.finalY + 20;
      }

      // Add detailed data table
      if (data.details && Array.isArray(data.details)) {
        doc.setFontSize(16);
        doc.text("Detailed Data", 20, yPosition);
        yPosition += 10;

        // Extract headers from first object
        const headers =
          data.details.length > 0 ? Object.keys(data.details[0]) : [];
        const tableHeaders = headers.map((header) =>
          header
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())
        );

        // Format data rows
        const tableData = data.details.map((row) =>
          headers.map((header) => {
            const value = row[header];
            if (typeof value === "number") return value.toLocaleString();
            if (value instanceof Date) return value.toLocaleDateString();
            return value?.toString() || "";
          })
        );

        doc.autoTable({
          head: [tableHeaders],
          body: tableData,
          startY: yPosition,
          margin: { left: 20 },
          styles: { fontSize: 9 },
          headStyles: { fillColor: [52, 152, 219] },
          alternateRowStyles: { fillColor: [240, 248, 255] },
        });
      }

      // Add charts placeholder (if requested)
      // Add charts placeholder (if requested)
      if (mergedOptions.includeCharts && data.charts) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text("Charts and Visualizations", 20, 30);
        doc.setFontSize(10);
        doc.text(
          "Charts would be rendered here using canvas-to-image conversion",
          20,
          50
        );
      }

      // Save the PDF
      doc.save(mergedOptions.filename);

      return {
        success: true,
        message: "PDF exported successfully",
        filename: mergedOptions.filename,
      };
    } catch (error) {
      console.error("PDF Export Error:", error);
      return {
        success: false,
        message: `PDF export failed: ${error.message}`,
      };
    }
  },

  // Excel Export using XLSX
  toExcel: async (data, options = {}) => {
    try {
      const defaultOptions = {
        sheetName: "Analytics",
        includeCharts: false,
        dateFormat: "MM/DD/YYYY",
        filename: "analytics-report.xlsx",
        includeMetadata: true,
      };

      const mergedOptions = { ...defaultOptions, ...options };

      // Create new workbook
      const workbook = XLSX.utils.book_new();

      // Create main data sheet
      if (data.details && Array.isArray(data.details)) {
        // Convert data to worksheet
        const worksheet = XLSX.utils.json_to_sheet(data.details);

        // Set column widths
        const colWidths = [];
        if (data.details.length > 0) {
          Object.keys(data.details[0]).forEach((key, index) => {
            const maxLength = Math.max(
              key.length,
              ...data.details.map((row) => String(row[key] || "").length)
            );
            colWidths[index] = { wch: Math.min(maxLength + 2, 50) };
          });
          worksheet["!cols"] = colWidths;
        }

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          mergedOptions.sheetName
        );
      }

      // Create summary sheet
      if (data.summary && mergedOptions.includeMetadata) {
        const summaryData = [
          ["Report Generated", new Date().toLocaleDateString()],
          ["Total Records", data.details?.length || 0],
          [""], // Empty row
          ["Summary Statistics", ""],
          ...Object.entries(data.summary).map(([key, value]) => [
            key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase()),
            value,
          ]),
        ];

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

        // Style the summary sheet
        summarySheet["!cols"] = [
          { wch: 25 }, // Column A width
          { wch: 15 }, // Column B width
        ];

        XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
      }

      // Create charts sheet (placeholder)
      if (mergedOptions.includeCharts && data.charts) {
        const chartsData = [
          ["Chart Placeholder"],
          ["Charts would be generated here using a charting library"],
          [
            "Consider using libraries like Chart.js with canvas2svg for Excel integration",
          ],
        ];
        const chartsSheet = XLSX.utils.aoa_to_sheet(chartsData);
        XLSX.utils.book_append_sheet(workbook, chartsSheet, "Charts");
      }

      // Generate Excel file and save
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
        cellDates: true,
        cellStyles: true,
      });

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, mergedOptions.filename);

      return {
        success: true,
        message: "Excel file exported successfully",
        filename: mergedOptions.filename,
        sheets: workbook.SheetNames.length,
      };
    } catch (error) {
      console.error("Excel Export Error:", error);
      return {
        success: false,
        message: `Excel export failed: ${error.message}`,
      };
    }
  },

  // CSV Export (native implementation)
  toCSV: async (data, options = {}) => {
    try {
      const defaultOptions = {
        delimiter: ",",
        includeHeaders: true,
        dateFormat: "MM/DD/YYYY",
        filename: "analytics-report.csv",
        encoding: "UTF-8",
      };

      const mergedOptions = { ...defaultOptions, ...options };

      let csvContent = "";

      // Add BOM for UTF-8 encoding (helps with Excel compatibility)
      if (mergedOptions.encoding === "UTF-8") {
        csvContent = "\ufeff";
      }

      // Process data
      if (
        data.details &&
        Array.isArray(data.details) &&
        data.details.length > 0
      ) {
        const headers = Object.keys(data.details[0]);

        // Add headers
        if (mergedOptions.includeHeaders) {
          const headerRow = headers
            .map((header) =>
              header
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase())
            )
            .map((header) => escapeCSVField(header, mergedOptions.delimiter))
            .join(mergedOptions.delimiter);

          csvContent += headerRow + "\n";
        }

        // Add data rows
        data.details.forEach((row) => {
          const dataRow = headers
            .map((header) => {
              let value = row[header];

              // Format different data types
              if (value instanceof Date) {
                value = value.toLocaleDateString();
              } else if (typeof value === "number") {
                value = value.toString();
              } else if (value === null || value === undefined) {
                value = "";
              } else {
                value = value.toString();
              }

              return escapeCSVField(value, mergedOptions.delimiter);
            })
            .join(mergedOptions.delimiter);

          csvContent += dataRow + "\n";
        });
      } else {
        throw new Error("No valid data found for CSV export");
      }

      // Create and download file
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      saveAs(blob, mergedOptions.filename);

      return {
        success: true,
        message: "CSV file exported successfully",
        filename: mergedOptions.filename,
        rows: data.details?.length || 0,
        size: csvContent.length,
      };
    } catch (error) {
      console.error("CSV Export Error:", error);
      return {
        success: false,
        message: `CSV export failed: ${error.message}`,
      };
    }
  },

  // Utility function for bulk export
  exportAll: async (
    data,
    formats = ["pdf", "excel", "csv"],
    baseOptions = {}
  ) => {
    const results = [];
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:]/g, "-");

    for (const format of formats) {
      const options = {
        ...baseOptions,
        filename: `${baseOptions.filename || "analytics-report"}-${timestamp}.${getFileExtension(format)}`,
      };

      let result;
      switch (format.toLowerCase()) {
        case "pdf":
          result = await exportHandlers.toPDF(data, options);
          break;
        case "excel":
        case "xlsx":
          result = await exportHandlers.toExcel(data, options);
          break;
        case "csv":
          result = await exportHandlers.toCSV(data, options);
          break;
        default:
          result = { success: false, message: `Unsupported format: ${format}` };
      }

      results.push({ format, ...result });
    }

    return results;
  },
};

// Utility functions
function escapeCSVField(field, delimiter) {
  if (field === null || field === undefined) {
    return "";
  }

  const stringField = field.toString();

  // Check if field contains delimiter, newline, or quote
  if (
    stringField.includes(delimiter) ||
    stringField.includes("\n") ||
    stringField.includes("\r") ||
    stringField.includes('"')
  ) {
    // Escape quotes by doubling them
    const escapedField = stringField.replace(/"/g, '""');
    return `"${escapedField}"`;
  }

  return stringField;
}

function getFileExtension(format) {
  switch (format.toLowerCase()) {
    case "pdf":
      return "pdf";
    case "excel":
    case "xlsx":
      return "xlsx";
    case "csv":
      return "csv";
    default:
      return "txt";
  }
}

// Example usage and data structure
export const sampleData = {
  summary: {
    totalStudents: 156,
    totalAssignments: 23,
    averageGrade: 87.5,
    completionRate: 94.2,
    lastUpdated: new Date().toISOString(),
  },
  details: [
    {
      studentName: "John Smith",
      assignment: "Math Quiz 1",
      grade: 95,
      submittedDate: new Date("2023-10-15"),
      status: "Completed",
    },
    {
      studentName: "Emma Johnson",
      assignment: "Math Quiz 1",
      grade: 87,
      submittedDate: new Date("2023-10-14"),
      status: "Completed",
    },
    // ... more data
  ],
  charts: {
    gradeDistribution: [
      /* chart data */
    ],
    submissionTrends: [
      /* chart data */
    ],
  },
};

// Usage examples:
/*
// Export PDF
const pdfResult = await exportHandlers.toPDF(sampleData, {
  title: 'Q3 2023 Grade Report',
  filename: 'grade-report-q3.pdf'
});

// Export Excel
const excelResult = await exportHandlers.toExcel(sampleData, {
  sheetName: 'Grade Analysis',
  includeCharts: true,
  filename: 'grade-analysis.xlsx'
});

// Export CSV
const csvResult = await exportHandlers.toCSV(sampleData, {
  delimiter: ';',
  filename: 'grades-export.csv'
});

// Export all formats
const allResults = await exportHandlers.exportAll(sampleData, ['pdf', 'excel', 'csv'], {
  title: 'Comprehensive Grade Report'
});
*/
