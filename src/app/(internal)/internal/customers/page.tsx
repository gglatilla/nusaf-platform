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
} from "@/components/ui";
import { Search, Plus, Filter } from "lucide-react";

const demoCustomers = [
  {
    id: "1",
    companyName: "ABC Manufacturing",
    contactName: "John Smith",
    email: "john@abcmfg.co.za",
    tier: "OEM_RESELLER",
    isApproved: true,
    quoteCount: 15,
    orderCount: 8,
  },
  {
    id: "2",
    companyName: "DEF Industries",
    contactName: "Sarah Johnson",
    email: "sarah@defindustries.co.za",
    tier: "DISTRIBUTOR",
    isApproved: true,
    quoteCount: 42,
    orderCount: 28,
  },
  {
    id: "3",
    companyName: "New Company Ltd",
    contactName: "Mike Brown",
    email: "mike@newco.co.za",
    tier: "END_USER",
    isApproved: false,
    quoteCount: 0,
    orderCount: 0,
  },
];

const tierConfig: Record<string, { label: string; variant: "default" | "secondary" | "success" }> = {
  END_USER: { label: "End User", variant: "secondary" },
  OEM_RESELLER: { label: "OEM/Reseller", variant: "default" },
  DISTRIBUTOR: { label: "Distributor", variant: "success" },
};

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">
            Manage customer accounts and approvals
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers..."
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
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Quotes</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoCustomers.map((customer) => {
                const tier = tierConfig[customer.tier];
                return (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.companyName}</p>
                        <p className="text-sm text-gray-500">{customer.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{customer.contactName}</TableCell>
                    <TableCell>
                      <Badge variant={tier.variant}>{tier.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.isApproved ? "success" : "warning"}>
                        {customer.isApproved ? "Approved" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{customer.quoteCount}</TableCell>
                    <TableCell className="text-right">{customer.orderCount}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                        {!customer.isApproved && (
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
