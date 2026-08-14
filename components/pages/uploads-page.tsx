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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/app-context";
import Link from "next/link";

interface FileItem {
  id: number;
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

const demoFiles: FileItem[] = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showEmptyState = !demoMode && !backendConnected;

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
  const deleteFile = async (fileId: number) => {
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
  const downloadFile = async (fileId: number, fileName: string) => {
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
            </CardHeader>
            <CardContent>
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
                    return (
                      <div
                        key={file.id}
                        className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                      >
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
                                  <DropdownMenuItem disabled>
                                    Process with AI
                                  </DropdownMenuItem>
                                  <DropdownMenuItem disabled>
                                    Convert Format
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
    </div>
  );
}
