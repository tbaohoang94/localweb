"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  label: string;
  right?: boolean;
  mono?: boolean;
  bold?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

interface DataTableProps<T extends Record<string, any>> {
  columns: Column<T>[];
  rows: T[];
  sortKey?: string;
  onSort?: (key: string) => void;
  summaryRow?: Record<string, any>;
  avgRow?: Record<string, any>;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  sortKey,
  onSort,
  summaryRow,
  avgRow,
}: DataTableProps<T>) {
  if (!rows.length) {
    return (
      <div className="text-center py-12">
        <div className="w-10 h-10 rounded-xl bg-muted mx-auto mb-3 flex items-center justify-center">
          <span className="text-muted-foreground text-lg">&empty;</span>
        </div>
        <p className="text-sm font-medium text-muted-foreground">Keine Daten</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Passe die Filter an.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                onClick={() => onSort?.(col.key)}
                className={cn(
                  "text-xs font-semibold text-muted-foreground whitespace-nowrap",
                  col.right && "text-right",
                  onSort && "cursor-pointer hover:text-foreground transition-colors"
                )}
              >
                {col.label}
                {sortKey === col.key && (
                  <span className="text-primary ml-1">&darr;</span>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i} className="transition-colors">
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  className={cn(
                    "whitespace-nowrap py-3",
                    col.right && "text-right",
                    col.bold ? "font-semibold" : "text-muted-foreground",
                    col.mono && "tabnum"
                  )}
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : row[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {summaryRow && (
            <TableRow className="border-t-2 border-foreground/20 bg-muted/30 hover:bg-muted/30">
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  className={cn(
                    "whitespace-nowrap py-3 font-semibold",
                    col.right && "text-right",
                    col.mono && "tabnum"
                  )}
                >
                  {summaryRow[col.key] !== undefined
                    ? col.render
                      ? col.render(summaryRow[col.key], summaryRow as T)
                      : summaryRow[col.key]
                    : ""}
                </TableCell>
              ))}
            </TableRow>
          )}
          {avgRow && (
            <TableRow className="bg-muted/15 hover:bg-muted/15">
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  className={cn(
                    "whitespace-nowrap py-3 font-medium text-muted-foreground italic",
                    col.right && "text-right",
                    col.mono && "tabnum"
                  )}
                >
                  {avgRow[col.key] !== undefined
                    ? col.render
                      ? col.render(avgRow[col.key], avgRow as T)
                      : avgRow[col.key]
                    : ""}
                </TableCell>
              ))}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
