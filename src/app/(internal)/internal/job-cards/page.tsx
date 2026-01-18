"use client";

import {
  Card,
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
  Select,
} from "@/components/ui";
import { Search, Plus, Filter } from "lucide-react";

const demoJobCards = [
  {
    id: "1",
    jobNumber: "J2026-AB12",
    customerName: "ABC Manufacturing",
    poNumber: "PO-2026-001",
    location: "SANDTON",
    status: "IN_PRODUCTION",
    itemCount: 5,
    requiredBy: "2026-01-25",
    createdAt: "2026-01-15",
  },
  {
    id: "2",
    jobNumber: "J2026-CD34",
    customerName: "DEF Industries",
    poNumber: "PO-2026-045",
    location: "CAPE_TOWN",
    status: "PICKED",
    itemCount: 3,
    requiredBy: "2026-01-22",
    createdAt: "2026-01-14",
  },
  {
    id: "3",
    jobNumber: "J2026-EF56",
    customerName: "GHI Bottling Co",
    poNumber: "PO-2026-089",
    location: "SANDTON",
    status: "COMPLETE",
    itemCount: 8,
    requiredBy: "2026-01-20",
    createdAt: "2026-01-10",
  },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" }> = {
  CREATED: { label: "Created", variant: "secondary" },
  PICKED: { label: "Picked", variant: "default" },
  IN_PRODUCTION: { label: "In Production", variant: "warning" },
  QC: { label: "QC", variant: "warning" },
  COMPLETE: { label: "Complete", variant: "success" },
  SHIPPED: { label: "Shipped", variant: "success" },
  DELIVERED: { label: "Delivered", variant: "success" },
};

const locationConfig: Record<string, string> = {
  SANDTON: "Sandton",
  CAPE_TOWN: "Cape Town",
};

export default function JobCardsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Cards</h1>
          <p className="text-gray-600 mt-1">
            Track production and delivery status
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Job Card
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">3</p>
            <p className="text-sm text-gray-500">In Production</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">2</p>
            <p className="text-sm text-gray-500">Awaiting Pickup</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">5</p>
            <p className="text-sm text-gray-500">Ready for Dispatch</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">12</p>
            <p className="text-sm text-gray-500">Completed This Week</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search job cards..."
                className="pl-10"
              />
            </div>
            <Select className="w-40">
              <option value="all">All Locations</option>
              <option value="SANDTON">Sandton</option>
              <option value="CAPE_TOWN">Cape Town</option>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>PO #</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Required By</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoJobCards.map((job) => {
                const status = statusConfig[job.status];
                return (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono font-medium">
                      {job.jobNumber}
                    </TableCell>
                    <TableCell>{job.customerName}</TableCell>
                    <TableCell className="font-mono text-gray-500">
                      {job.poNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {locationConfig[job.location]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>{job.itemCount}</TableCell>
                    <TableCell className="text-gray-500">{job.requiredBy}</TableCell>
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
