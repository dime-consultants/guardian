"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Upload,
  File,
  FileText,
  FileSpreadsheet,
  Trash2,
  Download,
  Eye,
  MoreHorizontal,
  Search,
  Filter,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Server,
  Loader2,
  ChevronRight,
  ChevronDown,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/app-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BatchToolRunDialog } from "@/components/batch-tool-run-dialog";
import { Wrench } from "lucide-react";
import Link from "next/link";

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  extension: string;
  detected_type: string;
  detection_confidence: string;
  status: "pending" | "parsing" | "parsed" | "parse_error" | "skipped";
  parse_error: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface FileListResponse {
  files: FileItem[];
  total: number;
  page: number;
  totalPages: number;
}

interface ToolCallItem {
  id: number;
  public_id: string;
  tool: number;
  tool_name: string;
  tool_display: string;
  job: number | null;
  uploaded_file: string | null;
  arguments: Record<string, unknown>;
  result: { output_filename?: string; [key: string]: unknown } | null;
  error_message: string;
  status: "pending" | "running" | "success" | "error" | string;
  status_display: string;
  duration_ms: number | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

const demoFiles: FileItem[] = [
  {
    id: "1",
    name: "may_2024_invoices_batch1.txt",
    type: "text/plain",
    size: 2400000,
    extension: "txt",
    detected_type: "ura_fiscal_receipt",
    detection_confidence: "high",
    status: "parsed",
    parse_error: "",
    uploadedAt: "2026-05-20T10:30:00+03:00",
    uploadedBy: "Luther Isaboke",
  },
  {
    id: "2",
    name: "telephone_billing_may_577pages.pdf",
    type: "application/pdf",
    size: 15800000,
    extension: "pdf",
    detected_type: "safaricom_bill",
    detection_confidence: "high",
    status: "parsed",
    parse_error: "",
    uploadedAt: "2026-05-19T14:20:00+03:00",
    uploadedBy: "Luther Isaboke",
  },
  {
    id: "3",
    name: "acon_kra_export_may.xlsx",
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 4200000,
    extension: "xlsx",
    detected_type: "acon_export",
    detection_confidence: "high",
    status: "parsed",
    parse_error: "",
    uploadedAt: "2026-05-18T09:15:00+03:00",
    uploadedBy: "Luther Isaboke",
  },
];

const getFileIcon = (extension: string) => {
  switch (extension?.toLowerCase()) {
    case "xlsx":
    case "xls":
      return FileSpreadsheet;
    case "txt":
    case "csv":
      return FileText;
    case "pdf":
      return FileText;
    default:
      return File;
  }
};

function getFileTypeColor(extension: string) {
  const ext = extension?.toLowerCase();
  switch (ext) {
    case "xlsx":
    case "xls":
      return { bg: "bg-muted", text: "text-primary" };
    case "txt":
      return { bg: "bg-muted", text: "text-accent" };
    case "csv":
      return { bg: "bg-muted", text: "text-brand-accent" };
    case "pdf":
      return { bg: "bg-muted", text: "text-destructive" };
    default:
      return { bg: "bg-muted", text: "text-muted-foreground" };
  }
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function getStatusColor(status: string) {
  switch (status) {
    case "parsed":
      return "bg-muted text-primary";
    case "parsing":
      return "bg-muted text-accent";
    case "pending":
      return "bg-muted text-brand-accent";
    case "parse_error":
    case "skipped":
      return "bg-muted text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

const REPORT_FORMATS = ["xlsx", "csv", "pdf", "json", "txt"] as const;

function formatToolResult(result: ToolCallItem["result"]): string {
  if (!result) return "";
  // Some tools (e.g. flag_anomalies) nest their real payload as a JSON
  // *string* inside result.result rather than a native object — parse it
  // one level deep so it pretty-prints instead of showing escaped quotes.
  const expanded: Record<string, unknown> = { ...result };
  if (typeof expanded.result === "string") {
    try {
      expanded.result = JSON.parse(expanded.result);
    } catch {
      // not JSON — leave as the raw string
    }
  }
  return JSON.stringify(expanded, null, 2);
}

function AwaitingBackendState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 rounded-full bg-muted mb-4">
        <Server className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Awaiting Backend Connection
      </h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Connect to your Django backend to manage files, or enable Demo Mode to preview with sample data.
      </p>
      <Link href="/settings">
        <Button variant="outline">Configure Backend</Button>
      </Link>
    </div>
  );
}

export function UploadsPage() {
  const { demoMode, backendConnected, apiFetch } = useApp();
  const [files, setFiles] = useState<FileItem[]>(demoMode ? demoFiles : []);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [showBatchToolDialog, setShowBatchToolDialog] = useState(false);
  const [expandedFileIds, setExpandedFileIds] = useState<Set<string>>(new Set());
  const [toolCallsByFile, setToolCallsByFile] = useState<Record<string, ToolCallItem[]>>({});
  const [loadingToolCalls, setLoadingToolCalls] = useState<Set<string>>(new Set());
  const [viewingCall, setViewingCall] = useState<ToolCallItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showEmptyState = !demoMode && !backendConnected;

  // Fetch (or refresh) one file's tool-call history.
  const refetchToolCalls = useCallback(
    async (fileId: string) => {
      if (!apiFetch) return;
      setLoadingToolCalls((prev) => new Set(prev).add(fileId));
      try {
        const res = await apiFetch(`tools/calls/?file=${fileId}`);
        if (res.ok) {
          const data = (await res.json()) as ToolCallItem[];
          setToolCallsByFile((prev) => ({ ...prev, [fileId]: data }));
        }
      } catch (error) {
        console.error("Failed to load tool calls:", error);
      } finally {
        setLoadingToolCalls((prev) => {
          const next = new Set(prev);
          next.delete(fileId);
          return next;
        });
      }
    },
    [apiFetch],
  );

  const toggleExpand = (fileId: string) => {
    setExpandedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
        if (!toolCallsByFile[fileId]) refetchToolCalls(fileId);
      }
      return next;
    });
  };

  // After a batch tool run: refresh currently-expanded rows in place, and
  // drop cached entries for collapsed ones so they refetch fresh next time
  // they're expanded — avoids visibly flickering a row the user didn't open.
  const handleToolRunComplete = useCallback(
    (fileIds: string[]) => {
      for (const fileId of fileIds) {
        if (expandedFileIds.has(fileId)) {
          refetchToolCalls(fileId);
        } else {
          setToolCallsByFile((prev) => {
            if (!(fileId in prev)) return prev;
            const next = { ...prev };
            delete next[fileId];
            return next;
          });
        }
      }
    },
    [expandedFileIds, refetchToolCalls],
  );

  const downloadToolReport = async (
    toolCallId: number,
    filetype: (typeof REPORT_FORMATS)[number],
    toolLabel: string,
  ) => {
    if (!apiFetch) return;
    try {
      const res = await apiFetch(`tools/calls/${toolCallId}/report/?filetype=${filetype}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${toolLabel}.${filetype}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  // Load files from backend
  const loadFiles = useCallback(async () => {
    if (!backendConnected || !apiFetch) return;

    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", "20");
      if (filterType) params.append("type", filterType);
      if (searchQuery) params.append("search", searchQuery);

      const res = await apiFetch(`files/?${params.toString()}`);

      if (res.ok) {
        const data = (await res.json()) as FileListResponse;
        setFiles(data.files);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to load files:", error);
    } finally {
      setIsLoading(false);
    }
  }, [backendConnected, apiFetch, currentPage, filterType, searchQuery]);

  // Load files on mount and when filters change
  useEffect(() => {
    if (!demoMode && backendConnected) {
      loadFiles();
    }
  }, [demoMode, backendConnected, loadFiles]);

  // Handle file upload
  const handleFileUpload = async (filesToUpload: FileList | null) => {
    if (!filesToUpload || filesToUpload.length === 0) return;
    if (!backendConnected || !apiFetch) return;

    try {
      setIsLoading(true);
      for (const file of Array.from(filesToUpload)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await apiFetch("files/upload/", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          console.log("[v0] File uploaded successfully:", file.name);
        } else {
          console.error("[v0] Failed to upload file:", file.name);
        }
      }
      // Reload file list
      await loadFiles();
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!demoMode && backendConnected) {
        handleFileUpload(e.dataTransfer.files);
      }
    },
    [demoMode, backendConnected]
  );

  // Handle file delete
  const deleteFile = async (fileId: string) => {
    if (!backendConnected || !apiFetch) return;

    try {
      const res = await apiFetch(`files/${fileId}/`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // Handle file download
  const downloadFile = async (fileId: string, fileName: string) => {
    if (!backendConnected || !apiFetch) return;

    try {
      const res = await apiFetch(`files/${fileId}/download/`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const filteredFiles = demoMode
    ? files.filter((file) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : files;

  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  const allVisibleSelected = filteredFiles.length > 0 && filteredFiles.every((f) => selectedFileIds.has(f.id));
  const toggleSelectAll = () => {
    setSelectedFileIds((prev) => {
      if (allVisibleSelected) return new Set();
      return new Set(filteredFiles.map((f) => f.id));
    });
  };

  const selectedFileRefs = filteredFiles
    .filter((f) => selectedFileIds.has(f.id))
    .map((f) => ({ id: f.id, name: f.name }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 md:gap-3">
            <Upload className="h-6 md:h-7 w-6 md:w-7 text-primary flex-shrink-0" />
            File Manager
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Upload and manage invoice files, billing data, and documents.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:flex-shrink-0">
          {demoMode && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
              Demo Data
            </Badge>
          )}
          {!demoMode && backendConnected && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
              Connected
            </Badge>
          )}
          {!demoMode && !backendConnected && (
            <Badge variant="secondary" className="bg-muted text-muted-foreground">
              No Data Source
            </Badge>
          )}
        </div>
      </div>

      {showEmptyState ? (
        <Card className="border-border bg-card">
          <AwaitingBackendState />
        </Card>
      ) : (
        <>
          {/* Upload Zone */}
          {!demoMode && (
            <Card
              className={cn(
                "border-2 border-dashed transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="p-4 rounded-full bg-primary/10 mb-4">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Upload Files
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md">
                    Drag and drop your invoice files, billing data, or documents here.
                    Supports TXT, XLSX, CSV, and PDF files.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 justify-center">
                    <Button
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Browse Files"
                      )}
                    </Button>
                    <Button variant="outline" disabled>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      From BRNET (coming soon)
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    onChange={(e) => handleFileUpload(e.target.files)}
                    accept=".txt,.pdf,.xlsx,.xls,.csv"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* File List */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-foreground">Uploaded Files</CardTitle>
                  <CardDescription>
                    {filteredFiles.length} files {!demoMode && `(Page ${currentPage} of ${totalPages})`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search files..."
                      className="pl-9 w-full sm:w-64"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                  {!demoMode && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => { setFilterType(null); setCurrentPage(1); }}>
                          All Types
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setFilterType("txt"); setCurrentPage(1); }}>
                          Text Files
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setFilterType("pdf"); setCurrentPage(1); }}>
                          PDF Files
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setFilterType("xlsx"); setCurrentPage(1); }}>
                          Excel Files
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setFilterType("csv"); setCurrentPage(1); }}>
                          CSV Files
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
              {!demoMode && selectedFileIds.size > 0 && (
                <div className="flex items-center justify-between gap-2 mt-3 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="text-xs text-primary font-medium">
                    {selectedFileIds.size} file{selectedFileIds.size === 1 ? "" : "s"} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="h-7 text-xs px-3 bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => setShowBatchToolDialog(true)}
                    >
                      <Wrench className="h-3 w-3 mr-1.5" />
                      Run Tools
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-2"
                      onClick={() => setSelectedFileIds(new Set())}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!demoMode && filteredFiles.length > 0 && (
                <div className="flex items-center gap-2 px-1 pb-2">
                  <Checkbox
                    id="select-all-files"
                    checked={allVisibleSelected}
                    onCheckedChange={toggleSelectAll}
                  />
                  <Label htmlFor="select-all-files" className="text-xs text-muted-foreground cursor-pointer">
                    Select all
                  </Label>
                </div>
              )}
              {isLoading && !demoMode ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No files found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFiles.map((file) => {
                    const FileIcon = getFileIcon(file.extension);
                    const isExpanded = expandedFileIds.has(file.id);
                    const isLoadingCalls = loadingToolCalls.has(file.id);
                    const calls = toolCallsByFile[file.id];
                    return (
                      <div key={file.id}>
                      <div
                        className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                      >
                        {!demoMode && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() => toggleExpand(file.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {!demoMode && (
                          <Checkbox
                            checked={selectedFileIds.has(file.id)}
                            onCheckedChange={() => toggleFileSelection(file.id)}
                            className="flex-shrink-0"
                          />
                        )}
                        <div className={cn(
                          "p-2.5 rounded-lg flex-shrink-0",
                          getFileTypeColor(file.extension).bg
                        )}>
                          <FileIcon className={cn("h-5 w-5", getFileTypeColor(file.extension).text)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground truncate">
                              {file.name}
                            </span>
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full",
                                getStatusColor(file.status)
                              )}
                            >
                              {file.status === "parsed" ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 inline mr-1" />
                                  Parsed
                                </>
                              ) : file.status === "parsing" ? (
                                <>
                                  <Loader2 className="h-3 w-3 inline mr-1 animate-spin" />
                                  Parsing
                                </>
                              ) : file.status === "parse_error" ? (
                                <>
                                  <AlertCircle className="h-3 w-3 inline mr-1" />
                                  Error
                                </>
                              ) : (
                                file.status
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{formatBytes(file.size)}</span>
                            <span>{file.detected_type}</span>
                            <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!demoMode && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => downloadFile(file.id, file.name)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedFileIds(new Set([file.id]));
                                      setShowBatchToolDialog(true);
                                    }}
                                  >
                                    <Wrench className="h-4 w-4 mr-2" />
                                    Run Tools
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => deleteFile(file.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="ml-12 mr-2 mb-2 rounded-lg border border-border bg-card p-3">
                          {isLoadingCalls ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          ) : !calls || calls.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-1">
                              No tools have been run on this file yet.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {calls.map((call) => (
                                <div
                                  key={call.id}
                                  className="flex items-center justify-between gap-2 rounded-md bg-muted/50 p-2.5 text-xs"
                                >
                                  <div className="min-w-0 flex items-center gap-2">
                                    {call.status === "success" ? (
                                      <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                    ) : call.status === "error" ? (
                                      <XCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                                    ) : (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground flex-shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                      <div className="font-medium truncate">{call.tool_display || call.tool_name}</div>
                                      <div className="text-muted-foreground truncate">
                                        {new Date(call.created_at).toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                  {call.status === "success" && (
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 px-2"
                                        onClick={() => setViewingCall(call)}
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button size="sm" variant="outline" className="h-6 px-2">
                                            <Download className="h-3 w-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          {REPORT_FORMATS.map((fmt) => (
                                            <DropdownMenuItem
                                              key={fmt}
                                              onClick={() =>
                                                downloadToolReport(
                                                  call.id,
                                                  fmt,
                                                  call.tool_display || call.tool_name,
                                                )
                                              }
                                            >
                                              Download as {fmt.toUpperCase()}
                                            </DropdownMenuItem>
                                          ))}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  )}
                                  {call.status === "error" && call.error_message && (
                                    <span className="text-destructive truncate max-w-[16rem]" title={call.error_message}>
                                      {call.error_message}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {!demoMode && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <BatchToolRunDialog
        open={showBatchToolDialog}
        onOpenChange={setShowBatchToolDialog}
        files={selectedFileRefs}
        onToolRunComplete={handleToolRunComplete}
      />

      <Dialog open={!!viewingCall} onOpenChange={(open) => !open && setViewingCall(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingCall?.tool_display || viewingCall?.tool_name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <pre className="whitespace-pre-wrap break-words text-xs bg-muted/50 rounded-md p-3">
              {viewingCall ? formatToolResult(viewingCall.result) : ""}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
