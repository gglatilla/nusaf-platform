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
  Select,
} from "@/components/ui";
import { Search, Plus, Filter, Download } from "lucide-react";

// Demo products - will be replaced with API data
const demoProducts = [
  {
    id: "1",
    nusafSku: "1200-80271",
    supplierSku: "C020080271",
    name: "Connection joint for round tubes",
    category: "Conveyor Components",
    brand: "Nusaf",
    productType: "IMPORTED",
    listPrice: 456.78,
    isActive: true,
  },
  {
    id: "2",
    nusafSku: "UP880MRGKD/000",
    supplierSku: "UP880MRGKD/000",
    name: "Plastic Table Top Chain 880M Series",
    category: "Table Top Chain",
    brand: "Regina",
    productType: "IMPORTED",
    listPrice: 1234.56,
    isActive: true,
  },
  {
    id: "3",
    nusafSku: "NC-2024-001",
    supplierSku: null,
    name: "Custom Machined Bracket",
    category: "Nusaf Engineering",
    brand: "Nusaf",
    productType: "MANUFACTURED",
    listPrice: 890.0,
    isActive: true,
  },
  {
    id: "4",
    nusafSku: "600AUP0085",
    supplierSku: "600AUP0085",
    name: "600 Series Modular Belt 85mm",
    category: "Modular Chain",
    brand: "Regina",
    productType: "IMPORTED",
    listPrice: 2345.67,
    isActive: true,
  },
  {
    id: "5",
    nusafSku: "GBX-CHV-50",
    supplierSku: "CHV-050",
    name: "Gearbox 50:1 Ratio",
    category: "Gearboxes & Motors",
    brand: "Chiaravalli",
    productType: "IMPORTED",
    listPrice: 5678.9,
    isActive: true,
  },
];

const productTypeColors: Record<string, "default" | "secondary" | "success"> = {
  IMPORTED: "default",
  MANUFACTURED: "success",
  ASSEMBLED: "secondary",
};

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredProducts = demoProducts.filter((product) => {
    const matchesSearch =
      product.nusafSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.supplierSku?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(demoProducts.map((p) => p.category)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">
            Manage your product catalog (5,000+ SKUs)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by SKU, name, or supplier code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-64"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nusaf SKU</TableHead>
                <TableHead>Supplier SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">List Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono font-medium">
                    {product.nusafSku}
                  </TableCell>
                  <TableCell className="font-mono text-gray-500">
                    {product.supplierSku || "-"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {product.name}
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.brand}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={productTypeColors[product.productType]}>
                      {product.productType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    R {product.listPrice.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? "success" : "secondary"}>
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No products found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          Showing {filteredProducts.length} of {demoProducts.length} products
        </p>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            Previous
          </Button>
          <Button variant="outline" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
