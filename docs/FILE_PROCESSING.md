# File Processing Guide

This guide explains how to upload, process, and download files through the Chat Interface.

## Overview

The Chat Assistant supports file processing in two modes:
- **Demo Mode**: Files processed locally using Grok AI (requires XAI_API_KEY)
- **Backend Connected**: Files processed by Django backend services

Files are not permanently stored - they exist only during the chat session.

## Supported File Formats

### Upload Formats
- **Spreadsheets**: XLSX, XLS, CSV
- **Documents**: TXT, PDF, DOCX
- **Data**: JSON

### Download Formats
- **Spreadsheets**: XLSX, CSV
- **Documents**: TXT, PDF, DOCX
- **Data**: JSON

## File Processing Workflow

### Step 1: Upload Files

1. Click the **📎 Paperclip icon** in the chat input area
2. Select one or more files from your computer
3. Files appear as chips/tags above the input field
4. To remove a file before sending, click the **X** on its tag

**Supported file sizes**: Up to 5MB per file (configurable)

### Step 2: Request Processing

Once files are uploaded, describe what you want to do:

#### Conversion Examples
```
"Convert this CSV to Excel"
"Convert the TXT file to JSON format"
"Export this data as XLSX"
```

#### Analysis Examples
```
"Analyze the invoice data in this file"
"Extract key metrics from this report"
"Summarize the data"
```

#### Cleaning Examples
```
"Remove duplicates from this data"
"Clean and format this spreadsheet"
"Validate and fix data quality issues"
```

### Step 3: Download Results

After the AI processes the files, a **Processed Data** card appears showing:
- **Format indicator**: CSV, XLSX, JSON, TXT, PDF, or DOCX
- **Filename**: Suggested name for the download
- **Preview**: First 15 lines of processed data
- **Download Button**: "Download [FORMAT] File"

Click the download button to save the processed file to your computer.

## Processing Actions

### Convert
Transform files between different formats.

**Frontend Processing** (Demo Mode):
- CSV ↔ JSON
- TXT → CSV
- CSV → XLSX (via CSV intermediate)
- JSON → CSV
- Any text format can be converted to TXT

**Backend Processing** (with Django backend):
- All conversions above
- PDF → CSV (requires text extraction)
- DOCX → JSON
- XLSX → JSON with schema inference

### Analyze
Extract insights, patterns, and structure from data.

**Capabilities**:
- Identify column types and data patterns
- Find duplicates and anomalies
- Calculate summary statistics
- Extract metadata
- Validate data consistency

### Clean
Remove errors, duplicates, and formatting issues.

**Operations**:
- Remove duplicate rows
- Fix date formatting
- Standardize column names
- Handle missing values
- Trim whitespace

### Validate
Check data quality and constraints.

**Validation**:
- Data type checking
- Required field validation
- Format validation (emails, phone numbers, dates)
- Relationship integrity
- Business rule compliance

## API Integration

### Chat API Endpoint

**POST /api/chat**

When processing is requested and files are present:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Convert this CSV to Excel"
      }
    ],
    "fileContext": "File: data.csv (1.2 KB, type: text/csv)\nContent:\n...",
    "requestProcessing": true
  }'
```

The API response includes streaming text, and if processing was successful, a `PROCESSED_DATA_JSON` block:

```
...response text...

PROCESSED_DATA_JSON:
{
  "format": "xlsx",
  "data": [
    {"name": "John", "amount": "1000"},
    {"name": "Jane", "amount": "2000"}
  ],
  "filename": "export.xlsx"
}
```

## Backend Implementation

If you're implementing the Django backend, implement these endpoints:

### POST /api/chat/process-file/
Process and convert uploaded files.

**Request** (multipart/form-data):
```
POST /api/chat/process-file/
Content-Type: multipart/form-data

file: <binary file>
action: convert|analyze|validate|clean
output_format: csv|json|xlsx|txt|pdf|docx
```

**Response** (200):
```json
{
  "status": "success",
  "processed_file": {
    "filename": "output.xlsx",
    "format": "xlsx",
    "size": 2048,
    "content": "base64 encoded content"
  },
  "summary": {
    "rows_processed": 100,
    "errors": 0,
    "warnings": []
  }
}
```

### POST /api/chat/convert-format/
Convert between file formats.

**Request** (multipart/form-data):
```
POST /api/chat/convert-format/
Content-Type: multipart/form-data

file: <binary file>
from_format: csv
to_format: xlsx
options: {"include_headers": true}
```

**Response** (200):
```json
{
  "filename": "converted.xlsx",
  "format": "xlsx",
  "content": "base64 encoded",
  "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}
```

## Examples

### Example 1: Convert Invoice CSV to Excel

1. Go to **Chat Assistant**
2. Click **📎** and select `invoices.csv`
3. Type: "Convert this CSV to Excel"
4. Wait for processing
5. Click **Download XLSX File**
6. Save to your computer

### Example 2: Analyze and Clean Data

1. Click **📎** and select `raw_data.txt`
2. Type: "Analyze this data, remove duplicates, and export as CSV"
3. Review the processed data preview
4. Click **Download CSV File**

### Example 3: Extract Data from PDF

*(Requires backend connection)*

1. Click **📎** and select `report.pdf`
2. Type: "Extract the table data from this PDF and convert to JSON"
3. Review extracted data
4. Click **Download JSON File**

## Limitations

### Demo Mode (Grok AI)
- File size: Max 15KB extracted content
- Formats: Text-based only (TXT, CSV, JSON)
- No PDF or DOCX parsing (treated as plain text)
- Processing depends on Grok AI capabilities
- No permanent storage

### Backend Mode
- Depends on Django backend implementation
- File size limits configurable on backend
- Support for all formats (if implemented)
- Can store files if backend supports it

## Tips & Best Practices

1. **File Size**: Keep files under 5MB for best performance
2. **Format Clarity**: Always specify target format ("convert to Excel", not just "convert")
3. **Preview First**: Review the data preview before downloading
4. **Batch Operations**: Process multiple files by uploading them together
5. **Data Privacy**: Remember files are processed in-memory and not stored permanently
6. **Error Handling**: If processing fails, check the error message and try again

## Troubleshooting

### "XAI_API_KEY is not configured"
- This appears in Demo Mode if the API key is not set
- Go to **Settings > Vars** and add your XAI_API_KEY
- Restart the application

### File not uploading
- Check file size (max 5MB)
- Verify file format is supported
- Ensure browser allows file uploads

### Processing fails silently
- Check browser console for errors (F12 > Console)
- Verify file content is not corrupted
- Try with a smaller file first
- Check backend connection status if using backend mode

### Download button not working
- Ensure popup blockers are disabled
- Try a different file format
- Clear browser cache and try again

## Architecture

Files flow through the system as follows:

```
[User Upload]
    ↓
[In-Memory Blob URL]
    ↓
[Read as Text Content]
    ↓
[Send to Grok API or Backend]
    ↓
[AI Processing]
    ↓
[Extract PROCESSED_DATA_JSON]
    ↓
[Create Download Blob]
    ↓
[Trigger Browser Download]
```

Files are never stored on disk in the frontend - only in-memory during the session.
