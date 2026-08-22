import { ArrowDownUp, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { ExceptionAccount } from "./dashboard-types";
import { DashboardSection } from "./dashboard-section";

interface ExceptionTableProps {
  rows: ExceptionAccount[];
}

const riskStyles = {
  High: "border-error/20 bg-error/10 text-error",
  Medium: "border-warning/20 bg-warning/10 text-warning",
  Low: "border-success/20 bg-success/10 text-success",
};

export function ExceptionTable({ rows }: ExceptionTableProps) {
  return (
    <DashboardSection
      title="Top Accounts"
      className="lg:col-span-7"
      action={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2 text-xs">
            <ArrowDownUp className="size-3.5" />
            Sort
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2 text-xs">
            <SlidersHorizontal className="size-3.5" />
            Filter
          </Button>
        </div>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead>Borrower</TableHead>
            <TableHead>Issue</TableHead>
            <TableHead className="text-right">Outstanding</TableHead>
            <TableHead className="text-right">Arrears</TableHead>
            <TableHead className="text-right">Risk</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium text-foreground">{row.account}</TableCell>
              <TableCell className="text-muted-foreground">{row.borrower}</TableCell>
              <TableCell>{row.issue}</TableCell>
              <TableCell className="text-right font-mono text-xs">{row.outstanding}</TableCell>
              <TableCell className="text-right font-mono text-xs">{row.arrears}</TableCell>
              <TableCell className="text-right">
                <Badge variant="outline" className={cn("rounded", riskStyles[row.risk])}>
                  {row.risk}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DashboardSection>
  );
}
