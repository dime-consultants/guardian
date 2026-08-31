"use client";

import { useState, useRef, useEffect, useCallback, DragEvent } from "react";
import {
  MessageSquare,
  Send,
  Paperclip,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  Copy,
  Download,
  X,
  FileText,
  FileSpreadsheet,
  File,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileJson,
  Search,
  Trash2,
  Edit2,
  MoreVertical,
  Clock,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Image,
  Upload,
  FileArchive,
  FileCode,
  FileCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/app-context";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Attachment {
  id: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  file_url?: string;
  attachment_type?: string;
}

interface Conversation {
  id: string;
  title: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_preview?: string | null;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  attachments?: Attachment[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [
  ".csv",
  ".txt",
  ".json",
  ".pdf",
  ".xlsx",
  ".xls",
  ".doc",
  ".docx",
];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

const getFileIcon = (file: File | { type: string; name: string }) => {
  const name = file.name ?? "";
  const type = file.type ?? "";
  if (
    type.includes("spreadsheet") ||
    type.includes("excel") ||
    name.match(/\.(csv|xlsx|xls)$/i)
  )
    return FileSpreadsheet;
  if (type.includes("json") || name.endsWith(".json")) return FileJson;
  if (type.includes("pdf") || name.endsWith(".pdf")) return FileText;
  if (type.includes("image") || name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
    return Image;
  if (name.match(/\.(zip|rar|7z|tar|gz)$/i)) return FileArchive;
  if (name.match(/\.(js|ts|py|java|go|rs)$/i)) return FileCode;
  if (type.includes("text") || name.endsWith(".txt")) return FileText;
  return File;
};

const getFileColor = (file: File) => {
  const n = file.name;
  if (n.match(/\.(xlsx|xls|csv)$/i))
    return "border-green-500/30 bg-green-50 dark:bg-green-950/20";
  if (n.match(/\.pdf$/i)) return "border-destructive/30 bg-destructive/10";
  if (n.match(/\.json$/i))
    return "border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20";
  if (n.match(/\.txt$/i))
    return "border-blue-500/30 bg-blue-50 dark:bg-blue-950/20";
  return "border-primary/20 bg-muted/30";
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const formatToolName = (toolName: string) =>
  toolName
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// Present-continuous, user-facing action for each builtin tool (see
// tools/management/commands/seed_tools.py for the canonical tool names) —
// "Reconciling…" reads far better mid-turn than "Running Reconcile Datasets".
// Anything not listed here (custom/user-defined tools included) falls back
// to formatToolName() in toolActionLabel below.
const TOOL_ACTION_LABELS: Record<string, string> = {
  read_file: "Reading file",
  detect_file_type: "Detecting file type",
  extract_safaricom_bill: "Extracting Safaricom bill",
  reconcile_ura_vs_acon: "Reconciling URA vs ACON",
  write_xlsx: "Writing spreadsheet",
  export_file: "Exporting file",
  run_python: "Running custom code",
  call_webhook: "Calling webhook",
  extract_invoice_data: "Extracting invoice data",
  flag_anomalies: "Flagging anomalies",
  reconcile_datasets: "Reconciling datasets",
  summarise_batch: "Summarising batch",
  clean_dataset: "Cleaning dataset",
};

const toolActionLabel = (toolName: string) =>
  TOOL_ACTION_LABELS[toolName] ?? `Running ${formatToolName(toolName)}`;

const formatDate = (s: string) => {
  const d = new Date(s);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString();
};

const formatTime = (s: string) =>
  new Date(s).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const groupConversationsByDate = (convs: Conversation[]) => {
  const g: Record<string, Conversation[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    older: [],
  };
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yest = new Date(today);
  yest.setDate(yest.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  for (const c of convs) {
    const d = new Date(c.created_at);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (day.getTime() === today.getTime()) g.today.push(c);
    else if (day.getTime() === yest.getTime()) g.yesterday.push(c);
    else if (d >= weekAgo) g.thisWeek.push(c);
    else if (d >= monthAgo) g.thisMonth.push(c);
    else g.older.push(c);
  }
  return g;
};

const suggestedPrompts = [
  "Process today's BRNET invoices",
  "Generate weekly reconciliation report",
  "Analyze telephone billing for May",
  "Find variances above KES 50,000",
  "Convert uploaded TXT files to Excel",
  "Export the current data as CSV",
];

const generateTitleFromContent = (content: string): string => {
  const c = content.toLowerCase();
  if (c.includes("invoice") || c.includes("invoic")) {
    if (c.includes("process")) return "Invoice Processing";
    if (c.includes("reconcile")) return "Invoice Reconciliation";
    if (c.includes("upload")) return "Uploaded Invoices";
    return "Invoice Discussion";
  }
  if (c.includes("report")) {
    if (c.includes("weekly")) return "Weekly Report";
    if (c.includes("monthly")) return "Monthly Report";
    if (c.includes("reconciliation")) return "Reconciliation Report";
    return "Report Generation";
  }
  if (c.includes("telephone") || c.includes("phone") || c.includes("call"))
    return "Telephone Billing Analysis";
  if (c.includes("file") || c.includes("upload") || c.includes("convert")) {
    if (c.includes("convert")) return "File Format Conversion";
    if (c.includes("process")) return "File Processing";
    return "File Analysis";
  }
  if (c.includes("export")) return "Data Export";
  if (c.includes("variance") || c.includes("difference"))
    return "Variance Analysis";
  if (c.includes("kra")) return "KRA Analysis";
  if (c.includes("ura")) return "URA Analysis";
  if (c.includes("brnet")) return "BRNET Analysis";

  // Clean up the title from JSON strings
  let cleanContent = content;
  try {
    const parsed = JSON.parse(content);
    if (parsed.title) cleanContent = parsed.title;
  } catch {
    // Not JSON, use as is
  }

  const stop = new Set([
    "what",
    "is",
    "are",
    "the",
    "a",
    "an",
    "and",
    "or",
    "of",
    "to",
    "for",
    "with",
  ]);
  const words = cleanContent
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => !stop.has(w))
    .slice(0, 4);
  if (words.length > 0) {
    const t = words.join(" ");
    const cap = t.charAt(0).toUpperCase() + t.slice(1);
    return cap.length > 40 ? cap.slice(0, 37) + "..." : cap;
  }
  return cleanContent.length > 50
    ? cleanContent.slice(0, 47) + "..."
    : cleanContent;
};

// ─── Demo-mode localStorage helpers ──────────────────────────────────────────

const DEMO_CONVS_KEY = "kn-demo-conversations";
const demoCmsKey = (id: string) => `kn-demo-msgs-${id}`;

const readDemoConvs = (): Conversation[] => {
  try {
    const raw = localStorage.getItem(DEMO_CONVS_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
};
const writeDemoConvs = (list: Conversation[]) => {
  try {
    localStorage.setItem(DEMO_CONVS_KEY, JSON.stringify(list));
  } catch {}
};
const readDemoMsgs = (id: string): Message[] => {
  try {
    const raw = localStorage.getItem(demoCmsKey(id));
    return raw ? (JSON.parse(raw) as Message[]) : [];
  } catch {
    return [];
  }
};
const writeDemoMsgs = (id: string, msgs: Message[]) => {
  try {
    localStorage.setItem(demoCmsKey(id), JSON.stringify(msgs));
  } catch {}
};
const purgeDemoMsgs = (id: string) => {
  try {
    localStorage.removeItem(demoCmsKey(id));
  } catch {}
};

// ─── Component ────────────────────────────────────────────────────────────────

// A slow turn (large file, chunked analysis) can legitimately take a while —
// the backend keeps running it in the background regardless of whether this
// tab is still waiting, so this is a client-side patience budget, not a
// server-side deadline. See chat/views.py:_run_turn_via_worker on the
// backend for the matching bounded-wait/WS-handoff design.
// Matches settings.CHAT_SYNC_RESULT_TIMEOUT (360s) and nginx's proxy_read_timeout
// (370s) for the chat send endpoint — turns with several tool-call round trips
// routinely take 2+ minutes, past the old 120s budget here.
const CHAT_TURN_TIMEOUT_MS = 360_000;
const CHAT_POLL_INTERVAL_MS = 3_000;

/** Thrown by waitForAssistantReply on the client-side patience budget
 * elapsing — distinct from a real failure so the UI can say "still
 * processing" instead of "error" (the turn is still running server-side). */
class ChatTurnTimeoutError extends Error {}

interface PendingTurn {
  resolve: (msg: { id: string | number; attachments: Attachment[] }) => void;
  reject: (err: Error) => void;
}

export function ChatPage() {
  const { demoMode, backendConnected, apiFetch, accessToken, backendUrl } =
    useApp();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [runningTool, setRunningTool] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<
    Conversation[]
  >([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] =
    useState("New Conversation");
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingConversationId, setEditingConversationId] = useState<
    string | null
  >(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] =
    useState<Conversation | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageIdCounterRef = useRef<number>(0);
  const editInputRef = useRef<HTMLInputElement>(null);
  const conversationIdRef = useRef<string | null>(null);
  const initDoneRef = useRef(false);
  const demoInitDoneRef = useRef(false);
  const creatingConvRef = useRef<Promise<string | null> | null>(null);

  // Chat WebSocket — delivers the assistant reply for a turn dispatched to
  // the backend worker (see sendToBackend/waitForAssistantReply below)
  // without this tab having to hold an HTTP request open for however long
  // the turn takes. One socket per active conversation.
  const wsRef = useRef<WebSocket | null>(null);
  const wsConversationIdRef = useRef<string | null>(null);
  const pendingTurnsRef = useRef<Map<string, PendingTurn>>(new Map());

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  const isWelcomeMessage = (msg: Message) => {
    const id = String(msg.id);
    return id === "welcome" || id.startsWith("welcome-");
  };

  // Clean conversation title helper
  const cleanConversationTitle = (title: string): string => {
    try {
      const parsed = JSON.parse(title);
      return parsed.title || "Conversation";
    } catch {
      return title;
    }
  };

  // ── Welcome message ────────────────────────────────────────────────────────
  const buildWelcome = useCallback(
    (): Message => ({
      id: "welcome",
      role: "assistant",
      content: demoMode
        ? `Hello! I'm your Guardian Bank Assistant.\n\n**Demo Mode Active** — I can help you:\n\n• **Account Queries** — Review balances, transaction summaries, and status checks\n• **Document Review** — Analyze uploaded statements, forms, and bank notices\n• **Workflow Guidance** — Support secure onboarding and operational follow-ups\n\n**Upload files** by clicking the "Attach Files" button or dragging them into the chat!`
        : backendConnected
          ? `Hello! I'm your Guardian Bank Assistant.\n\n**Backend Connected** — Full capabilities available:\n\n• **Account Monitoring** — Track transaction activity and verify records\n• **Customer Support Workflows** — Assist with secure service requests\n• **Document Review** — Summarize statements, reports, and attachments\n• **Operations Support** — Help with onboarding and internal banking workflows\n\nClick a conversation in the sidebar to restore history, or start a new chat below.`
          : `Hello! I'm your Guardian Bank Assistant.\n\n**Backend Disconnected** — Please either:\n• Enable **Demo Mode** in Settings to use AI\n• Configure the **Backend URL** and ensure the server is running`,
      created_at: new Date().toISOString(),
    }),
    [demoMode, backendConnected],
  );

  // ── Load conversation list ─────────────────────────────────────────────────
  const loadConversations = useCallback(async (): Promise<Conversation[]> => {
    if (!backendConnected || !apiFetch) return [];
    try {
      setIsLoadingConversations(true);
      const res = await apiFetch("chat/conversations/");
      if (res.ok) {
        const data = await res.json();
        let list: Conversation[] = [];

        if (Array.isArray(data)) {
          list = data;
        } else if (data.results && Array.isArray(data.results)) {
          list = data.results;
        }

        // Clean up conversation titles
        list = list.map((conv) => ({
          ...conv,
          title: cleanConversationTitle(conv.title),
        }));

        setConversations(list);
        setFilteredConversations(list);
        return list;
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setIsLoadingConversations(false);
    }
    return [];
  }, [backendConnected, apiFetch]);

  // ── Create new conversation ────────────────────────────────────────────────
  const createNewConversation = useCallback(
    async (title = "New Conversation"): Promise<string | null> => {
      if (demoMode) {
        const id = `demo-${Date.now()}`;
        const now = new Date().toISOString();
        const conv: Conversation = {
          id,
          title,
          created_at: now,
          updated_at: now,
          message_count: 0,
          last_message_preview: null,
        };
        setConversationId(id);
        conversationIdRef.current = id;
        setConversationTitle(title);
        setMessages([buildWelcome()]);
        // Don't write to localStorage yet — only persist once the first message
        // is sent (handleSubmit does writeDemoConvs on the first exchange).
        // This prevents empty "ghost" conversations from becoming the "most recent"
        // entry and replacing an active conversation after navigation.
        setConversations((prev) => [conv, ...prev]);
        setFilteredConversations((prev) => [conv, ...prev]);
        return id;
      }
      if (!backendConnected || !apiFetch) {
        setConversationId(null);
        conversationIdRef.current = null;
        setConversationTitle(title);
        setMessages([buildWelcome()]);
        return null;
      }

      if (creatingConvRef.current) {
        return creatingConvRef.current;
      }

      const promise = (async (): Promise<string | null> => {
        try {
          const res = await apiFetch("chat/conversations/", {
            method: "POST",
            body: JSON.stringify({ title }),
          });

          if (res.ok) {
            const data = await res.json();
            const id = String(data.id);
            const cleanTitle = cleanConversationTitle(data.title ?? title);
            setConversationId(id);
            conversationIdRef.current = id;
            setConversationTitle(cleanTitle);
            setMessages([]);
            const newConv = { ...data, title: cleanTitle };
            setConversations((prev) => [newConv, ...prev]);
            setFilteredConversations((prev) => [newConv, ...prev]);
            return id;
          }
        } catch (err) {
          console.error("Failed to create conversation:", err);
        }
        setConversationId(null);
        conversationIdRef.current = null;
        return null;
      })();

      creatingConvRef.current = promise;
      try {
        return await promise;
      } finally {
        creatingConvRef.current = null;
      }
    },
    [backendConnected, apiFetch, buildWelcome],
  );

  // ── Load a specific conversation ───────────────────────────────────────────
  const loadConversation = useCallback(
    async (convId: string) => {
      if (demoMode) {
        const msgs = readDemoMsgs(convId);
        setMessages(msgs.length > 0 ? msgs : [buildWelcome()]);
        setConversationId(convId);
        conversationIdRef.current = convId;
        const conv = conversations.find((c) => c.id === convId);
        if (conv) setConversationTitle(conv.title);
        setTimeout(
          () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          100,
        );
        return;
      }
      if (!backendConnected || !apiFetch) return;
      setIsLoadingMessages(true);
      try {
        const res = await apiFetch(
          `chat/history/?conversationId=${convId}&limit=50`,
        );

        if (!res.ok) {
          throw new Error(`Failed to load conversation (${res.status})`);
        }

        const data = await res.json();

        let messagesList: any[] = [];

        // Handle the response format from your backend
        if (data.messages && Array.isArray(data.messages)) {
          messagesList = data.messages;
        } else if (Array.isArray(data)) {
          messagesList = data;
        }

        if (messagesList.length === 0) {
          setMessages([buildWelcome()]);
        } else {
          const msgs: Message[] = messagesList.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            created_at: m.created_at,
            attachments: m.attachments || [],
          }));
          setMessages(msgs);
        }

        setConversationId(convId);
        conversationIdRef.current = convId;

        // Find conversation title from list
        const conv = conversations.find((c) => c.id === convId);
        if (conv) {
          setConversationTitle(conv.title);
        }

        setTimeout(
          () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          100,
        );
      } catch (err) {
        console.error("Failed to load conversation:", err);
        toast.error("Error", {
          description: "Failed to load conversation. Please try again.",
        });
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [backendConnected, apiFetch, buildWelcome, conversations],
  );

  // ── Restore last session ───────────────────────────────────────────────────
  // Picks the most recently updated conversation from the already-fetched
  // conversation list and loads it directly. (Previously this guessed the
  // active conversation by calling `chat/history/` with no conversationId and
  // reading a `conversation` field off the first message — but that endpoint's
  // response doesn't include a per-message conversation field, so the guess
  // always failed and a brand-new conversation got created on every restore.)

  const restoreLastSession = useCallback(
    async (convList: Conversation[]) => {
      if (!backendConnected || !apiFetch) return;
      if (convList.length === 0) {
        // Nothing to restore — don't eagerly create a conversation here.
        // sendToBackend() already creates one lazily on the first real
        // message the user sends. Creating one eagerly on every mount/
        // reconnect is what was piling up empty "New Chat" entries in
        // the sidebar (especially if the list endpoint filters out
        // conversations with 0 messages, making it look empty again
        // on the next init even after we just created one).
        return;
      }
      const mostRecent = [...convList].sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )[0];
      await loadConversation(mostRecent.id);
      setConversationTitle(mostRecent.title);
    },
    [backendConnected, apiFetch, loadConversation],
  );

  // ── Update title ───────────────────────────────────────────────────────────
  const updateConversationTitle = useCallback(
    async (convId: string, newTitle: string) => {
      if (demoMode) {
        const upd = (list: Conversation[]) =>
          list.map((c) => (c.id === convId ? { ...c, title: newTitle } : c));
        setConversations((prev) => {
          const u = upd(prev);
          writeDemoConvs(u);
          return u;
        });
        setFilteredConversations(upd);
        if (conversationIdRef.current === convId)
          setConversationTitle(newTitle);
        return true;
      }
      if (!backendConnected || !apiFetch) return false;
      try {
        const res = await apiFetch(`chat/conversations/${convId}/`, {
          method: "PATCH",
          body: JSON.stringify({ title: newTitle }),
        });
        if (res.ok) {
          const upd = (list: Conversation[]) =>
            list.map((c) => (c.id === convId ? { ...c, title: newTitle } : c));
          setConversations(upd);
          setFilteredConversations(upd);
          if (conversationIdRef.current === convId)
            setConversationTitle(newTitle);
          return true;
        }
      } catch (err) {
        console.error("Failed to update title:", err);
      }
      return false;
    },
    [backendConnected, apiFetch],
  );

  // ── Auto-title after first exchange ───────────────────────────────────────
  const autoTitle = useCallback(
    async (convId: string, firstUserContent: string) => {
      if (!backendConnected || !apiFetch) return;
      const conv = conversations.find((c) => c.id === convId);
      if (!conv || conv.title !== "New Conversation") return;
      const newTitle = generateTitleFromContent(firstUserContent);
      if (newTitle === "New Conversation") return;
      await updateConversationTitle(convId, newTitle);
    },
    [backendConnected, apiFetch, conversations, updateConversationTitle],
  );

  // ── Regenerate title ───────────────────────────────────────────────────────
  const regenerateConversationTitle = useCallback(
    async (conv: Conversation) => {
      if (!backendConnected || !apiFetch) return;
      setIsGeneratingTitle(true);
      try {
        const res = await apiFetch(
          `chat/history/?conversationId=${conv.id}&limit=50`,
        );
        if (!res.ok) return;
        const data = await res.json();

        let messagesList: any[] = [];
        if (data.messages) messagesList = data.messages;
        else if (Array.isArray(data)) messagesList = data;

        const first = messagesList.find((m: any) => m.role === "user");
        if (!first) return;
        const newTitle = generateTitleFromContent(first.content);
        if (newTitle === "New Conversation") return;
        await updateConversationTitle(conv.id, newTitle);
      } catch (err) {
        console.error("Failed to regenerate title:", err);
      } finally {
        setIsGeneratingTitle(false);
      }
    },
    [backendConnected, apiFetch, updateConversationTitle],
  );

  // ── Delete conversation ────────────────────────────────────────────────────
  const deleteConversation = useCallback(
    async (convId: string) => {
      if (demoMode) {
        purgeDemoMsgs(convId);
        const rm = (list: Conversation[]) =>
          list.filter((c) => c.id !== convId);
        setConversations((prev) => {
          const u = rm(prev);
          writeDemoConvs(u);
          return u;
        });
        setFilteredConversations(rm);
        if (conversationIdRef.current === convId) await createNewConversation();
        return true;
      }
      if (!backendConnected || !apiFetch) return false;
      try {
        const res = await apiFetch(`chat/conversations/${convId}/`, {
          method: "DELETE",
        });
        if (res.ok || res.status === 204) {
          const rm = (list: Conversation[]) =>
            list.filter((c) => c.id !== convId);
          setConversations(rm);
          setFilteredConversations(rm);
          if (conversationIdRef.current === convId)
            await createNewConversation();
          return true;
        }
      } catch (err) {
        console.error("Failed to delete conversation:", err);
      }
      return false;
    },
    [backendConnected, apiFetch, createNewConversation],
  );

  // ── Clear all history ──────────────────────────────────────────────────────
  const clearAllHistory = useCallback(async () => {
    if (demoMode) {
      conversations.forEach((c) => purgeDemoMsgs(c.id));
      writeDemoConvs([]);
      setConversations([]);
      setFilteredConversations([]);
      await createNewConversation();
      setClearAllDialogOpen(false);
      toast.success("History Cleared", {
        description: "All conversations have been deleted.",
      });
      return;
    }
    if (!backendConnected || !apiFetch) return;
    try {
      await Promise.all(
        conversations.map((c) =>
          apiFetch(`chat/conversations/${c.id}/`, { method: "DELETE" }),
        ),
      );
      setConversations([]);
      setFilteredConversations([]);
      await createNewConversation();
      setClearAllDialogOpen(false);
      toast.success("History Cleared", {
        description: "All conversations have been deleted.",
      });
    } catch (err) {
      toast.error("Error", {
        description: "Failed to clear history. Please try again.",
      });
    }
  }, [backendConnected, apiFetch, conversations, createNewConversation]);

  // ── File handling ──────────────────────────────────────────────────────────
  const validateFiles = (
    files: File[],
  ): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];
    for (const f of files) {
      const ext = "." + (f.name.split(".").pop()?.toLowerCase() ?? "");
      if (f.size > MAX_FILE_SIZE) errors.push(`${f.name} exceeds 10 MB`);
      else if (!ALLOWED_EXTENSIONS.includes(ext))
        errors.push(`${f.name}: unsupported type (${ext})`);
      else valid.push(f);
    }
    return { valid, errors };
  };

  const addFiles = (files: File[]) => {
    const { valid, errors } = validateFiles(files);
    if (errors.length)
      toast.error("Invalid Files", { description: errors.join(", ") });
    if (valid.length) setPendingFiles((prev) => [...prev, ...valid]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removePendingFile = (idx: number) =>
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));

  // ── Chat WebSocket ──────────────────────────────────────────────────────────
  // Delivers turn results pushed by the backend worker (chat.tasks.run_chat_turn_task)
  // over /ws/chat/<conversationId>/ instead of this tab holding an HTTP
  // request open for however long the turn takes. sendToBackend dispatches
  // the turn over REST (near-instant 202 + turnId) and this socket resolves
  // the matching entry in pendingTurnsRef when the turn's "done"/"error"
  // frame arrives. Polling in waitForAssistantReply is the fallback for a
  // socket that never connects or drops mid-turn.
  const connectChatSocket = useCallback(
    (convId: string) => {
      if (demoMode || !backendConnected) return;
      const current = wsRef.current;
      const currentIsLive =
        current &&
        (current.readyState === WebSocket.OPEN ||
          current.readyState === WebSocket.CONNECTING);
      if (currentIsLive && wsConversationIdRef.current === convId) return;

      current?.close();

      // backendUrl may or may not carry a trailing /api (it does on
      // staging/prod, not in local dev) — Channels' websocket routes are
      // mounted at the bare /ws/... path (see config/routing.py), never
      // under /api/, so that suffix must always be stripped here regardless
      // of which form backendUrl is currently in.
      const wsBase = backendUrl.replace(/\/api\/?$/, "").replace(/^http/, "ws");
      const url = `${wsBase}/ws/chat/${convId}/?token=${encodeURIComponent(accessToken ?? "")}`;
      const socket = new WebSocket(url);
      wsRef.current = socket;
      wsConversationIdRef.current = convId;

      socket.onmessage = (event) => {
        let data: any;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }
        const turnId = data.turnId ?? data.turn_id;
        const pending = turnId
          ? pendingTurnsRef.current.get(turnId)
          : undefined;
        if (!pending) return;

        if (data.type === "done") {
          setRunningTool(null);
          pending.resolve({
            id: data.messageId,
            attachments: data.attachments ?? [],
          });
        } else if (data.type === "error") {
          setRunningTool(null);
          pending.reject(
            new Error(data.message || "The assistant turn failed."),
          );
        } else if (data.type === "cancelled") {
          setRunningTool(null);
          pending.reject(new Error("Turn cancelled."));
        } else if (data.type === "status") {
          // Emitted once per tool the agent's tool-calling loop invokes
          // (chat/notify.py::push_chat_status) — "running" names the tool
          // that just started, "finished" clears it until the next one.
          if (data.status === "running") setRunningTool(data.tool_name ?? null);
          else if (data.status === "finished") setRunningTool(null);
        }
        // "ack" / "processing" / "text" frames are progress updates too,
        // just not ones this dialog needs — keep waiting.
      };

      socket.onerror = () => {
        // waitForAssistantReply's polling fallback covers this — a socket
        // that fails to connect or drops mid-turn isn't fatal, just slower.
      };

      socket.onclose = () => {
        if (wsRef.current === socket) {
          wsRef.current = null;
          wsConversationIdRef.current = null;
        }
      };
    },
    [demoMode, backendConnected, backendUrl, accessToken],
  );

  useEffect(() => {
    if (conversationId) connectChatSocket(conversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, backendConnected, demoMode]);

  // Deliberately separate from the effect above: closing must only happen
  // on an actual conversation switch or unmount, never as a side effect of
  // backendConnected flapping (a transient /api/health/ timeout — common in
  // this dev environment under SQLite lock contention — must not tear down
  // an otherwise-live socket mid-turn. Channels' group_send doesn't queue
  // for a disconnected client, so doing so silently drops in-flight
  // "status"/"done" frames and the turn-status dialog gets stuck on
  // "Thinking…" until the REST poll fallback eventually catches up).
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
      wsConversationIdRef.current = null;
    };
  }, [conversationId]);

  /**
   * Wait for the assistant's reply to a dispatched turn, primarily via the
   * chat WebSocket, falling back to polling the conversation's message list
   * if the socket never delivers (not connected, dropped, etc). Gives up
   * after CHAT_TURN_TIMEOUT_MS — the turn is NOT lost when this happens, it
   * keeps running on the backend and will show up on the next load/poll;
   * this is purely how long *this tab* stays open waiting for it.
   */
  const waitForAssistantReply = useCallback(
    (
      convId: string,
      turnId: string,
      sentAt: number,
    ): Promise<{ id: string | number; attachments: Attachment[] }> => {
      return new Promise((resolve, reject) => {
        let settled = false;
        let pollTimer: ReturnType<typeof setInterval>;
        let overallTimer: ReturnType<typeof setTimeout>;

        const finish = (fn: () => void) => {
          if (settled) return;
          settled = true;
          clearInterval(pollTimer);
          clearTimeout(overallTimer);
          pendingTurnsRef.current.delete(turnId);
          fn();
        };

        pendingTurnsRef.current.set(turnId, {
          resolve: (msg) => finish(() => resolve(msg)),
          reject: (err) => finish(() => reject(err)),
        });

        // Fallback for a socket that isn't connected or dropped mid-turn —
        // check whether a new assistant message has landed since we sent.
        pollTimer = setInterval(async () => {
          try {
            const res = await apiFetch(
              `chat/history/?conversationId=${convId}&limit=5`,
            );
            if (!res.ok) return;
            const data = await res.json();
            const list: any[] = data.messages ?? [];
            const reply = [...list]
              .reverse()
              .find(
                (m) =>
                  m.role === "assistant" &&
                  new Date(m.created_at).getTime() >= sentAt,
              );
            if (reply) {
              finish(() =>
                resolve({ id: reply.id, attachments: reply.attachments ?? [] }),
              );
            }
          } catch {
            // Transient — the next poll tick or the socket will catch it.
          }
        }, CHAT_POLL_INTERVAL_MS);

        overallTimer = setTimeout(() => {
          finish(() =>
            reject(
              new ChatTurnTimeoutError(
                "This is taking longer than usual (likely a large file). " +
                  "It's still processing — check back in a moment or reload " +
                  "the conversation.",
              ),
            ),
          );
        }, CHAT_TURN_TIMEOUT_MS);
      });
    },
    [apiFetch],
  );

  // ── Send message ───────────────────────────────────────────────────────────
  // Dispatches the turn (near-instant 202 + turnId — the backend runs it in
  // a worker, not on this request) then waits for the result over the chat
  // WebSocket, polling as a fallback. See waitForAssistantReply above and
  // chat/views.py:_run_turn_via_worker on the backend for why: a slow turn
  // (large file, chunked analysis) can take longer than any HTTP proxy is
  // willing to hold a connection open for, so the wait happens client-side
  // against a socket/poll instead of a single blocking request.
  const sendToBackend = useCallback(
    async (
      userMsg: Message,
      files: File[],
    ): Promise<{ assistant: Message; userAttachments: Attachment[] }> => {
      if (!backendConnected || !apiFetch)
        throw new Error("Backend not connected");

      let convId = conversationIdRef.current;
      if (!convId) {
        convId = await createNewConversation("New Conversation");
        if (!convId) throw new Error("Could not create conversation");
      }

      // Make sure the socket for this conversation is already connecting
      // before we dispatch, so we don't race a fast reply against the
      // handshake.
      connectChatSocket(convId);

      const formData = new FormData();
      formData.append("message", userMsg.content);
      for (const f of files) formData.append("files", f);

      const sentAt = Date.now();
      const res = await apiFetch(`chat/conversations/${convId}/send/?async=1`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err.error ?? err.detail ?? `Request failed (${res.status})`,
        );
      }

      const data = await res.json();
      const userAttachments: Attachment[] =
        data.user_message?.attachments ?? [];

      if (!data.turn_id) {
        // Defensive — the async endpoint should always return a turn_id.
        throw new Error(
          data.error ??
            "The server accepted the message but gave no turn to track.",
        );
      }

      const { id: assistantMessageId, attachments: assistantAttachments } =
        await waitForAssistantReply(convId, data.turn_id, sentAt);

      // The reply is already saved server-side by the time the socket/poll
      // resolves — fetch it rather than guessing its content, so it always
      // matches what's actually stored (including any tool-produced text).
      let assistantContent = "Response received.";
      let assistantCreatedAt = new Date().toISOString();
      try {
        const historyRes = await apiFetch(
          `chat/history/?conversationId=${convId}&limit=5`,
        );
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          const list: any[] = historyData.messages ?? [];
          const found = list.find(
            (m) => String(m.id) === String(assistantMessageId),
          );
          if (found) {
            assistantContent = found.content;
            assistantCreatedAt = found.created_at;
          }
        }
      } catch {
        // Keep the fallback content — the message list will show the real
        // reply next time the conversation loads regardless.
      }

      const assistant: Message = {
        id: String(assistantMessageId),
        role: "assistant",
        content: assistantContent,
        created_at: assistantCreatedAt,
        attachments: assistantAttachments,
      };

      return { assistant, userAttachments };
    },
    [
      backendConnected,
      apiFetch,
      createNewConversation,
      connectChatSocket,
      waitForAssistantReply,
    ],
  );

  // ── Download attachment ────────────────────────────────────────────────────
  const downloadAttachment = useCallback(
    async (att: Attachment) => {
      if (!backendConnected || !apiFetch) return;
      try {
        const res = await apiFetch(`chat/attachments/${att.id}/download/`);
        if (!res.ok) throw new Error("Download failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = att.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Download Started", {
          description: `Downloading ${att.filename}`,
        });
      } catch {
        toast.error("Download Failed", {
          description: "Could not download the file.",
        });
      }
    },
    [backendConnected, apiFetch],
  );

  // ── Submit message ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && pendingFiles.length === 0) return;
    if (!demoMode && !backendConnected) {
      toast.error("Not Connected", {
        description: "Enable Demo Mode or connect the backend.",
      });
      return;
    }

    const userContent =
      input.trim() || `Analyze ${pendingFiles.length} uploaded file(s)`;
    const userMsgId = `msg-${Date.now()}-${++messageIdCounterRef.current}`;

    const userMsg: Message = {
      id: userMsgId,
      role: "user",
      content: userContent,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    const filesToSend = [...pendingFiles];
    setPendingFiles([]);
    setIsLoading(true);

    try {
      let assistantMsg: Message;

      if (demoMode) {
        // Ensure a tracked conversation exists (create without resetting messages)
        let demoConvId = conversationIdRef.current;
        if (!demoConvId) {
          demoConvId = `demo-${Date.now()}`;
          const now = new Date().toISOString();
          const newConv: Conversation = {
            id: demoConvId,
            title: "New Conversation",
            created_at: now,
            updated_at: now,
            message_count: 0,
            last_message_preview: null,
          };
          setConversationId(demoConvId);
          conversationIdRef.current = demoConvId;
          setConversations((prev) => {
            const u = [newConv, ...prev];
            writeDemoConvs(u);
            return u;
          });
          setFilteredConversations((prev) => [newConv, ...prev]);
        }

        await new Promise((r) => setTimeout(r, 1200));
        const fileList = filesToSend.length
          ? `\n\n**Files attached:**\n${filesToSend.map((f) => `- ${f.name} (${formatFileSize(f.size)})`).join("\n")}`
          : "";
        assistantMsg = {
          id: `demo-${Date.now()}`,
          role: "assistant",
          content: `Demo response to: "${userContent}"${fileList}\n\n(Connect to the backend for full functionality.)`,
          created_at: new Date().toISOString(),
        };

        // Save conversation to localStorage
        const prevReal = messages.filter((m) => !isWelcomeMessage(m));
        const allMsgs = [...prevReal, userMsg, assistantMsg];
        writeDemoMsgs(demoConvId, allMsgs);

        // Auto-title on first exchange
        const isFirst = prevReal.length === 0;
        const newTitle = isFirst ? generateTitleFromContent(userContent) : null;
        setConversations((prev) => {
          const u = prev.map((c) =>
            c.id === demoConvId
              ? {
                  ...c,
                  ...(newTitle && newTitle !== "New Conversation"
                    ? { title: newTitle }
                    : {}),
                  message_count: allMsgs.length,
                  last_message_preview: userContent.slice(0, 80),
                  updated_at: new Date().toISOString(),
                }
              : c,
          );
          writeDemoConvs(u);
          return u;
        });
        setFilteredConversations((prev) =>
          prev.map((c) =>
            c.id === demoConvId
              ? {
                  ...c,
                  ...(newTitle && newTitle !== "New Conversation"
                    ? { title: newTitle }
                    : {}),
                  message_count: allMsgs.length,
                  last_message_preview: userContent.slice(0, 80),
                }
              : c,
          ),
        );
        if (newTitle && newTitle !== "New Conversation")
          setConversationTitle(newTitle);
      } else {
        const { assistant, userAttachments } = await sendToBackend(
          userMsg,
          filesToSend,
        );
        assistantMsg = assistant;

        if (userAttachments.length > 0) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === userMsgId ? { ...m, attachments: userAttachments } : m,
            ),
          );
        }

        if (filesToSend.length > 0) {
          toast.success("Files Processed", {
            description: `${filesToSend.length} file(s) uploaded and processed.`,
          });
        }

        // Show warning if AI response indicates parsing issue
        if (
          assistantMsg.content.includes("could not parse a structured JSON")
        ) {
          toast.warning("AI Response Issue", {
            description:
              "The AI returned a non-JSON response. Files were processed locally.",
          });
        }
      }

      setMessages((prev) => [...prev, assistantMsg]);

      const convId = conversationIdRef.current;
      if (convId) autoTitle(convId, userContent);

      await loadConversations();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      const isTimeout = err instanceof ChatTurnTimeoutError;
      if (isTimeout) {
        toast.info("Still Processing", { description: msg });
      } else {
        toast.error("Error", { description: msg });
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: isTimeout ? msg : `Error: ${msg}`,
          created_at: new Date().toISOString(),
        },
      ]);
      // A timeout means the turn is still running server-side — the files
      // were already accepted, so don't restore them into the composer as
      // if the send itself had failed.
      if (filesToSend.length > 0 && !isTimeout) setPendingFiles(filesToSend);
    } finally {
      setIsLoading(false);
      // Safety net: if the socket dropped mid-turn and the REST poll
      // fallback resolved it instead, no "finished" status frame ever
      // arrived to clear this.
      setRunningTool(null);
    }
  };

  // ── New chat ───────────────────────────────────────────────────────────────
  const handleNewChat = async () => {
    setInput("");
    setPendingFiles([]);
    messageIdCounterRef.current = 0;
    if (demoMode || backendConnected) {
      await createNewConversation();
    } else {
      setConversationId(null);
      conversationIdRef.current = null;
      setConversationTitle("New Conversation");
      setMessages([buildWelcome()]);
    }
  };

  // ── Demo mode initialization ────────────────────────────────────────────────
  // Guard: runs at most once per component mount (fresh ref on every remount).
  // buildWelcome is intentionally excluded from deps — its reference changes
  // whenever the context's health-check flips backendConnected, which would
  // re-fire this effect mid-session and overwrite conversationId with a stale
  // value from localStorage, causing a phantom "New Conversation" to appear.
  useEffect(() => {
    if (!demoMode) return;
    if (demoInitDoneRef.current) return;
    demoInitDoneRef.current = true;

    const saved = readDemoConvs().sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
    setConversations(saved);
    setFilteredConversations(saved);
    if (saved.length > 0) {
      const recent = saved[0];
      const msgs = readDemoMsgs(recent.id);
      // Always restore the ID — even for empty conversations — so that the
      // first typed message reuses this conversation instead of creating a new one.
      setConversationId(recent.id);
      conversationIdRef.current = recent.id;
      setConversationTitle(recent.title);
      if (msgs.length > 0) {
        setMessages(msgs);
        return;
      }
    }
    setMessages([buildWelcome()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode]);

  // ── Backend mode initialization ─────────────────────────────────────────────
  // Guard: runs at most once per component mount (fresh ref on every remount).
  // loadConversations/restoreLastSession/buildWelcome are intentionally excluded
  // from deps — they're recreated whenever `conversations` changes, which would
  // re-fire this effect and reset messages back to the welcome screen every time
  // a conversation loads, or re-run restoreLastSession() (spawning a duplicate
  // "new" conversation) after a brief backendConnected flicker from the health
  // check poll.
  useEffect(() => {
    if (demoMode) return;
    if (initDoneRef.current) return;
    setMessages([buildWelcome()]);
    if (backendConnected) {
      initDoneRef.current = true;
      // Sequential, not Promise.all: restoreLastSession needs the resolved
      // conversation list to pick the most recently updated conversation.
      (async () => {
        const list = await loadConversations();
        await restoreLastSession(list);
      })().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode, backendConnected]);

  // ── Filter conversations ───────────────────────────────────────────────────
  useEffect(() => {
    let f = [...conversations];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      f = f.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.last_message_preview?.toLowerCase().includes(q),
      );
    }
    if (dateFrom)
      f = f.filter((c) => new Date(c.created_at) >= new Date(dateFrom));
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59);
      f = f.filter((c) => new Date(c.created_at) <= end);
    }
    setFilteredConversations(f);
  }, [conversations, searchQuery, dateFrom, dateTo]);

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages, scrollToBottom]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied!", { description: "Message copied to clipboard." });
  };

  const handleEditTitle = (conv: Conversation) => {
    setEditingConversationId(conv.id);
    setEditingTitle(conv.title);
    setTimeout(() => editInputRef.current?.focus(), 100);
  };

  const handleSaveTitle = async () => {
    if (editingConversationId && editingTitle.trim())
      await updateConversationTitle(editingConversationId, editingTitle.trim());
    setEditingConversationId(null);
    setEditingTitle("");
  };

  const handleDeleteClick = (conv: Conversation) => {
    setConversationToDelete(conv);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (conversationToDelete) await deleteConversation(conversationToDelete.id);
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setShowFilters(false);
  };

  const groupedConversations = groupConversationsByDate(filteredConversations);
  const canSend =
    (!!input.trim() || pendingFiles.length > 0) &&
    (demoMode || backendConnected);

  // ── Render conversation item ───────────────────────────────────────────────
  const renderConversationItem = (conv: Conversation) => (
    <div key={conv.id} className="group relative">
      <div
        role="button"
        tabIndex={0}
        onClick={() => loadConversation(conv.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            loadConversation(conv.id);
          }
        }}
        className={cn(
          "w-full text-left p-2.5 rounded-lg transition-all duration-200 cursor-pointer",
          conversationId === conv.id
            ? "bg-primary text-primary-foreground shadow-md"
            : "hover:bg-card/80 text-foreground border border-transparent hover:border-primary/20",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {editingConversationId === conv.id ? (
              <Input
                ref={editInputRef}
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                className="h-6 text-xs rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <div className="font-medium truncate text-sm flex items-center gap-1">
                  {conv.title}
                  {conv.title !== "New Conversation" &&
                    conv.message_count > 0 && (
                      <Wand2 className="h-3 w-3 opacity-40" />
                    )}
                </div>
                {conv.last_message_preview && (
                  <div className="text-xs truncate mt-0.5 opacity-55 line-clamp-1">
                    {conv.last_message_preview}
                  </div>
                )}
                <div className="text-xs mt-1.5 opacity-50 flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  <span>{formatDate(conv.updated_at || conv.created_at)}</span>
                  {conv.message_count > 0 && (
                    <span className="ml-auto">{conv.message_count}</span>
                  )}
                </div>
              </>
            )}
          </div>
          <div
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-primary/20 rounded-full"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleEditTitle(conv)}
                  className="text-xs cursor-pointer"
                >
                  <Edit2 className="h-3 w-3 mr-2" /> Rename
                </DropdownMenuItem>
                {conv.title !== "New Conversation" && (
                  <DropdownMenuItem
                    onClick={() => regenerateConversationTitle(conv)}
                    disabled={isGeneratingTitle}
                  >
                    <Wand2 className="h-3 w-3 mr-2" />
                    {isGeneratingTitle ? "Generating..." : "Regenerate Title"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(conv)}
                  className="text-destructive text-xs cursor-pointer"
                >
                  <Trash2 className="h-3 w-3 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        "h-full flex gap-0 transition-all duration-200",
        isDragging && "ring-2 ring-primary ring-inset bg-primary/5 rounded-lg",
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 bg-primary/10 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-card rounded-2xl shadow-2xl p-8 text-center border-2 border-primary border-dashed">
            <Upload className="h-16 w-16 text-primary mx-auto mb-4 animate-bounce" />
            <h3 className="text-xl font-semibold">Drop files here</h3>
            <p className="text-muted-foreground mt-2">
              CSV, Excel, PDF, JSON, TXT (max 10 MB)
            </p>
          </div>
        </div>
      )}

      {/* Sidebar — hidden on mobile, visible md+ */}
      {(demoMode || backendConnected) && (
        <div
          className={cn(
            "border-r border-border/50 bg-muted/20 hidden md:flex flex-col transition-all duration-300 shadow-sm",
            sidebarCollapsed ? "w-12" : "w-72",
          )}
        >
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            {!sidebarCollapsed && (
              <h3 className="font-semibold text-sm tracking-wide">
                Chat History
              </h3>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-primary/10 rounded-full"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4 text-primary" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-primary" />
              )}
            </Button>
          </div>

          {!sidebarCollapsed && (
            <>
              <div className="p-3.5 space-y-3 border-b border-border/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm rounded-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8 rounded-lg"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Clock className="h-3 w-3 mr-1.5" /> Filter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 text-destructive hover:bg-destructive/10 rounded-lg"
                    onClick={() => setClearAllDialogOpen(true)}
                  >
                    <Trash2 className="h-3 w-3 mr-1.5" /> Clear
                  </Button>
                </div>
                {showFilters && (
                  <div className="space-y-2 p-3 rounded-lg bg-card border border-primary/20 shadow-sm">
                    <label className="text-xs font-semibold text-foreground/70">
                      From Date
                    </label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-8 text-sm rounded-lg"
                    />
                    <label className="text-xs font-semibold text-foreground/70 mt-2 block">
                      To Date
                    </label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-8 text-sm rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full text-xs h-8 mt-2"
                      onClick={clearFilters}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
                <Button
                  onClick={() => createNewConversation()}
                  className="w-full h-9 rounded-lg text-sm"
                  size="sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" /> New Chat
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                {isLoadingConversations ? (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    <Loader2 className="h-5 w-5 animate-spin inline mb-2" />
                    <p>Loading history...</p>
                  </div>
                ) : filteredConversations.length > 0 ? (
                  <>
                    {(
                      [
                        "today",
                        "yesterday",
                        "thisWeek",
                        "thisMonth",
                        "older",
                      ] as const
                    ).map((key) => {
                      const label: Record<string, string> = {
                        today: "Today",
                        yesterday: "Yesterday",
                        thisWeek: "This Week",
                        thisMonth: "This Month",
                        older: "Older",
                      };
                      const items = groupedConversations[key];
                      if (!items.length) return null;
                      return (
                        <div key={key}>
                          <h4 className="text-xs font-bold text-primary/60 mb-2 px-2 uppercase tracking-wider">
                            {label[key]}
                          </h4>
                          <div className="space-y-1">
                            {items.map(renderConversationItem)}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    {searchQuery || dateFrom || dateTo ? (
                      <>
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">
                          No conversations match your filters
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={clearFilters}
                          className="mt-2 text-xs"
                        >
                          Clear filters
                        </Button>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">No conversations yet</p>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => createNewConversation()}
                          className="mt-2 text-xs"
                        >
                          Start your first chat
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-3 md:px-6 py-3 md:py-4 border-b border-border/50 flex items-center justify-between flex-shrink-0 flex-wrap gap-2 md:gap-3">
          <div className="min-w-0 flex-1 flex items-center gap-2">
            {/* Mobile history toggle */}
            {(demoMode || backendConnected) && (
              <Button
                variant="outline"
                size="sm"
                className="md:hidden h-8 px-2 flex-shrink-0 gap-1 text-xs rounded-lg"
                onClick={() => setMobileHistoryOpen(true)}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>History</span>
              </Button>
            )}
            <div className="min-w-0">
              <h2 className="text-base md:text-xl font-bold tracking-tight flex items-center gap-2 md:gap-3">
                <MessageSquare className="h-5 md:h-6 w-5 md:w-6 text-primary flex-shrink-0" />
                <span className="truncate">{conversationTitle}</span>
              </h2>
              <p className="text-muted-foreground mt-0.5 md:mt-1 text-xs font-medium">
                {demoMode ? "Demo mode" : "Backend connected"}
                {conversationId && messages.length > 0
                  ? ` • ${messages.filter((m) => !isWelcomeMessage(m)).length} message${messages.filter((m) => !isWelcomeMessage(m)).length !== 1 ? "s" : ""}${hasMoreMessages ? "+" : ""}`
                  : " • New conversation"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {demoMode ? (
              <Badge
                variant="secondary"
                className="hidden sm:flex bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 px-3 py-1 text-xs rounded-full"
              >
                <Sparkles className="w-3 h-3 mr-1.5" /> Demo Mode
              </Badge>
            ) : backendConnected ? (
              <Badge
                variant="secondary"
                className="hidden sm:flex bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-3 py-1 text-xs rounded-full"
              >
                <CheckCircle2 className="w-3 h-3 mr-1.5" /> Connected
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="hidden sm:flex bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 px-3 py-1 text-xs rounded-full"
              >
                <AlertCircle className="w-3 h-3 mr-1.5" /> Disconnected
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewChat}
              className="h-8 text-xs rounded-lg"
            >
              <RotateCcw className="h-3 w-3 sm:mr-1.5" />
              <span className="hidden sm:inline">New Chat</span>
            </Button>
            {backendConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={loadConversations}
                disabled={isLoadingConversations}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <Loader2
                  className={cn(
                    "h-3 w-3",
                    isLoadingConversations && "animate-spin",
                  )}
                />
              </Button>
            )}
          </div>
        </div>

        <Card className="flex-1 flex flex-col border-border/50 bg-card overflow-hidden min-h-0 shadow-sm m-2 mt-2 md:m-6 md:mt-4 rounded-xl">
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-muted-foreground text-sm">
                    No messages yet. Start a conversation!
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={String(message.id)}
                  className={cn(
                    "flex gap-3 animate-in fade-in",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] md:max-w-[65%] rounded-xl p-3 md:p-3.5 shadow-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-card border border-border/50 text-foreground rounded-bl-none",
                    )}
                  >
                    <div className="text-sm whitespace-pre-wrap leading-relaxed break-words">
                      {message.content}
                    </div>

                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold opacity-70">
                          Attachments:
                        </p>
                        {message.attachments.map((att) => {
                          const FileIcon = getFileIcon({
                            type: att.file_type,
                            name: att.filename,
                          });
                          return (
                            <div
                              key={att.id}
                              className={cn(
                                "flex items-center gap-2 p-2.5 rounded-lg text-xs border",
                                message.role === "user"
                                  ? "bg-primary/15 border-white/20 text-white"
                                  : "bg-muted border-border/50",
                              )}
                            >
                              <FileIcon className="h-4 w-4 flex-shrink-0 opacity-70" />
                              <span className="flex-1 truncate font-medium">
                                {att.filename}
                              </span>
                              <span className="opacity-60">
                                {formatFileSize(att.file_size_bytes)}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 hover:bg-card/20"
                                onClick={() => downloadAttachment(att)}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div
                      className={cn(
                        "flex items-center gap-2 mt-2 text-xs",
                        message.role === "user"
                          ? "text-white/60 justify-end"
                          : "text-muted-foreground",
                      )}
                    >
                      <span>{formatTime(message.created_at)}</span>
                      {message.role === "assistant" &&
                        !isWelcomeMessage(message) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 p-0 opacity-70 hover:opacity-100"
                            onClick={() => copyMessage(message.content)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                    </div>
                  </div>
                  {message.role === "user" && (
                    <div className="h-8 w-8 rounded-lg bg-secondary/30 border border-secondary/40 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3 justify-start animate-in fade-in">
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-card border border-border/50 rounded-xl p-3.5 shadow-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {runningTool ? `${toolActionLabel(runningTool)}…` : "Thinking…"}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {messages.length <= 1 && (demoMode || backendConnected) && (
            <div className="px-4 md:px-6 py-3 md:py-4 border-t border-border/50 flex-shrink-0">
              <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide">
                Suggested Prompts
              </p>
              <div className="grid grid-cols-2 gap-2">
                {suggestedPrompts.map((p) => (
                  <Button
                    key={p}
                    variant="outline"
                    size="sm"
                    className="text-xs h-10 rounded-lg hover:bg-primary/10 justify-start text-left px-2 touch-expand"
                    onClick={() => setInput(p)}
                    disabled={isLoading}
                  >
                    <Sparkles className="h-3 w-3 mr-1.5 flex-shrink-0 text-primary" />
                    <span className="truncate">{p}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {pendingFiles.length > 0 && (
            <div className="px-6 py-3 border-t border-border/50 bg-muted/30 flex-shrink-0">
              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-green-500" />
                Ready to Send ({pendingFiles.length} file
                {pendingFiles.length !== 1 ? "s" : ""})
              </p>
              <div className="flex flex-wrap gap-2">
                {pendingFiles.map((file, idx) => {
                  const FileIcon = getFileIcon(file);
                  const fileColor = getFileColor(file);
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm shadow-sm",
                        fileColor,
                      )}
                    >
                      <FileIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="max-w-[200px] truncate font-medium">
                        {file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0 hover:bg-destructive/10 rounded-full"
                        onClick={() => removePendingFile(idx)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t border-border/50 p-3 md:p-6 flex-shrink-0">
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 md:gap-3"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept=".txt,.csv,.xlsx,.xls,.json,.pdf,.docx"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="default"
                className="flex-shrink-0 h-11 px-2 md:px-4 rounded-lg hover:bg-primary/10 hover:border-primary/50 transition-all"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Paperclip className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Attach Files</span>
              </Button>
              <div className="flex-1 relative">
                <Input
                  placeholder={
                    !demoMode && !backendConnected
                      ? "Enable Demo Mode or connect backend..."
                      : pendingFiles.length > 0
                        ? `Ask about ${pendingFiles.length} attached file(s)...`
                        : "Ask me anything or drag & drop files..."
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (canSend && !isLoading) handleSubmit(e as any);
                    }
                  }}
                  className="h-11 rounded-lg border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/10 pr-16 sm:pr-28"
                  disabled={(!demoMode && !backendConnected) || isLoading}
                />
                {pendingFiles.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 text-white text-xs px-2 py-0.5 pointer-events-none"
                  >
                    {pendingFiles.length} file
                    {pendingFiles.length !== 1 ? "s" : ""} ready
                  </Badge>
                )}
              </div>
              <Button
                type="submit"
                disabled={!canSend || isLoading}
                className="flex-shrink-0 h-11 px-3 md:px-6 rounded-lg shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin md:mr-2" />
                    <span className="hidden md:inline">Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Send</span>
                  </>
                )}
              </Button>
            </form>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-muted-foreground">
                {demoMode
                  ? "Demo Mode: prototyping only"
                  : backendConnected
                    ? "Connected • CSV, Excel, PDF, JSON, TXT (max 10 MB)"
                    : "Connect backend for full functionality"}
              </p>
              <p className="text-xs text-muted-foreground">Enter to send</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Mobile chat history sheet */}
      <Sheet open={mobileHistoryOpen} onOpenChange={setMobileHistoryOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetHeader className="p-4 border-b border-border/50">
            <SheetTitle>Chat History</SheetTitle>
          </SheetHeader>
          <div className="p-3 border-b border-border/50 space-y-2">
            <Button
              onClick={() => {
                createNewConversation();
                setMobileHistoryOpen(false);
              }}
              className="w-full h-9 rounded-lg text-sm"
              size="sm"
            >
              <MessageSquare className="h-4 w-4 mr-2" /> New Chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            {isLoadingConversations ? (
              <div className="text-center py-8">
                <Loader2 className="h-5 w-5 animate-spin inline" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No conversations yet
              </p>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    loadConversation(conv.id);
                    setMobileHistoryOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      loadConversation(conv.id);
                      setMobileHistoryOpen(false);
                    }
                  }}
                  className={cn(
                    "w-full text-left p-2.5 rounded-lg cursor-pointer transition-colors",
                    conversationId === conv.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  <div className="font-medium truncate text-sm">
                    {conv.title}
                  </div>
                  <div className="text-xs opacity-60 mt-0.5 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {formatDate(conv.updated_at || conv.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              {conversationToDelete
                ? `Delete "${conversationToDelete.title}"? This cannot be undone.`
                : "Delete this conversation?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All History</DialogTitle>
            <DialogDescription>
              Delete all conversations? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClearAllDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={clearAllHistory}>
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
