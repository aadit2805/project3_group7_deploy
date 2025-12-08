import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'API and Frontend Documentation',
};

/**
 * Documentation index page
 * Provides links to frontend and backend documentation
 */
export default function DocsPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Documentation</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold mb-4">Frontend Documentation</h2>
          <p className="text-gray-600 mb-4">
            Documentation for React components, hooks, utilities, and context providers.
          </p>
          <Link
            href="/docs/frontend"
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            View Frontend Docs
          </Link>
        </div>
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold mb-4">Backend Documentation</h2>
          <p className="text-gray-600 mb-4">
            Documentation for API routes, controllers, services, and middleware.
          </p>
          <Link
            href="/docs/backend"
            className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            View Backend Docs
          </Link>
        </div>
      </div>
    </div>
  );
}

