"use client";

import { useState } from "react";
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
import { Upload, FileSpreadsheet, Check, Clock, AlertCircle } from "lucide-react";

// Demo price lists
const demoPriceLists = [
  {
    id: "1",
    name: "Tecom 2026 Q1",
    supplier: "Tecom",
    category: "Conveyor Components",
    itemCount: 1250,
    status: "APPROVED",
    effectiveDate: "2026-01-01",
    uploadedAt: "2025-12-15",
  },
  {
    id: "2",
    name: "Regina Chain 2026",
    supplier: "Regina",
    category: "Table Top Chain",
    itemCount: 890,
    status: "PENDING_APPROVAL",
    effectiveDate: "2026-02-01",
    uploadedAt: "2026-01-10",
  },
  {
    id: "3",
    name: "Chiaravalli PTT 2026",
    supplier: "Chiaravalli",
    category: "Power Transmission",
    itemCount: 2100,
    status: "DRAFT",
    effectiveDate: null,
    uploadedAt: "2026-01-15",
  },
];

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "success" | "warning" }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PENDING_APPROVAL: { label: "Pending Approval", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  SUPERSEDED: { label: "Superseded", variant: "default" },
};

export default function PriceListsPage() {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Handle file drop
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      console.log("Files dropped:", files);
      // TODO: Process files
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Price Lists</h1>
          <p className="text-gray-600 mt-1">
            Import and manage supplier price lists
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="pt-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Import Price List
            </h3>
            <p className="text-gray-500 mb-4">
              Drag and drop Excel or CSV files here, or click to browse
            </p>
            <div className="flex justify-center gap-4">
              <Button>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Select File
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Supported formats: .xlsx, .xls, .csv
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-gray-500">Active Price Lists</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-gray-500">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">4,240</p>
                <p className="text-sm text-gray-500">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">45</p>
                <p className="text-sm text-gray-500">SKU Conversions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Lists Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Price Lists</CardTitle>
          <CardDescription>
            View and manage imported price lists
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoPriceLists.map((list) => {
                const status = statusConfig[list.status];
                return (
                  <TableRow key={list.id}>
                    <TableCell className="font-medium">{list.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{list.supplier}</Badge>
                    </TableCell>
                    <TableCell>{list.category}</TableCell>
                    <TableCell>{list.itemCount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {list.effectiveDate || "-"}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {list.uploadedAt}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                        {list.status === "PENDING_APPROVAL" && (
                          <Button variant="ghost" size="sm" className="text-green-600">
                            Approve
                          </Button>
                        )}
                      </div>
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
