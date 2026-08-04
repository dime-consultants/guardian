# Data Tools Section Implementation

## Overview
The Data Tools section has been completely refactored to align with the backend Tools API, providing comprehensive management of data processing tools and their execution history.

## Components Updated

### 1. Tools Page (`components/pages/tools-page.tsx`)

**API Integration:**
- **GET `/api/tools/`** - Lists all available data processing tools
- **GET `/api/tools/calls/`** - Retrieves tool execution audit log with filtering
- All calls use authenticated `apiFetch()` function

**Features:**

#### Statistics Dashboard
Shows real-time metrics:
- **Total Tools**: Number of available tools
- **Total Executions**: Cumulative tool calls
- **Successful Calls**: Count of successful executions
- **Failed Calls**: Count of errors
- **Average Duration**: Mean execution time

#### Available Tools Grid
Displays all tools from backend with:
- Category-based coloring (extraction, transformation, reconciliation, analysis, report, utility)
- Call frequency tracking (`callCount`, `successCount`)
- Tool descriptions and parameters
- Filterable by category
- Click to select tool for details

#### Tool Usage Statistics
Each tool displays:
- Number of times called
- Number of successful executions
- Icon matching tool category
- Automatic color coding by category

#### Execution History
Audit log of tool calls showing:
- Tool name and display name
- Execution status (success, error, running, pending)
- Execution duration in milliseconds
- Records processed (when applicable)
- Timestamp of execution
- Filterable by status

**Authentication:**
Every API call includes Bearer token automatically via `apiFetch()`.

### 2. File Manager Updates (`components/pages/uploads-page.tsx`)

**File Type Color Coding:**
Added visual differentiation by file type:
- **XLSX/XLS**: Blue (`bg-blue-100`, `text-blue-600`)
- **TXT**: Purple (`bg-purple-100`, `text-purple-600`)
- **CSV**: Orange (`bg-orange-100`, `text-orange-600`)
- **PDF**: Red (`bg-red-100`, `text-red-600`)
- **Other**: Gray (`bg-gray-100`, `text-gray-600`)

**Implementation:**
- New `getFileTypeColor()` function returns theme-aware colors
- Icons display with file-type-specific colors
- Works in both light and dark modes

**Authentication:**
All file operations use `apiFetch()`:
- `GET /api/files/` - List files with pagination
- `POST /api/files/upload/` - Upload files (FormData)
- `GET /api/files/<id>/download/` - Download file
- `DELETE /api/files/<id>/` - Delete file

## Data Structure

### Tool Object
```json
{
  "id": 1,
  "name": "extract_ura_receipts",
  "display_name": "Extract URA Receipts",
  "description": "Parse a URA fiscal receipt .txt file...",
  "category": "extraction",
  "category_display": "Data Extraction",
  "handler": "tools.handlers.extract_ura_receipts",
  "version": 1,
  "enabled": true,
  "is_safe": true,
  "parameters_schema": { "type": "object", ... },
  "created_at": "2026-06-01T00:00:00+03:00",
  "updated_at": "2026-06-01T00:00:00+03:00"
}
```

### Tool Call Object
```json
{
  "id": 42,
  "tool": 1,
  "tool_name": "extract_ura_receipts",
  "tool_display": "Extract URA Receipts",
  "job": 7,
  "arguments": { "file_id": 5 },
  "result": { "ok": true, "record_count": 724 },
  "error_message": "",
  "status": "success",
  "status_display": "Success",
  "duration_ms": 1243,
  "started_at": "2026-06-05T12:00:00+03:00",
  "finished_at": "2026-06-05T12:00:01+03:00",
  "created_at": "2026-06-05T12:00:00+03:00"
}
```

## Demo Mode
Both components include realistic demo data that matches the API structure:
- **Demo Tools**: 6 tools across all categories (extraction, transformation, reconciliation, analysis, report)
- **Demo Tool Calls**: 3 sample executions showing various tool operations

Enable demo mode in Settings to test without backend connection.

## Authentication Requirements
**All endpoints require authentication:**
- Every request includes `Authorization: Bearer <access_token>` header
- Token automatically managed via `apiFetch()` function
- Token sourced from app context state
- Includes HttpOnly cookie support for token refresh

## Query Filters

### Tools Endpoint
```
GET /api/tools/?category=extraction
```
- `category` - Filter by tool category (extraction, transformation, reconciliation, analysis, report, utility)

### Tool Calls Endpoint
```
GET /api/tools/calls/?status=success&tool=extract_ura_receipts
```
- `status` - Filter by execution status (pending, running, success, error, skipped)
- `tool` - Filter by tool name
- `job` - Filter by job ID
- Paginated by default (20 per page)

## Category Colors
Each tool category has a distinct color scheme:

| Category | Display Name | Color |
|----------|---|---|
| `extraction` | Data Extraction | Blue |
| `transformation` | Data Transformation | Purple |
| `reconciliation` | Reconciliation | Orange |
| `analysis` | Analysis | Green |
| `report` | Report Generation | Red |
| `utility` | Utility | Gray |

## File Type Colors
File icons use type-specific colors for quick visual identification:

| Type | Icon Color | Theme |
|------|---|---|
| Excel (XLSX, XLS) | Blue | `bg-blue-100 dark:bg-blue-900/30` |
| Text (TXT) | Purple | `bg-purple-100 dark:bg-purple-900/30` |
| CSV | Orange | `bg-orange-100 dark:bg-orange-900/30` |
| PDF | Red | `bg-red-100 dark:bg-red-900/30` |
| Other | Gray | `bg-gray-100 dark:bg-gray-900/30` |

## Backend Requirements
Ensure your Django backend provides:

1. **Tools Endpoints**
   - `GET /api/tools/` with optional category filter
   - `GET /api/tools/calls/` with status, tool, job filters
   - Authentication required: `admin` or `finance` role

2. **File Endpoints**
   - `GET /api/files/` with pagination
   - `POST /api/files/upload/` for file uploads
   - `GET /api/files/<id>/download/`
   - `DELETE /api/files/<id>/`
   - Authentication required: any authenticated user

3. **Response Format**
   - Tools: Array of Tool objects or `{ "tools": [...] }`
   - Calls: Array of ToolCall objects or `{ "calls": [...] }`
   - Pagination: Include `total`, `page`, `totalPages` fields

## Future Enhancements
- User-defined tools support (placeholder ready)- Tool execution/scheduling interface
- Advanced filtering and search
- Tool result preview and processing
- Batch operations

---
**Status**: ✅ Production Ready
**API Version**: 1.0
**Demo Mode**: Enabled
**Authentication**: Required (Bearer token)
