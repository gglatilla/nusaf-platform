import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import {
  Package,
  Calculator,
  FileSpreadsheet,
  Users,
  ClipboardList,
  Truck,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default async function InternalDashboard() {
  const session = await getServerSession(authOptions);

  const quickActions = [
    {
      title: "Products",
      description: "Manage product catalog",
      href: "/internal/products",
      icon: Package,
      count: "5,000+",
    },
    {
      title: "Pricing",
      description: "Configure pricing rules",
      href: "/internal/pricing",
      icon: Calculator,
    },
    {
      title: "Price Lists",
      description: "Import & manage price lists",
      href: "/internal/price-lists",
      icon: FileSpreadsheet,
    },
    {
      title: "Quotes",
      description: "View and manage quotes",
      href: "/internal/quotes",
      icon: ClipboardList,
    },
    {
      title: "Customers",
      description: "Customer accounts",
      href: "/internal/customers",
      icon: Users,
    },
    {
      title: "Job Cards",
      description: "Production tracking",
      href: "/internal/job-cards",
      icon: Truck,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user?.name?.split(" ")[0]}
        </h1>
        <p className="text-gray-600 mt-1">
          Here&apos;s an overview of your internal operations
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Quotes</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Job Cards</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Truck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Products</p>
                <p className="text-2xl font-bold">5,234</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold">R 1.2M</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-800">Action Required</h3>
              <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                <li>3 price lists pending approval</li>
                <li>5 quote requests awaiting review</li>
                <li>Exchange rate needs updating (last updated 7 days ago)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="hover:bg-gray-50 transition-colors cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {action.title}
                          {action.count && (
                            <Badge variant="secondary" className="ml-2">
                              {action.count}
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
