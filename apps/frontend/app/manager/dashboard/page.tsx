import { auth, signOut } from "../../../auth";
import { redirect } from "next/navigation";

export default async function ManagerDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/manager/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{session.user.name}</p>
                <p className="text-xs text-gray-500">{session.user.email}</p>
              </div>
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="w-10 h-10 rounded-full"
                />
              )}
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Welcome back, {session.user.name?.split(" ")[0]}!
          </h2>
          <p className="text-gray-600">
            Here&apos;s what&apos;s happening with your restaurant today.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Sales Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Today&apos;s Sales</h3>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">$0.00</p>
            <p className="text-sm text-gray-500 mt-2">+0% from yesterday</p>
          </div>

          {/* Orders Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Orders</h3>
              <span className="text-2xl">📋</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-500 mt-2">orders today</p>
          </div>

          {/* Inventory Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Inventory</h3>
              <span className="text-2xl">📦</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">-</p>
            <p className="text-sm text-gray-500 mt-2">items need reorder</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left">
              <span className="text-2xl mb-2 block">📊</span>
              <span className="font-medium text-gray-700">View Reports</span>
            </button>
            <button className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left">
              <span className="text-2xl mb-2 block">🍔</span>
              <span className="font-medium text-gray-700">Manage Menu</span>
            </button>
            <button className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-left">
              <span className="text-2xl mb-2 block">👥</span>
              <span className="font-medium text-gray-700">Staff Management</span>
            </button>
            <button className="p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-left">
              <span className="text-2xl mb-2 block">⚙️</span>
              <span className="font-medium text-gray-700">Settings</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Activity</h3>
          <p className="text-gray-500 text-center py-8">No recent activity to display</p>
        </div>
      </main>
    </div>
  );
}

