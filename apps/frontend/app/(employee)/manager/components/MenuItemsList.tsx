'use client';

import { useEffect, useState } from 'react';

import { useToast } from '@/app/hooks/useToast';

// Common allergens list
const COMMON_ALLERGENS = [
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Dairy',
  'Eggs',
  'Fish',
  'Shellfish',
  'Soy',
  'Wheat',
  'Sesame',
  'Gluten',
];

// Allergen Editor Component
function AllergenEditor({
  allergens,
  allergenInfo,
  onChange,
}: {
  allergens: string[];
  allergenInfo: string;
  onChange: (allergens: string[], allergenInfo: string) => void;
}) {
  const [customAllergen, setCustomAllergen] = useState('');

  const handleToggleAllergen = (allergen: string) => {
    const newAllergens = allergens.includes(allergen)
      ? allergens.filter((a) => a !== allergen)
      : [...allergens, allergen];
    
    // Auto-generate allergen_info
    const newInfo = newAllergens.length > 0 
      ? `Contains: ${newAllergens.join(', ')}` 
      : '';
    
    onChange(newAllergens, newInfo);
  };

  const handleAddCustomAllergen = () => {
    if (customAllergen.trim() && !allergens.includes(customAllergen.trim())) {
      const newAllergens = [...allergens, customAllergen.trim()];
      const newInfo = newAllergens.length > 0 
        ? `Contains: ${newAllergens.join(', ')}` 
        : '';
      onChange(newAllergens, newInfo);
      setCustomAllergen('');
    }
  };

  const handleInfoChange = (info: string) => {
    onChange(allergens, info);
  };

  return (
    <div className="space-y-2 max-w-md">
      <div className="text-xs font-semibold text-gray-700 mb-2">Select Allergens:</div>
      <div className="flex flex-wrap gap-2 mb-2">
        {COMMON_ALLERGENS.map((allergen) => (
          <label
            key={allergen}
            className="flex items-center space-x-1 text-xs cursor-pointer"
          >
            <input
              type="checkbox"
              checked={allergens.includes(allergen)}
              onChange={() => handleToggleAllergen(allergen)}
              className="h-3 w-3 text-blue-600 rounded"
            />
            <span className="text-gray-700">{allergen}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={customAllergen}
          onChange={(e) => setCustomAllergen(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCustomAllergen();
            }
          }}
          placeholder="Add custom allergen"
          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
        />
        <button
          type="button"
          onClick={handleAddCustomAllergen}
          className="px-2 py-1 text-xs bg-primary text-white rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>
      {allergens.length > 0 && (
        <div className="text-xs text-gray-600">
          Selected: {allergens.join(', ')}
        </div>
      )}
      <div className="mt-2">
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Allergen Info (optional):
        </label>
        <textarea
          value={allergenInfo}
          onChange={(e) => handleInfoChange(e.target.value)}
          placeholder="Additional allergen information..."
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded resize-none"
          rows={2}
        />
      </div>
    </div>
  );
}

interface MenuItem {
  menu_item_id: number;
  name: string;
  upcharge: number;
  is_available: boolean;
  item_type: string;
  availability_start_time?: string | null;
  availability_end_time?: string | null;
  allergens?: string | null;
  allergen_info?: string | null;
}

interface MenuItemsListProps {
  filter: string | null;
}

export default function MenuItemsList({ filter }: MenuItemsListProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Omit<Partial<MenuItem>, 'allergens'> & { allergens?: string[] }>({});
  const { addToast } = useToast();

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const backendUrl = '';
      const response = await fetch(`${backendUrl}/api/menu-items`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }

      const data = await response.json();
      setMenuItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };



  const handleEdit = (item: MenuItem) => {
    setEditingId(item.menu_item_id);
    // Convert time from HH:mm:ss to HH:mm format for time input
    const formatTimeForInput = (time: string | null | undefined) => {
      if (!time) return '';
      // If time is in HH:mm:ss format, convert to HH:mm
      return time.substring(0, 5);
    };
    
    // Parse allergens JSON string to array
    let allergensArray: string[] = [];
    try {
      if (item.allergens) {
        allergensArray = JSON.parse(item.allergens);
      }
    } catch {
      allergensArray = [];
    }
    
    setEditForm({
      name: item.name,
      upcharge: item.upcharge,
      is_available: item.is_available,
      item_type: item.item_type,
      availability_start_time: formatTimeForInput(item.availability_start_time),
      availability_end_time: formatTimeForInput(item.availability_end_time),
      allergens: allergensArray,
      allergen_info: item.allergen_info || '',
    });
  };

  const handleSaveEdit = async (id: number) => {
    try {
      const backendUrl = '';
      const response = await fetch(`${backendUrl}/api/menu-items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || 'Failed to update menu item');
      }

      setEditingId(null);
      setEditForm({});
      fetchMenuItems();
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : 'Failed to update menu item',
        type: 'error',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Helper function to format time for display
  const formatTime = (time: string | null | undefined) => {
    if (!time) return '';
    return time.substring(0, 5); // Extract HH:mm from HH:mm:ss
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      const backendUrl = '';
      const response = await fetch(`${backendUrl}/api/menu-items/${item.menu_item_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ is_available: !item.is_available }),
      });

      if (!response.ok) {
        throw new Error('Failed to update availability');
      }

      fetchMenuItems();
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : 'Failed to update availability',
        type: 'error',
      });
    }
  };

  const filteredMenuItems = filter
    ? menuItems.filter((item) => item.item_type === filter)
    : menuItems;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading menu items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Menu Items</h2>
        <button
          onClick={fetchMenuItems}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Refresh
        </button>
      </div>

      {filteredMenuItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No menu items found for this filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upcharge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Availability Window
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allergens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMenuItems.map((item) => (
                <tr key={item.menu_item_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.menu_item_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingId === item.menu_item_id ? (
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      item.name
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === item.menu_item_id ? (
                      <select
                        value={editForm.item_type || ''}
                        onChange={(e) => setEditForm({ ...editForm, item_type: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="entree">Entree</option>
                        <option value="side">Side</option>
                        <option value="drink">Drink</option>
                      </select>
                    ) : (
                      <span className="capitalize">{item.item_type}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === item.menu_item_id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.upcharge || 0}
                        onChange={(e) =>
                          setEditForm({ ...editForm, upcharge: parseFloat(e.target.value) })
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      `$${item.upcharge.toFixed(2)}`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingId === item.menu_item_id ? (
                      <input
                        type="checkbox"
                        checked={editForm.is_available ?? false}
                        onChange={(e) =>
                          setEditForm({ ...editForm, is_available: e.target.checked })
                        }
                        className="h-4 w-4 text-blue-600"
                      />
                    ) : (
                      <button
                        onClick={() => toggleAvailability(item)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.is_available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === item.menu_item_id ? (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Start:</label>
                          <input
                            type="time"
                            value={editForm.availability_start_time || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, availability_start_time: e.target.value })
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">End:</label>
                          <input
                            type="time"
                            value={editForm.availability_end_time || ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, availability_end_time: e.target.value })
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </div>
                        <button
                          onClick={() =>
                            setEditForm({
                              ...editForm,
                              availability_start_time: '',
                              availability_end_time: '',
                            })
                          }
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs">
                        {item.availability_start_time && item.availability_end_time ? (
                          <span>
                            {item.availability_start_time.substring(0, 5)} -{' '}
                            {item.availability_end_time.substring(0, 5)}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">No time restriction</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {editingId === item.menu_item_id ? (
                      <AllergenEditor
                        allergens={editForm.allergens as string[] || []}
                        allergenInfo={editForm.allergen_info as string || ''}
                        onChange={(allergens, allergenInfo) => {
                          setEditForm({ ...editForm, allergens, allergen_info: allergenInfo });
                        }}
                      />
                    ) : (
                      <div className="max-w-xs">
                        {item.allergen_info ? (
                          <div className="text-xs">
                            <div className="font-semibold text-gray-700 mb-1">Allergens:</div>
                            <div className="text-gray-600">{item.allergen_info}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">No allergen info</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingId === item.menu_item_id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(item.menu_item_id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

