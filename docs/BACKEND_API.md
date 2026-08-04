# Backend API Contract

This document defines the API endpoints that the Django backend must implement to integrate with the K+N Finance Automation Frontend.

## Base Configuration

- **Base URL**: Configured via `NEXT_PUBLIC_BACKEND_URL` or Settings page
- **Authentication**: Bearer token in `Authorization` header
- **Content-Type**: `application/json` (except file uploads)

---

## Authentication Endpoints

### POST /api/auth/login
Login and obtain authentication token.

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "admin" | "user" | "viewer"
  }
}
```

### POST /api/auth/logout
Invalidate current session.

### GET /api/auth/me
Get current user profile.

---

## Dashboard Endpoints

### GET /api/dashboard/stats
Get dashboard statistics.

**Response (200):**
```json
{
  "invoicesProcessed": {
    "value": "number",
    "change": "number",
    "trend": "up" | "down" | "neutral"
  },
  "activeWorkflows": {
    "value": "number",
    "change": "number",
    "trend": "up" | "down" | "neutral"
  },
  "accuracy": {
    "value": "number",
    "change": "number",
    "trend": "up" | "down" | "neutral"
  },
  "timeSaved": {
    "value": "string",
    "change": "number",
    "trend": "up" | "down" | "neutral"
  }
}
```

### GET /api/dashboard/activity
Get recent activity for charts.

**Query Parameters:**
- `period`: `day` | `week` | `month` | `year`

**Response (200):**
```json
{
  "data": [
    {
      "name": "string",
      "invoices": "number",
      "automated": "number"
    }
  ]
}
```

### GET /api/dashboard/recent-activity
Get recent activity feed.

**Response (200):**
```json
{
  "activities": [
    {
      "id": "string",
      "type": "invoice" | "report" | "upload" | "ai",
      "title": "string",
      "description": "string",
      "timestamp": "ISO8601 string",
      "status": "success" | "pending" | "error"
    }
  ]
}
```

---

## AI Engine Endpoints

### GET /api/ai/models
Get available AI models.

**Response (200):**
```json
{
  "models": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "status": "active" | "training" | "inactive",
      "accuracy": "number",
      "lastTrained": "ISO8601 string"
    }
  ]
}
```

### POST /api/ai/analyze
Run AI analysis on data.

**Request:**
```json
{
  "modelId": "string",
  "data": "object",
  "options": {
    "includeConfidence": "boolean",
    "threshold": "number"
  }
}
```

**Response (200):**
```json
{
  "results": [
    {
      "id": "string",
      "prediction": "string",
      "confidence": "number",
      "metadata": "object"
    }
  ]
}
```

---

## Chat Endpoints

### POST /api/chat/message/
Send a message with optional file analysis.

**Request:**
```json
{
  "message": "string",
  "conversation_history": "array of previous messages",
  "file_metadata": [
    {
      "name": "string",
      "size": "number",
      "type": "string",
      "content": "string (first 5000 chars of file)"
    }
  ]
}
```

**Response (200):**
```json
{
  "response": "string",
  "processed_data": {
    "format": "csv|json|xlsx|txt",
    "data": "array or object",
    "filename": "string"
  }
}
```

### POST /api/chat/process-file/
Process uploaded file and return structured data.

**Request:** (multipart/form-data)
- `file`: File object
- `action`: `convert` | `analyze` | `validate` | `clean`
- `output_format`: `csv` | `json` | `xlsx` | `pdf` | `txt`

**Response (200):**
```json
{
  "status": "success",
  "processed_file": {
    "filename": "string",
    "format": "string",
    "size": "number",
    "content": "string or base64"
  },
  "summary": {
    "rows_processed": "number",
    "errors": "number",
    "warnings": ["array of strings"]
  }
}
```

### POST /api/chat/convert-format/
Convert file between formats (TXT → XLSX, CSV → JSON, etc).

**Request:** (multipart/form-data)
- `file`: File object
- `from_format`: `txt` | `csv` | `json` | `xlsx` | `xls` | `pdf` | `docx`
- `to_format`: `txt` | `csv` | `json` | `xlsx` | `pdf` | `docx`

**Response (200):**
```json
{
  "filename": "string",
  "format": "string",
  "content": "base64 encoded",
  "mime_type": "string"
}
```

### POST /api/chat/export-data/
Export processed data in specified format.

**Request:**
```json
{
  "data": "array or object",
  "format": "csv|json|xlsx|pdf|txt",
  "filename": "string",
  "options": {
    "include_headers": "boolean",
    "delimiter": "string"
  }
}
```

**Response (200):**
```json
{
  "filename": "string",
  "format": "string",
  "content": "base64 encoded",
  "mime_type": "string"
}
```

**Response (200 - Streaming):**
Server-Sent Events stream with chunks:
```
data: {"type": "text", "content": "string"}
data: {"type": "done", "conversationId": "string"}
```

### GET /api/chat/history
Get chat history.

**Query Parameters:**
- `conversationId`: string (optional)
- `limit`: number (default: 50)

**Response (200):**
```json
{
  "messages": [
    {
      "id": "string",
      "role": "user" | "assistant",
      "content": "string",
      "timestamp": "ISO8601 string",
      "attachments": []
    }
  ]
}
```

---

## File Management Endpoints

### GET /api/files
List uploaded files.

**Query Parameters:**
- `page`: number
- `limit`: number
- `type`: string (optional)
- `search`: string (optional)

**Response (200):**
```json
{
  "files": [
    {
      "id": "string",
      "name": "string",
      "type": "string",
      "size": "number",
      "uploadedAt": "ISO8601 string",
      "uploadedBy": "string",
      "status": "ready" | "processing" | "error"
    }
  ],
  "total": "number",
  "page": "number",
  "totalPages": "number"
}
```

### POST /api/files/upload
Upload a file.

**Request:** `multipart/form-data`
- `file`: File
- `type`: string (optional)

**Response (200):**
```json
{
  "id": "string",
  "name": "string",
  "type": "string",
  "size": "number",
  "uploadedAt": "ISO8601 string"
}
```

### GET /api/files/:id/download
Download a file.

**Response:** File stream with appropriate Content-Type

### DELETE /api/files/:id
Delete a file.

---

## Data Tools Endpoints

### POST /api/tools/convert
Convert file format.

**Request:** `multipart/form-data`
- `file`: File
- `targetFormat`: `xlsx` | `csv` | `json`

**Response (200):**
```json
{
  "downloadUrl": "string",
  "fileName": "string",
  "expiresAt": "ISO8601 string"
}
```

### POST /api/tools/clean
Clean and process data.

**Request:** `multipart/form-data`
- `file`: File
- `operations`: JSON string of operations

**Response (200):**
```json
{
  "downloadUrl": "string",
  "fileName": "string",
  "stats": {
    "rowsProcessed": "number",
    "rowsCleaned": "number",
    "errorsFound": "number"
  }
}
```

### POST /api/tools/validate
Validate data against schema.

**Request:**
```json
{
  "fileId": "string",
  "schemaId": "string"
}
```

**Response (200):**
```json
{
  "valid": "boolean",
  "errors": [
    {
      "row": "number",
      "column": "string",
      "message": "string"
    }
  ]
}
```

---

## Reports Endpoints

### GET /api/reports
List generated reports.

**Query Parameters:**
- `page`: number
- `limit`: number
- `type`: string (optional)

**Response (200):**
```json
{
  "reports": [
    {
      "id": "string",
      "name": "string",
      "type": "reconciliation" | "billing" | "analytics" | "custom",
      "status": "ready" | "generating" | "error",
      "generatedAt": "ISO8601 string",
      "fileSize": "number"
    }
  ],
  "total": "number"
}
```

### POST /api/reports/generate
Generate a new report.

**Request:**
```json
{
  "type": "string",
  "parameters": "object",
  "format": "pdf" | "xlsx" | "csv"
}
```

**Response (202):**
```json
{
  "reportId": "string",
  "status": "queued",
  "estimatedTime": "number"
}
```

### GET /api/reports/:id/download
Download a report.

---

## Analytics Endpoints

### GET /api/analytics/overview
Get analytics overview.

**Query Parameters:**
- `period`: `day` | `week` | `month` | `year`

**Response (200):**
```json
{
  "processing": {
    "total": "number",
    "automated": "number",
    "manual": "number",
    "trend": [
      { "date": "string", "value": "number" }
    ]
  },
  "accuracy": {
    "current": "number",
    "previous": "number",
    "trend": [
      { "date": "string", "value": "number" }
    ]
  },
  "efficiency": {
    "timeSaved": "number",
    "costSaved": "number"
  }
}
```

### GET /api/analytics/charts/:chartType
Get specific chart data.

**Chart Types:** `processing-trend`, `accuracy-trend`, `category-breakdown`, `user-activity`

---

## User Management Endpoints

### GET /api/users
List users.

**Response (200):**
```json
{
  "users": [
    {
      "id": "string",
      "email": "string",
      "name": "string",
      "role": "admin" | "user" | "viewer",
      "status": "active" | "inactive",
      "lastActive": "ISO8601 string"
    }
  ]
}
```

### POST /api/users
Create a new user.

### PUT /api/users/:id
Update a user.

### DELETE /api/users/:id
Delete a user.

---

## WebSocket Endpoints

### WS /ws/notifications
Real-time notifications.

**Message Types:**
```json
{
  "type": "notification",
  "data": {
    "id": "string",
    "title": "string",
    "message": "string",
    "timestamp": "ISO8601 string"
  }
}
```

### WS /ws/chat/:conversationId
Real-time chat streaming.

---

## Error Responses

All endpoints should return errors in this format:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object | null"
  }
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

---

## CORS Configuration

The backend should allow CORS from:
- `http://localhost:3000` (development)
- Your production frontend domain

Required headers:
```
Access-Control-Allow-Origin: <frontend-origin>
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```
