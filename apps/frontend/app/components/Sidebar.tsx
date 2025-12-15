// apps/frontend/app/components/Sidebar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  Shirt,
  Boxes,
  FileCheck,
  FileX,
  BarChart3
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  name: string;
  icon: React.ElementType;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    name: 'Operations',
    icon: Utensils,
    items: [
      { name: 'Cashier', href: '/cashier-interface', icon: Receipt },
      { name: 'Kitchen Monitor', href: '/kitchen-monitor', icon: Utensils },
      { name: 'Prepared Orders', href: '/prepared-orders', icon: Clock },
    ],
  },
  {
    name: 'Management',
    icon: LayoutDashboard,
    items: [
      { name: 'Menu', href: '/manager', icon: Menu }, // Root of manager section
      { name: 'Inventory', href: '/manager/inventory', icon: Boxes }, // Renamed
      { name: 'Staff', href: '/manager/employees', icon: Users },
      { name: 'Promotions', href: '/manager/promotions', icon: Percent },
      { name: 'Audit Logs', href: '/manager/audit-logs', icon: ClipboardList },
    ],
  },
  {
    name: 'Reports & Analytics',
    icon: BarChart,
    items: [
      { name: 'X Report (Mid-Day)', href: '/manager/x-report', icon: FileCheck },
      { name: 'Z Report (Close Day)', href: '/manager/z-report', icon: FileX },
      { name: 'Revenue Reports', href: '/manager/revenue-reports', icon: DollarSign },
      { name: 'Order Analytics', href: '/manager/order-analytics', icon: ShoppingCart },
      { name: 'Loyalty Analytics', href: '/manager/loyalty-analytics', icon: LineChart },
      { name: 'Best Selling', href: '/manager/best-selling', icon: Package },
      { name: 'Product Usage Chart', href: '/manager/product-usage', icon: BarChart3 },
      { name: 'Restock Report', href: '/manager/restock-report', icon: Shirt }, // Renamed
      { name: 'Daily Sales', href: '/manager/daily-sales', icon: BarChart }, // Moved
    ],
  },
];

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    navGroups.reduce((acc, group) => ({ ...acc, [group.name]: true }), {})
  );

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-700 bg-white rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 text-white p-4 space-y-6 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-indigo-300">Admin Panel</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white focus:outline-none"
          >
            <X size={24} />
          </button>
        </div>

        <nav>
          {navGroups.map((group) => (
            <div key={group.name} className="mb-4">
              <button
                onClick={() => toggleGroup(group.name)}
                className="flex items-center justify-between w-full py-2 px-3 text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors duration-200"
              >
                <span className="flex items-center">
                  <group.icon size={20} className="mr-3" />
                  {group.name}
                </span>
                {expandedGroups[group.name] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {expandedGroups[group.name] && (
                <ul className="mt-2 space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`flex items-center py-2 px-3 pl-9 text-sm rounded-md transition-colors duration-200
                          ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                          onClick={() => setIsOpen(false)} // Close sidebar on mobile after click
                        >
                          <item.icon size={18} className="mr-3" />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;