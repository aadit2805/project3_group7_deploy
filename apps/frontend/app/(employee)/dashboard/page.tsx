'use client';

import { useEmployee } from '@/app/context/EmployeeContext';
import Link from 'next/link';
import {
  Package,
  Receipt,
  Utensils,
  LayoutDashboard,
  Users,
  Percent,
  ClipboardList,
  BarChart,
  ShoppingCart,
  DollarSign,
  LineChart,
  Menu,
  Clock,
  Shirt,
  Boxes,
  BriefcaseBusiness,
  TrendingUp,
} from 'lucide-react';

/**
 * Dashboard card component - displays a clickable card linking to a feature
 */
interface DashboardCardProps {
  href: string;
  title: string;
  description: string;
  icon: React.ElementType;
  index: number;
}

const DashboardCard = ({ href, title, description, icon: Icon, index }: DashboardCardProps) => (
  <Link
    href={href}
    className={`block rounded-lg border border-gray-200 bg-white p-6 hover:shadow-lg hover-scale transition-all duration-200 animate-scale-in animate-stagger-${Math.min((index % 4) + 1, 4)} flex flex-col items-center text-center`}
  >
    <Icon className="h-10 w-10 text-indigo-600 mb-4" />
    <h2 className="mb-2 text-xl font-semibold text-gray-800">
      {title}
    </h2>
    <p className="text-gray-600">
      {description}
    </p>
  </Link>
);

/**
 * Employee Dashboard page - displays available features based on user role
 * Shows different cards for MANAGER vs CASHIER roles
 */
interface DashboardNavGroup {
  name: string;
  icon: React.ElementType;
  role: 'CASHIER' | 'MANAGER' | 'ALL';
  items: Array<{
    href: string;
    title: string;
    description: string;
    icon: React.ElementType;
    role: 'CASHIER' | 'MANAGER' | 'ALL';
  }>;
}

const dashboardNavGroups: DashboardNavGroup[] = [
  {
    name: 'Operations',
    icon: Utensils,
    role: 'ALL',
    items: [
      { href: "/cashier-interface", title: "Cashier Interface", description: "Process customer orders efficiently.", icon: Receipt, role: 'CASHIER' },
      { href: "/kitchen-monitor", title: "Kitchen Monitor", description: "Monitor and manage incoming orders in real-time.", icon: Utensils, role: 'CASHIER' },
      { href: "/prepared-orders", title: "Prepared Orders", description: "View and mark prepared orders as addressed.", icon: Clock, role: 'ALL' },
    ],
  },
  {
    name: 'Management',
    icon: BriefcaseBusiness,
    role: 'MANAGER',
    items: [
      { href: "/manager", title: "Menu Management", description: "Add, edit, or remove menu items and categories.", icon: Menu, role: 'MANAGER' },
      { href: "/manager/inventory", title: "Inventory Management", description: "Track and manage food and non-food inventory.", icon: Boxes, role: 'MANAGER' },
      { href: "/manager/employees", title: "Staff Management", description: "Manage employee roles, schedules, and access.", icon: Users, role: 'MANAGER' },
      { href: "/manager/promotions", title: "Promotions & Discounts", description: "Create and manage active promotions and offers.", icon: Percent, role: 'MANAGER' },
      { href: "/manager/audit-logs", title: "Audit Logs", description: "Review system activities and user actions for compliance.", icon: ClipboardList, role: 'MANAGER' },
    ],
  },
  {
    name: 'Reports & Analytics',
    icon: TrendingUp,
    role: 'MANAGER',
    items: [
      { href: "/manager/revenue-reports", title: "Revenue Reports", description: "Access detailed daily, weekly, and monthly revenue data.", icon: DollarSign, role: 'MANAGER' },
      { href: "/manager/order-analytics", title: "Order Analytics", description: "Analyze order patterns, completion times, and customer preferences.", icon: ShoppingCart, role: 'MANAGER' },
      { href: "/manager/loyalty-analytics", title: "Loyalty Analytics", description: "Gain insights into customer loyalty programs and rewards.", icon: LineChart, role: 'MANAGER' },
      { href: "/manager/best-selling", title: "Best-Selling Items", description: "Identify top-performing menu items and adjust offerings.", icon: Package, role: 'MANAGER' },
      { href: "/manager/restock-report", title: "Restock Report", description: "Generate reports for items needing to be restocked based on current inventory.", icon: Shirt, role: 'MANAGER' },
      { href: "/manager/daily-sales", title: "Daily Sales Summary", description: "View a summary of daily sales and transactions.", icon: BarChart, role: 'MANAGER' },
    ],
  },
];

export default function DashboardPage() {
  const { user } = useEmployee();

  return (
    <div className="animate-fade-in">
      <div className="mb-8 animate-slide-in-down">
        <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.name || user?.email}</h1>
        <p className="text-gray-600 mt-1 animate-fade-in animate-stagger-1">
          Select an action to get started.
        </p>
      </div>

      <div className="space-y-12">
        {dashboardNavGroups.map((group) => {
          const filteredItems = group.items.filter(item =>
            item.role === 'ALL' || item.role === user?.role
          );

          if (filteredItems.length === 0 && group.role !== user?.role && group.role !== 'ALL') {
            return null;
          }
          if (group.role === 'MANAGER' && user?.role !== 'MANAGER') {
            return null;
          }
          if (group.role === 'CASHIER' && user?.role !== 'CASHIER') {
            return null;
          }

          return (
            <div key={group.name}>
              <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center">
                <group.icon className="h-8 w-8 text-indigo-600 mr-3" />
                {group.name}
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredItems.map((card, index) => (
                  <DashboardCard
                    key={card.href}
                    href={card.href}
                    title={card.title}
                    description={card.description}
                    icon={card.icon}
                    index={index}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
