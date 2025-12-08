'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { EmployeeContext } from '@/app/context/EmployeeContext';
import ToastProvider from '@/app/context/ToastContext';
import Sidebar from '@/app/components/Sidebar';
import { safeJsonParse } from '@/app/utils/jsonHelper';

interface User {
  id: number;
  email: string | null;
  name: string | null;
  role: string | null;
}

const EmployeeLayout = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/user');
        if (!res.ok) throw new Error('Not authenticated');
        const userData = await safeJsonParse(res);
        if (!['CASHIER', 'MANAGER'].includes(userData.role)) {
          throw new Error('Access denied');
        }
        setUser(userData);
      } catch (e) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <EmployeeContext.Provider value={{ user }}>
      <ToastProvider>
        <div className="flex min-h-screen bg-gray-100">
          <Sidebar />

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <header className="min-h-16 bg-white border-b px-4 py-2 sm:py-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <h1 className="text-lg sm:text-xl font-bold">Panda Express POS System</h1>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0 w-full sm:w-auto">
                <div className="text-xs sm:text-sm text-gray-500 sm:mr-4">
                  Signed in as <span className="font-semibold">{user?.name || user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2 text-left rounded-md text-red-600 hover:bg-red-100 button-press transition-all duration-200 min-h-[44px] text-sm sm:text-base"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </button>
              </div>
            </header>

            <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto animate-fade-in">
              {children}
            </main>
          </div>
        </div>
      </ToastProvider>
    </EmployeeContext.Provider>
  );
};

export default EmployeeLayout;
