'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { EmployeeContext } from '@/app/context/EmployeeContext';
import ToastProvider from '@/app/context/ToastContext';
import Sidebar from '@/app/components/Sidebar';

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
        const userData = await res.json();
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
            <header className="h-16 bg-white border-b px-4 flex items-center justify-end lg:justify-between">
              <h1 className="text-xl font-bold hidden lg:block">Panda Express POS System</h1>
              <div className="flex items-center">
                <div className="text-sm text-gray-500 mr-4">
                  Signed in as <span className="font-semibold">{user?.name || user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2 text-left rounded-md text-red-600 hover:bg-red-100 button-press transition-all duration-200"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </button>
              </div>
            </header>

            <main className="flex-1 p-4 md:p-8 overflow-y-auto animate-fade-in">{children}</main>
          </div>
        </div>
      </ToastProvider>
    </EmployeeContext.Provider>
  );
};

export default EmployeeLayout;
