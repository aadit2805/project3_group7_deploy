import {
  Users,
  Utensils,
  ClipboardList,
  LineChart,
  ShoppingCart,
  LayoutDashboard,
  Megaphone,
  ScrollText,
  Warehouse,
  CookingPot,
  Receipt,
  Clock,
  BarChart3,
  Flame,
  UserCheck,
  Building, // Changed from BuildingStore
  DollarSign,
  PieChart,
} from 'lucide-react';

export const employeeNavigation = [
  {
    name: 'Operations',
    icon: Building, // Changed from BuildingStore
    items: [
      { name: 'Cashier Interface', href: '/cashier-interface', icon: ShoppingCart, allowedRoles: ['CASHIER', 'MANAGER'] },
      { name: 'Kitchen Monitor', href: '/kitchen-monitor', icon: CookingPot, allowedRoles: ['CASHIER', 'MANAGER'] },
      { name: 'Prepared Orders', href: '/prepared-orders', icon: Clock, allowedRoles: ['CASHIER', 'MANAGER'] },
    ],
  },
  {
    name: 'Management',
    icon: Users,
    items: [
      { name: 'Menu Management', href: '/manager', icon: Utensils, allowedRoles: ['MANAGER'] },
      { name: 'Inventory Items', href: '/inventory-manager', icon: Warehouse, allowedRoles: ['MANAGER'] },
      { name: 'Staff Management', href: '/manager/employees', icon: UserCheck, allowedRoles: ['MANAGER'] },
      { name: 'Audit Logs', href: '/manager/audit-logs', icon: ScrollText, allowedRoles: ['MANAGER'] },
      { name: 'Promotions', href: '/manager/promotions', icon: Megaphone, allowedRoles: ['MANAGER'] },
    ],
  },
  {
    name: 'Reports & Analytics',
    icon: LineChart,
    items: [
      { name: 'Revenue Reports', href: '/manager/revenue-reports', icon: DollarSign, allowedRoles: ['MANAGER'] },
      { name: 'Order Analytics', href: '/manager/order-analytics', icon: PieChart, allowedRoles: ['MANAGER'] },
      { name: 'Loyalty Analytics', href: '/manager/loyalty-analytics', icon: UserCheck, allowedRoles: ['MANAGER'] },
      { name: 'Best Selling Items', href: '/manager/best-selling', icon: Flame, allowedRoles: ['MANAGER'] },
      { name: 'Restock Report', href: '/restock-report', icon: Receipt, allowedRoles: ['MANAGER'] },
      { name: 'Daily Sales', href: '/daily-sales', icon: LineChart, allowedRoles: ['CASHIER', 'MANAGER'] },
    ],
  },
];
