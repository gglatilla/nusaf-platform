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
  Label,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Select,
} from "@/components/ui";
import { Save, Plus, Trash2 } from "lucide-react";

// Demo machine rates
const demoMachineRates = [
  {
    id: "1",
    machineType: "CNC Router",
    rateType: "HOURLY",
    rateAmount: 850,
    effectiveDate: "2026-01-01",
  },
  {
    id: "2",
    machineType: "Milling Machine",
    rateType: "HOURLY",
    rateAmount: 650,
    effectiveDate: "2026-01-01",
  },
  {
    id: "3",
    machineType: "Lathe",
    rateType: "HOURLY",
    rateAmount: 550,
    effectiveDate: "2026-01-01",
  },
  {
    id: "4",
    machineType: "Modular Chain Assembly",
    rateType: "PER_METER",
    rateAmount: 45,
    effectiveDate: "2026-01-01",
  },
  {
    id: "5",
    machineType: "Table Top Assembly",
    rateType: "PER_METER",
    rateAmount: 38,
    effectiveDate: "2026-01-01",
  },
  {
    id: "6",
    machineType: "General Assembly",
    rateType: "PER_EACH",
    rateAmount: 25,
    effectiveDate: "2026-01-01",
  },
];

// Demo suppliers
const demoSuppliers = [
  {
    id: "1",
    name: "Tecom Srl",
    code: "TECOM",
    currency: "EUR",
    defaultFreightType: "AIR",
    isActive: true,
  },
  {
    id: "2",
    name: "Regina Catene Calibrate",
    code: "REGINA",
    currency: "EUR",
    defaultFreightType: "SEA",
    isActive: true,
  },
  {
    id: "3",
    name: "Chiaravalli Group",
    code: "CHIARA",
    currency: "EUR",
    defaultFreightType: "SEA",
    isActive: true,
  },
];

const rateTypeLabels: Record<string, string> = {
  HOURLY: "R/hour",
  PER_METER: "R/meter",
  PER_EACH: "R/each",
};

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage system configuration, suppliers, and machine rates
        </p>
      </div>

      {/* Suppliers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Suppliers</CardTitle>
            <CardDescription>
              Manage supplier information and default settings
            </CardDescription>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Default Freight</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell className="font-mono">{supplier.code}</TableCell>
                  <TableCell>{supplier.currency}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        supplier.defaultFreightType === "AIR"
                          ? "warning"
                          : "secondary"
                      }
                    >
                      {supplier.defaultFreightType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={supplier.isActive ? "success" : "secondary"}>
                      {supplier.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Machine Rates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Machine & Labor Rates</CardTitle>
            <CardDescription>
              Configure hourly rates for machines and labor costs
            </CardDescription>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Rate
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Machine/Labor Type</TableHead>
                <TableHead>Rate Type</TableHead>
                <TableHead className="text-right">Rate Amount</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoMachineRates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell className="font-medium">
                    {rate.machineType}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {rateTypeLabels[rate.rateType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    R {rate.rateAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{rate.effectiveDate}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Product Categories</CardTitle>
            <CardDescription>
              Manage product categories and associated brands
            </CardDescription>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Conveyor Components", brands: ["Nusaf", "Tecom"] },
              { name: "Plastic Table Top Chain", brands: ["Nusaf", "Regina", "Tecom"] },
              { name: "Modular Chain", brands: ["Nusaf", "Regina"] },
              { name: "SS Table Top Chain", brands: ["Regina"] },
              { name: "Gearboxes & Motors", brands: ["Chiaravalli"] },
              { name: "Power Transmission", brands: ["Chiaravalli"] },
              { name: "Bends", brands: ["Nusaf"] },
              { name: "Wear Strips", brands: ["Nusaf", "Tecom"] },
              { name: "Moulded Sprockets", brands: ["Nusaf", "Regina", "Tecom"] },
              { name: "Machined Sprockets", brands: ["Nusaf", "Regina"] },
              { name: "Nusaf Engineering", brands: ["Nusaf"] },
            ].map((category, i) => (
              <Card key={i} className="bg-gray-50">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{category.name}</h4>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {category.brands.map((brand) => (
                          <Badge key={brand} variant="outline" className="text-xs">
                            {brand}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
