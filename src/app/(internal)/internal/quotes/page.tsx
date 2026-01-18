"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
} from "@/components/ui";
import { Search, Plus, Filter } from "lucide-react";

const demoQuotes = [
  {
    id: "1",
    quoteNumber: "Q202601-ABC1",
    customer: "ABC Manufacturing",
    status: "PENDING_REVIEW",
    total: 45678.9,
    itemCount: 12,
    createdAt: "2026-01-15",
    validUntil: "2026-02-15",
  },
  {
    id: "2",
    quoteNumber: "Q202601-DEF2",
    customer: "DEF Industries",
    status: "SENT",
    total: 23456.78,
    itemCount: 8,
    createdAt: "2026-01-14",
    validUntil: "2026-02-14",
  },
  {
    id: "3",
    quoteNumber: "Q202601-GHI3",
    customer: "GHI Bottling Co",
    status: "ACCEPTED",
    total: 89012.34,
    itemCount: 25,
    createdAt: "2026-01-10",
    validUntil: "2026-02-10",
  },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PENDING_REVIEW: { label: "Pending Review", variant: "warning" },
  SENT: { label: "Sent", variant: "default" },
  ACCEPTED: { label: "Accepted", variant: "success" },
  EXPIRED: { label: "Expired", variant: "destructive" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

export default function QuotesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quotes</h1>
          <p className="text-gray-600 mt-1">
            Manage customer quotes and requests
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Quote
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search quotes..."
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoQuotes.map((quote) => {
                const status = statusConfig[quote.status];
                return (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono font-medium">
                      {quote.quoteNumber}
                    </TableCell>
                    <TableCell>{quote.customer}</TableCell>
                    <TableCell>{quote.itemCount}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      R {quote.total.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-gray-500">{quote.createdAt}</TableCell>
                    <TableCell className="text-gray-500">{quote.validUntil}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
