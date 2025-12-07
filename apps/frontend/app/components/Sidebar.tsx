'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { employeeNavigation } from '@/app/lib/navigation';
import { ChevronRight } from 'lucide-react'; // For expand/collapse icon

const Sidebar = () => {
  const pathname = usePathname();
  const [openCategories, setOpenCategories] = useState<string[]>([]);

  const toggleCategory = (categoryName: string) => {
    setOpenCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((name) => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white w-64 p-4 shadow-lg">
      <div className="text-2xl font-bold mb-6 text-center">Admin Panel</div>
      <nav className="flex-grow">
        {employeeNavigation.map((category) => (
          <div key={category.name} className="mb-4">
            <button
              onClick={() => toggleCategory(category.name)}
              className="flex items-center justify-between w-full py-2 px-3 text-lg font-semibold rounded-md hover:bg-gray-700 transition-colors duration-200"
            >
              <div className="flex items-center">
                <category.icon className="h-5 w-5 mr-3" />
                {category.name}
              </div>
              <ChevronRight
                className={`h-5 w-5 transform transition-transform duration-200 ${
                  openCategories.includes(category.name) ? 'rotate-90' : ''
                }`}
              />
            </button>
            {openCategories.includes(category.name) && (
              <ul className="mt-2 space-y-1 pl-6">
                {category.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center py-2 px-3 rounded-md transition-colors duration-200 ${
                          isActive ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700 text-gray-300'
                        }`}
                      >
                        <item.icon className="h-4 w-4 mr-3" />
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
    </div>
  );
};

export default Sidebar;
