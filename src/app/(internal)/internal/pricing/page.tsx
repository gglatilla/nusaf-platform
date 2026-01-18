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
import { Calculator, Save, RefreshCw } from "lucide-react";

// Demo data - will be replaced with API calls
const defaultConfig = {
  exchangeRateEurZar: 20.5,
  defaultSeaFreightPercent: 12,
  defaultAirFreightPercent: 30,
  tierDiscountEndUser: 30,
  tierDiscountOem: 40,
  tierDiscountDistributor: 50,
};

const pricingRules = [
  {
    id: "1",
    category: "Conveyor Components",
    brand: "Nusaf",
    marginFactor: 0.5,
    freightType: "SEA",
    priority: 10,
  },
  {
    id: "2",
    category: "Conveyor Components",
    brand: "Tecom",
    marginFactor: 0.5,
    freightType: "AIR",
    priority: 10,
  },
  {
    id: "3",
    category: "Table Top Chain",
    brand: "Regina",
    marginFactor: 0.45,
    freightType: "SEA",
    priority: 10,
  },
  {
    id: "4",
    category: "Power Transmission",
    brand: "Chiaravalli",
    marginFactor: 0.55,
    freightType: "SEA",
    priority: 10,
  },
];

export default function PricingPage() {
  const [config, setConfig] = useState(defaultConfig);
  const [isSaving, setIsSaving] = useState(false);

  const handleConfigChange = (field: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Save to database
    await new Promise((r) => setTimeout(r, 1000));
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pricing Configuration</h1>
          <p className="text-gray-600 mt-1">
            Configure exchange rates, freight costs, and pricing rules
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* System Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
          <CardDescription>
            Global settings that affect all pricing calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="exchangeRate">EUR to ZAR Exchange Rate</Label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">R</span>
                <Input
                  id="exchangeRate"
                  type="number"
                  step="0.01"
                  value={config.exchangeRateEurZar}
                  onChange={(e) =>
                    handleConfigChange("exchangeRateEurZar", e.target.value)
                  }
                />
                <span className="text-gray-500">per EUR</span>
              </div>
              <p className="text-xs text-gray-500">Last updated: 2 days ago</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seaFreight">Sea Freight %</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="seaFreight"
                  type="number"
                  step="0.1"
                  value={config.defaultSeaFreightPercent}
                  onChange={(e) =>
                    handleConfigChange("defaultSeaFreightPercent", e.target.value)
                  }
                />
                <span className="text-gray-500">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="airFreight">Air Freight %</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="airFreight"
                  type="number"
                  step="0.1"
                  value={config.defaultAirFreightPercent}
                  onChange={(e) =>
                    handleConfigChange("defaultAirFreightPercent", e.target.value)
                  }
                />
                <span className="text-gray-500">%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Tier Discounts */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Tier Discounts</CardTitle>
          <CardDescription>
            Discount percentages off list price for each customer tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="endUser">End User Discount</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="endUser"
                  type="number"
                  step="1"
                  value={config.tierDiscountEndUser}
                  onChange={(e) =>
                    handleConfigChange("tierDiscountEndUser", e.target.value)
                  }
                />
                <span className="text-gray-500">% off list</span>
              </div>
              <p className="text-xs text-gray-500">Pays most, occasional buyers</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="oem">OEM/Reseller Discount</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="oem"
                  type="number"
                  step="1"
                  value={config.tierDiscountOem}
                  onChange={(e) =>
                    handleConfigChange("tierDiscountOem", e.target.value)
                  }
                />
                <span className="text-gray-500">% off list</span>
              </div>
              <p className="text-xs text-gray-500">
                Anchor tier - margins calculated to target here
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="distributor">Distributor Discount</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="distributor"
                  type="number"
                  step="1"
                  value={config.tierDiscountDistributor}
                  onChange={(e) =>
                    handleConfigChange("tierDiscountDistributor", e.target.value)
                  }
                />
                <span className="text-gray-500">% off list</span>
              </div>
              <p className="text-xs text-gray-500">Pays least, volume buyers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Rules */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pricing Rules</CardTitle>
            <CardDescription>
              Category and brand-specific margin factors and freight settings
            </CardDescription>
          </div>
          <Button variant="outline">
            Add Rule
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Margin Factor</TableHead>
                <TableHead>Freight</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pricingRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.category}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{rule.brand}</Badge>
                  </TableCell>
                  <TableCell>{rule.marginFactor}</TableCell>
                  <TableCell>
                    <Badge
                      variant={rule.freightType === "AIR" ? "warning" : "secondary"}
                    >
                      {rule.freightType}
                    </Badge>
                  </TableCell>
                  <TableCell>{rule.priority}</TableCell>
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

      {/* Price Calculator Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Price Calculator Preview
          </CardTitle>
          <CardDescription>
            Test pricing calculations with current settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold">Input</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Supplier Price (EUR)</Label>
                  <Input type="number" placeholder="100.00" />
                </div>
                <div className="space-y-2">
                  <Label>Price Type</Label>
                  <Select>
                    <option value="net">Net Price</option>
                    <option value="gross">Gross Price</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Freight Type</Label>
                  <Select>
                    <option value="sea">Sea Freight (12%)</option>
                    <option value="air">Air Freight (30%)</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Margin Factor</Label>
                  <Input type="number" step="0.01" placeholder="0.50" />
                </div>
              </div>
              <Button className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Calculate Prices
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Calculated Prices</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost (EUR)</span>
                  <span className="font-mono">EUR 100.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost (ZAR)</span>
                  <span className="font-mono">R 2,050.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Landed Cost</span>
                  <span className="font-mono">R 2,296.00</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="text-gray-600">List Price</span>
                  <span className="font-mono font-semibold">R 7,653.33</span>
                </div>
                <hr />
                <div className="flex justify-between text-green-600">
                  <span>End User (30% off)</span>
                  <span className="font-mono">R 5,357.33</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>OEM/Reseller (40% off)</span>
                  <span className="font-mono">R 4,592.00</span>
                </div>
                <div className="flex justify-between text-purple-600">
                  <span>Distributor (50% off)</span>
                  <span className="font-mono">R 3,826.67</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
