"use client";

import { useState } from "react";
import {
  Brain,
  Play,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  History,
  Settings,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const pipelineOptions = [
  { value: "invoice-reconciliation", label: "Invoice Reconciliation" },
  { value: "variance-analysis", label: "Variance Analysis" },
  { value: "telephone-billing", label: "Telephone Billing Analysis" },
  { value: "acon-kra-match", label: "ACON-KRA Matching" },
  { value: "tax-compliance", label: "Tax Compliance Check" },
];

const recentInsights = [
  {
    id: 1,
    title: "Variance Detected in May Invoices",
    description: "12 invoices show discrepancies between ACON and KRA records. Total variance: KES 245,000",
    severity: "warning",
    timestamp: "2 hours ago",
    source: "ACON-KRA Matching",
  },
  {
    id: 2,
    title: "Telephone Cost Optimization",
    description: "Analysis suggests consolidating 23 CU numbers could reduce monthly costs by 15%",
    severity: "success",
    timestamp: "5 hours ago",
    source: "Telephone Billing Analysis",
  },
  {
    id: 3,
    title: "Duplicate Invoice Detection",
    description: "3 potential duplicate invoices identified in vendor batch from May 20th",
    severity: "error",
    timestamp: "1 day ago",
    source: "Invoice Reconciliation",
  },
  {
    id: 4,
    title: "Compliance Status Update",
    description: "All tax filings are current. Next deadline: June 20th for monthly returns",
    severity: "success",
    timestamp: "1 day ago",
    source: "Tax Compliance Check",
  },
];

export function AIEnginePage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState("");
  const [prompt, setPrompt] = useState("");

  const handleRunAnalysis = () => {
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 3000);
  };

  return (
    <div className="space-y-6 pb-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 md:gap-3">
            <Brain className="h-6 md:h-7 w-6 md:w-7 text-primary flex-shrink-0" />
            AI Engine
          </h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base line-clamp-2">
            AI-powered analysis, variance detection, and automated insights for finance operations.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:flex-shrink-0">
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">History</span>
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Configure</span>
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Analysis Panel */}
        <Card className="lg:col-span-2 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Run Analysis</CardTitle>
            <CardDescription>
              Select a pipeline and provide context for AI-powered analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Analysis Pipeline</label>
                <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pipeline..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelineOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Data Source</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uploaded">Uploaded Files</SelectItem>
                    <SelectItem value="acon">ACON System</SelectItem>
                    <SelectItem value="kra">KRA Portal</SelectItem>
                    <SelectItem value="safaricom">Safaricom Billing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Analysis Context</label>
              <Textarea
                placeholder="Describe what you want the AI to analyze. E.g., 'Compare May 2024 invoices against KRA records and flag any discrepancies above KES 10,000'"
                className="min-h-[120px] resize-none"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleRunAnalysis}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Analysis
                  </>
                )}
              </Button>
              <Button variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                Auto Suggest
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1 lg:gap-3">
          <Card className="border-border bg-card p-3 gap-1">
            <CardHeader className="p-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Analyses Today
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-xl md:text-2xl font-bold text-card-foreground">47</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="text-chart-3">+12%</span> yesterday
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card p-3 gap-1">
            <CardHeader className="p-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Insights Generated
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-xl md:text-2xl font-bold text-card-foreground">156</div>
              <p className="text-xs text-muted-foreground mt-0.5">This week</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card p-3 gap-1">
            <CardHeader className="p-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Avg Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-xl md:text-2xl font-bold text-card-foreground">2.3s</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="text-chart-3">-18%</span> faster
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Insights */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-card-foreground">Recent AI Insights</CardTitle>
            <CardDescription>Automated findings from recent analyses</CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentInsights.map((insight) => (
              <div
                key={insight.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              >
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    insight.severity === "success"
                      ? "bg-chart-3/10"
                      : insight.severity === "warning"
                      ? "bg-chart-5/10"
                      : "bg-destructive/10"
                  }`}
                >
                  {insight.severity === "success" ? (
                    <CheckCircle2 className="h-5 w-5 text-chart-3" />
                  ) : insight.severity === "warning" ? (
                    <AlertTriangle className="h-5 w-5 text-chart-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <h4 className="font-medium text-card-foreground text-sm">{insight.title}</h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground whitespace-nowrap">
                      {insight.source}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">{insight.timestamp}</p>
                </div>
                <Button variant="ghost" size="sm" className="flex-shrink-0">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
