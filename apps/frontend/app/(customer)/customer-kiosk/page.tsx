'use client';

import React, { useState, useEffect, useContext, Suspense, useRef } from 'react';
import apiClient from '@/app/utils/apiClient';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { OrderContext, OrderItem } from '@/app/context/OrderContext';
import { useTranslatedTexts, useTranslation } from '@/app/hooks/useTranslation';
import Tooltip from '@/app/components/Tooltip';
import VoiceSearchInput from '@/app/components/VoiceSearchInput';

interface MenuItem {
  menu_item_id: number;
  name: string;
  upcharge: number;
  is_available: boolean;
  item_type: string;
  allergens?: string | null;
  allergen_info?: string | null;
  stock?: number;
}

interface MealType {
  meal_type_id: number;
  meal_type_name: string;
  meal_type_price: number;
  entree_count: number;
  side_count: number;
  drink_size: string;
}

interface OrderItemForRecommendation {
  mealType: MealType;
  entrees: MenuItem[];
  sides: MenuItem[];
  drink?: MenuItem;
}

interface Order {
  order_id: number;
  total_price: number;
  order_date: string;
  order_items: OrderItemForRecommendation[];
  points_used?: number;
  points_earned: number;
}

const CustomerKioskContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mealTypeId = searchParams.get('mealTypeId');
  const editIndex = searchParams.get('editIndex');

  const context = useContext(OrderContext);
  const { translateBatch, currentLanguage } = useTranslation();

  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [recommendedItems, setRecommendedItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    const fetchPastOrders = async () => {
      const customerId = localStorage.getItem('customerId');
      if (!customerId) {
        setPastOrders([]); // No authenticated customer
        return;
      }

      try {
        const backendUrl = '';
        const ordersRes = await apiClient(`${backendUrl}/api/orders/customer/${customerId}`);

        if (!ordersRes.ok) {
          // The apiClient should handle 401, but for other errors, we can still log them.
          const errorBody = await ordersRes.text();
          throw new Error(
            `Failed to fetch past orders. Status: ${ordersRes.status}. Body: ${errorBody}`
          );
        }

        const responseData: { success: boolean; data: Order[] } = await ordersRes.json();
        setPastOrders(responseData.data);
      } catch (err) {
        // apiClient will throw 'Unauthorized' for 401s, which will be caught here.
        // We can choose to log it or handle it, but redirection is already handled.
        if ((err as Error).message !== 'Unauthorized') {
          console.error('Error fetching past orders:', err);
        }
        setPastOrders([]);
      }
    };
    fetchPastOrders();
  }, []);

  useEffect(() => {
    if (pastOrders.length > 0) {
      const allEntrees = pastOrders.flatMap((order) =>
        order.order_items.flatMap((item) => item.entrees)
      );
      const entreeCounts = allEntrees.reduce(
        (acc, entree) => {
          acc[entree.menu_item_id] = (acc[entree.menu_item_id] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>
      );

      const sortedEntrees = Object.keys(entreeCounts)
        .sort((a, b) => entreeCounts[parseInt(b)] - entreeCounts[parseInt(a)])
        .slice(0, 3)
        .map((id) => allEntrees.find((e) => e.menu_item_id === parseInt(id)))
        .filter((e): e is MenuItem => e !== undefined);

      setRecommendedItems(sortedEntrees);
    }
  }, [pastOrders]);

  const textLabels = [
    'Back to Meal Type Selection',
    'Customize Your',
    'Shopping Cart',
    'Select Entrees',
    'Select Sides',
    'Select Drink',
    'Upcharge',
    'Update Item',
    'Add to Order',
    'Search menu items',
    'Allergens',
    'Contains',
    'No major allergens',
    'Filter by Allergens',
    'Hide items containing:',
    'Clear All Filters',
    'Apply Filters',
    'Loaded from your profile',
  ];

  const { translatedTexts } = useTranslatedTexts(textLabels);

  const t = {
    backToSelection: translatedTexts[0] || 'Back to Meal Type Selection',
    customizeYour: translatedTexts[1] || 'Customize Your',
    shoppingCart: translatedTexts[2] || 'Shopping Cart',
    selectEntrees: translatedTexts[3] || 'Select Entrees',
    selectSides: translatedTexts[4] || 'Select Sides',
    selectDrink: translatedTexts[5] || 'Select Drink',
    upcharge: translatedTexts[6] || 'Upcharge',
    updateItem: translatedTexts[7] || 'Update Item',
    addToOrder: translatedTexts[8] || 'Add to Order',
    searchMenuItems: translatedTexts[9] || 'Search menu items',
    allergens: translatedTexts[10] || 'Allergens',
    contains: translatedTexts[11] || 'Contains',
    noAllergens: translatedTexts[12] || 'No major allergens',
    filterByAllergens: translatedTexts[13] || 'Filter by Allergens',
    hideItemsContaining: translatedTexts[14] || 'Hide items containing:',
    clearFilters: translatedTexts[15] || 'Clear All Filters',
    applyFilters: translatedTexts[16] || 'Apply Filters',
    loadedFromProfile: translatedTexts[17] || 'Loaded from your profile',
  };

  if (!context) {
    throw new Error('CustomerKiosk must be used within an OrderProvider');
  }

  const { order, setOrder } = context;

  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [translatedMenuItems, setTranslatedMenuItems] = useState<Record<number, string>>({});
  const [translatedMealTypeName, setTranslatedMealTypeName] = useState<string>('');
  const [selectedEntrees, setSelectedEntrees] = useState<MenuItem[]>([]);
  const [selectedSides, setSelectedSides] = useState<MenuItem[]>([]);
  const [selectedDrink, setSelectedDrink] = useState<MenuItem | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allergenFilter, setAllergenFilter] = useState<Set<string>>(new Set());
  const [showAllergenFilter, setShowAllergenFilter] = useState(false);
  const [allergenPreferencesLoaded, setAllergenPreferencesLoaded] = useState(false);
  const [allergenPreferences, setAllergenPreferences] = useState<Set<string>>(new Set());

  // Track cycle direction for each item: true = ascending (0->1->2), false = descending (2->1->0)
  const entreeCycleDirection = useRef<Map<number, boolean>>(new Map());
  const sideCycleDirection = useRef<Map<number, boolean>>(new Map());

  useEffect(() => {
    if (!mealTypeId) {
      router.push('/meal-type-selection');
    }
  }, [mealTypeId, router]);

  useEffect(() => {
    if (mealTypeId) {
      // Reset cycle direction when meal type changes
      entreeCycleDirection.current.clear();
      sideCycleDirection.current.clear();

      const fetchMealTypeAndMenuItems = async () => {
        try {
          const backendUrl = '';

          const mealTypeRes = await apiClient(`${backendUrl}/api/meal-types/${mealTypeId}`);
          const mealTypeData: MealType = await mealTypeRes.json();
          setSelectedMealType(mealTypeData);

          const menuItemsRes = await apiClient(`${backendUrl}/api/menu-items?is_available=true`);
          const menuItemsData: MenuItem[] = await menuItemsRes.json();
          setMenuItems(menuItemsData);

          if (editIndex !== null) {
            const index = parseInt(editIndex, 10);
            if (order[index] && order[index].mealType.meal_type_id === parseInt(mealTypeId, 10)) {
              setSelectedEntrees(order[index].entrees);
              setSelectedSides(order[index].sides);
              setSelectedDrink(order[index].drink);
            }
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

      fetchMealTypeAndMenuItems();
    }
  }, [mealTypeId, editIndex, order]);

  // Load customer's allergen preferences
  useEffect(() => {
    const loadAllergenPreferences = async () => {
      if (allergenPreferencesLoaded) return; // Only load once

      const customerToken = localStorage.getItem('customerToken');
      if (!customerToken) return;

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/customer/auth/me`, {
          headers: {
            Authorization: `Bearer ${customerToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Loaded customer data:', data.customer);
          if (data.customer?.allergen_preferences) {
            try {
              const prefs = JSON.parse(data.customer.allergen_preferences);
              console.log('Parsed allergen preferences:', prefs);
              if (Array.isArray(prefs) && prefs.length > 0) {
                const prefsSet = new Set(prefs);
                console.log('Setting allergen preferences set:', Array.from(prefsSet));
                setAllergenPreferences(prefsSet); // Store for highlighting badges
                setAllergenFilter(prefsSet); // Also use for filtering
                setShowAllergenFilter(true); // Auto-show filter if preferences exist
              } else {
                console.log('No allergen preferences found or empty array');
              }
            } catch (e) {
              console.error('Error parsing allergen preferences:', e);
            }
          } else {
            console.log('No allergen_preferences field in customer data');
          }
          setAllergenPreferencesLoaded(true);
        }
      } catch (error) {
        console.error('Error loading allergen preferences:', error);
      }
    };

    loadAllergenPreferences();
  }, [allergenPreferencesLoaded]);

  // Translate menu items and meal type name when data or language changes
  useEffect(() => {
    const translateContent = async () => {
      if (menuItems.length > 0) {
        const menuItemNames = menuItems.map((item) => item.name);
        const translated = await translateBatch(menuItemNames);

        const translatedMap: Record<number, string> = {};
        menuItems.forEach((item, index) => {
          translatedMap[item.menu_item_id] = translated[index];
        });
        setTranslatedMenuItems(translatedMap);
      }

      if (selectedMealType) {
        const [translatedName] = await translateBatch([selectedMealType.meal_type_name]);
        setTranslatedMealTypeName(translatedName);
      }
    };

    translateContent();
  }, [menuItems, selectedMealType, currentLanguage, translateBatch]);

  const handleSelectItem = (item: MenuItem, type: 'entree' | 'side' | 'drink') => {
    // Check if item is out of stock
    if ((item.stock ?? 0) <= 0) {
      return; // Don't allow selection if out of stock
    }

    if (type === 'entree') {
      if (!selectedMealType) return; // Ensure meal type is selected
      // Count how many times this specific item is selected
      const itemCount = selectedEntrees.filter((e) => e.menu_item_id === item.menu_item_id).length;
      const totalCount = selectedEntrees.length;
      const maxCount = selectedMealType.entree_count;
      const isAscending = entreeCycleDirection.current.get(item.menu_item_id) ?? true;

      // Dynamic cycle: 0 -> 1 -> 2 -> ... -> maxCount -> (maxCount-1) -> ... -> 1 -> 0
      if (itemCount === 0) {
        // Item not selected: add one if there's room, mark as ascending
        if (totalCount < maxCount) {
          entreeCycleDirection.current.set(item.menu_item_id, true);
          setSelectedEntrees([...selectedEntrees, item]);
        }
      } else if (itemCount < maxCount && isAscending) {
        // Ascending phase: add another one (if we haven't reached max)
        if (totalCount < maxCount) {
          setSelectedEntrees([...selectedEntrees, item]);
        } else {
          // Can't add more (total at max), switch to descending and remove one
          entreeCycleDirection.current.set(item.menu_item_id, false);
          const itemIndex = selectedEntrees.findIndex((e) => e.menu_item_id === item.menu_item_id);
          if (itemIndex !== -1) {
            setSelectedEntrees(selectedEntrees.filter((_, index) => index !== itemIndex));
          }
        }
      } else {
        // Descending phase or at max: remove one
        const itemIndex = selectedEntrees.findIndex((e) => e.menu_item_id === item.menu_item_id);
        if (itemIndex !== -1) {
          const newEntrees = selectedEntrees.filter((_, index) => index !== itemIndex);
          setSelectedEntrees(newEntrees);
          // If after removal we have 0 of this item, delete from map; otherwise mark as descending
          const newItemCount = newEntrees.filter(
            (e) => e.menu_item_id === item.menu_item_id
          ).length;
          if (newItemCount === 0) {
            entreeCycleDirection.current.delete(item.menu_item_id);
          } else {
            entreeCycleDirection.current.set(item.menu_item_id, false);
          }
        }
      }
    } else if (type === 'side') {
      if (!selectedMealType) return; // Ensure meal type is selected
      // Count how many times this specific item is selected
      const itemCount = selectedSides.filter((s) => s.menu_item_id === item.menu_item_id).length;
      const totalCount = selectedSides.length;
      const maxCount = selectedMealType.side_count;
      const isAscending = sideCycleDirection.current.get(item.menu_item_id) ?? true;

      // Dynamic cycle: 0 -> 1 -> 2 -> ... -> maxCount -> (maxCount-1) -> ... -> 1 -> 0
      if (itemCount === 0) {
        // Item not selected: add one if there's room, mark as ascending
        if (totalCount < maxCount) {
          sideCycleDirection.current.set(item.menu_item_id, true);
          setSelectedSides([...selectedSides, item]);
        }
      } else if (itemCount < maxCount && isAscending) {
        // Ascending phase: add another one (if we haven't reached max)
        if (totalCount < maxCount) {
          setSelectedSides([...selectedSides, item]);
        } else {
          // Can't add more (total at max), switch to descending and remove one
          sideCycleDirection.current.set(item.menu_item_id, false);
          const itemIndex = selectedSides.findIndex((s) => s.menu_item_id === item.menu_item_id);
          if (itemIndex !== -1) {
            setSelectedSides(selectedSides.filter((_, index) => index !== itemIndex));
          }
        }
      } else {
        // Descending phase or at max: remove one
        const itemIndex = selectedSides.findIndex((s) => s.menu_item_id === item.menu_item_id);
        if (itemIndex !== -1) {
          const newSides = selectedSides.filter((_, index) => index !== itemIndex);
          setSelectedSides(newSides);
          // If after removal we have 0 of this item, delete from map; otherwise mark as descending
          const newItemCount = newSides.filter((s) => s.menu_item_id === item.menu_item_id).length;
          if (newItemCount === 0) {
            sideCycleDirection.current.delete(item.menu_item_id);
          } else {
            sideCycleDirection.current.set(item.menu_item_id, false);
          }
        }
      }
    } else if (type === 'drink') {
      // Toggle drink selection: if already selected, deselect; otherwise select
      if (selectedDrink?.menu_item_id === item.menu_item_id) {
        setSelectedDrink(undefined);
      } else {
        setSelectedDrink(item);
      }
    }
  };

  const handleAddOrUpdateOrder = () => {
    if (selectedMealType) {
      const newOrderItem: OrderItem = {
        mealType: selectedMealType,
        entrees: selectedEntrees,
        sides: selectedSides,
        drink: selectedDrink,
      };

      const newOrder = [...order];
      if (editIndex !== null) {
        const index = parseInt(editIndex, 10);
        newOrder[index] = newOrderItem;
      } else {
        newOrder.push(newOrderItem);
      }
      setOrder(newOrder);
      setSelectedEntrees([]);
      setSelectedSides([]);
      setSelectedDrink(undefined);
      // Reset cycle direction when clearing selections
      entreeCycleDirection.current.clear();
      sideCycleDirection.current.clear();
      router.push('/meal-type-selection');
    }
  };

  const getAllergens = (item: MenuItem): string[] => {
    if (!item.allergens) return [];
    try {
      const allergens = JSON.parse(item.allergens);
      return Array.isArray(allergens) ? allergens : [];
    } catch {
      return [];
    }
  };

  const renderAllergenBadge = (item: MenuItem) => {
    const allergens = getAllergens(item);

    // Debug logging (can remove later)
    if (item.menu_item_id === menuItems[0]?.menu_item_id) {
      console.log('Debug - Item:', item.name);
      console.log('Debug - Item allergens:', allergens);
      console.log('Debug - User preferences:', Array.from(allergenPreferences));
      console.log('Debug - Preferences size:', allergenPreferences.size);
    }

    // If item has no allergens at all, show green badge
    if (allergens.length === 0) {
      return (
        <div className="mt-2 text-xs text-green-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          {t.noAllergens}
        </div>
      );
    }

    // If user has preferences set, filter to show only matching allergens
    if (allergenPreferences.size > 0) {
      // Normalize comparison - convert to lowercase for case-insensitive matching
      const normalizedPreferences = new Set(
        Array.from(allergenPreferences).map((a) => a.toLowerCase().trim())
      );
      const matchingAllergens = allergens.filter((allergen) =>
        normalizedPreferences.has(allergen.toLowerCase().trim())
      );

      // Debug for first item
      if (item.menu_item_id === menuItems[0]?.menu_item_id) {
        console.log('Debug - Matching allergens:', matchingAllergens);
      }

      // If user is allergic to any allergens in this item, show warning badge with matching ones
      if (matchingAllergens.length > 0) {
        return (
          <div className="mt-2">
            <div className="text-xs font-semibold text-red-600 mb-1 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {t.allergens}:
            </div>
            <div className="flex flex-wrap gap-1">
              {matchingAllergens.map((allergen, idx) => (
                <span
                  key={idx}
                  className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full border border-red-300 font-semibold"
                >
                  {allergen}
                </span>
              ))}
            </div>
          </div>
        );
      } else {
        // Item has allergens but none match user's preferences, so it's safe - show green badge
        return (
          <div className="mt-2 text-xs text-green-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {t.noAllergens}
          </div>
        );
      }
    }

    // If user has no preferences set, show all allergens (original behavior)
    return (
      <div className="mt-2">
        <div className="text-xs font-semibold text-red-600 mb-1 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {t.allergens}:
        </div>
        <div className="flex flex-wrap gap-1">
          {allergens.map((allergen, idx) => (
            <span
              key={idx}
              className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full border border-red-300 font-semibold"
            >
              {allergen}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Get all unique allergens from menu items
  const allAllergens = React.useMemo(() => {
    const allergensSet = new Set<string>();
    menuItems.forEach((item) => {
      const itemAllergens = getAllergens(item);
      itemAllergens.forEach((allergen) => allergensSet.add(allergen));
    });
    return Array.from(allergensSet).sort();
  }, [menuItems]);

  const toggleAllergenFilter = (allergen: string) => {
    const newFilter = new Set(allergenFilter);
    if (newFilter.has(allergen)) {
      newFilter.delete(allergen);
    } else {
      newFilter.add(allergen);
    }
    setAllergenFilter(newFilter);
  };

  const clearAllergenFilter = () => {
    setAllergenFilter(new Set());
  };

  const filterByAllergens = (item: MenuItem): boolean => {
    if (allergenFilter.size === 0) return true;
    const itemAllergens = getAllergens(item);
    // Return false if item contains any filtered allergen
    return !itemAllergens.some((allergen) => allergenFilter.has(allergen));
  };

  const itemCount = order.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link href="/meal-type-selection">
          <button
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 inline-flex items-center"
            aria-label={t.backToSelection}
          >
            <Tooltip text={t.backToSelection} position="bottom">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                ></path>
              </svg>
            </Tooltip>
            {t.backToSelection}
          </button>
        </Link>
      </div>
      {selectedMealType && (
        <>
          <div className="flex flex-wrap justify-center sm:justify-between items-center mb-8 gap-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center sm:text-left">
              {t.customizeYour} {translatedMealTypeName || selectedMealType.meal_type_name}
            </h1>
            <Link
              href="/shopping-cart"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg inline-flex items-center"
              aria-label={t.shoppingCart}
            >
              <Tooltip text={t.shoppingCart} position="bottom">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  ></path>
                </svg>
              </Tooltip>
              {t.shoppingCart}
              {itemCount > 0 && (
                <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-1 text-sm">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Allergen Filter Section */}
          {allAllergens.length > 0 && (
            <div className="mb-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-yellow-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t.filterByAllergens}
                </h2>
                <button
                  onClick={() => setShowAllergenFilter(!showAllergenFilter)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                >
                  {showAllergenFilter ? 'Hide' : 'Show'}
                </button>
              </div>

              {showAllergenFilter && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm text-gray-600">{t.hideItemsContaining}</p>
                    {allergenPreferencesLoaded && allergenFilter.size > 0 && (
                      <p className="text-xs text-blue-600 italic flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {t.loadedFromProfile}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {allAllergens.map((allergen) => (
                      <button
                        key={allergen}
                        onClick={() => toggleAllergenFilter(allergen)}
                        className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                          allergenFilter.has(allergen)
                            ? 'bg-red-500 text-white border-2 border-red-600'
                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-300'
                        }`}
                      >
                        {allergen}
                      </button>
                    ))}
                  </div>
                  {allergenFilter.size > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Filtering {allergenFilter.size} allergen
                        {allergenFilter.size !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={clearAllergenFilter}
                        className="text-red-600 hover:text-red-800 text-sm font-semibold"
                      >
                        {t.clearFilters}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {recommendedItems.length > 0 && (
            <section className="mb-10 animate-fade-in">
              <h2 className="text-3xl font-semibold mb-4 animate-slide-in-down">
                Recommended for you
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedItems.map((item, index) => (
                  <div
                    key={item.menu_item_id}
                    className={`bg-white rounded-lg shadow-md p-4 sm:p-6 border-2 border-gray-200 hover-scale transition-all duration-200 animate-scale-in animate-stagger-${Math.min((index % 4) + 1, 4)}`}
                  >
                    <h3 className="text-xl font-bold mb-2">
                      {translatedMenuItems[item.menu_item_id] || item.name}
                    </h3>
                    <p className="text-gray-700">
                      {t.upcharge}: ${item.upcharge.toFixed(2)}
                    </p>
                    {renderAllergenBadge(item)}
                    <button
                      onClick={() => handleSelectItem(item, 'entree')}
                      className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                    >
                      Add to selection
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mb-10 animate-fade-in">
            <h2 className="text-3xl font-semibold mb-4 animate-slide-in-down">
              {t.selectEntrees} ({selectedEntrees.length}/{selectedMealType.entree_count})
            </h2>
            <div className="mb-4 animate-fade-in animate-stagger-1">
              <VoiceSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t.searchMenuItems}
                label={t.searchMenuItems}
                id="entree-search"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems
                .filter((item) => {
                  if (item.item_type !== 'entree') return false;
                  if (!filterByAllergens(item)) return false;
                  if (!searchQuery.trim()) return true;
                  const searchLower = searchQuery.toLowerCase();
                  const itemName = (
                    translatedMenuItems[item.menu_item_id] || item.name
                  ).toLowerCase();
                  return itemName.includes(searchLower);
                })
                .map((item, index) => {
                  const isOutOfStock = (item.stock ?? 0) <= 0;
                  return (
                    <div
                      key={item.menu_item_id}
                      className={`bg-white rounded-lg shadow-md p-4 sm:p-6 border-2 transition-all duration-200 animate-scale-in animate-stagger-${Math.min((index % 4) + 1, 4)} ${
                        isOutOfStock
                          ? 'border-red-300 bg-gray-100 opacity-60 cursor-not-allowed'
                          : selectedEntrees.some((e) => e.menu_item_id === item.menu_item_id)
                            ? 'border-blue-500 ring-2 ring-blue-300 cursor-pointer hover-scale'
                            : 'border-gray-200 cursor-pointer hover-scale'
                      }`}
                      onClick={() => !isOutOfStock && handleSelectItem(item, 'entree')}
                    >
                      <h3 className="text-xl font-bold mb-2">
                        {translatedMenuItems[item.menu_item_id] || item.name}
                      </h3>
                      <p className="text-gray-700">
                        {t.upcharge}: ${item.upcharge.toFixed(2)}
                      </p>
                      {isOutOfStock && (
                        <div className="mt-2 px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full inline-block">
                          Out of Stock
                        </div>
                      )}
                      {renderAllergenBadge(item)}
                    </div>
                  );
                })}
            </div>
          </section>

          <section className="mb-10 animate-fade-in">
            <h2 className="text-3xl font-semibold mb-4 animate-slide-in-down">
              {t.selectSides} ({selectedSides.length}/{selectedMealType.side_count})
            </h2>
            <div className="mb-4 animate-fade-in animate-stagger-1">
              <VoiceSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t.searchMenuItems}
                label={t.searchMenuItems}
                id="side-search"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems
                .filter((item) => {
                  if (item.item_type !== 'side') return false;
                  if (!filterByAllergens(item)) return false;
                  if (!searchQuery.trim()) return true;
                  const searchLower = searchQuery.toLowerCase();
                  const itemName = (
                    translatedMenuItems[item.menu_item_id] || item.name
                  ).toLowerCase();
                  return itemName.includes(searchLower);
                })
                .map((item, index) => {
                  const isOutOfStock = (item.stock ?? 0) <= 0;
                  return (
                    <div
                      key={item.menu_item_id}
                      className={`bg-white rounded-lg shadow-md p-4 sm:p-6 border-2 transition-all duration-200 animate-scale-in animate-stagger-${Math.min((index % 4) + 1, 4)} ${
                        isOutOfStock
                          ? 'border-red-300 bg-gray-100 opacity-60 cursor-not-allowed'
                          : selectedSides.some((s) => s.menu_item_id === item.menu_item_id)
                            ? 'border-blue-500 ring-2 ring-blue-300 cursor-pointer hover-scale'
                            : 'border-gray-200 cursor-pointer hover-scale'
                      }`}
                      onClick={() => !isOutOfStock && handleSelectItem(item, 'side')}
                    >
                      <h3 className="text-xl font-bold mb-2">
                        {translatedMenuItems[item.menu_item_id] || item.name}
                      </h3>
                      <p className="text-gray-700">
                        {t.upcharge}: ${item.upcharge.toFixed(2)}
                      </p>
                      {isOutOfStock && (
                        <div className="mt-2 px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full inline-block">
                          Out of Stock
                        </div>
                      )}
                      {renderAllergenBadge(item)}
                    </div>
                  );
                })}
            </div>
          </section>

          {selectedMealType.drink_size !== 'none' && (
            <section className="mb-10 animate-fade-in">
              <h2 className="text-3xl font-semibold mb-4 animate-slide-in-down">
                {t.selectDrink} (1)
              </h2>
              <div className="mb-4 animate-fade-in animate-stagger-1">
                <VoiceSearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={t.searchMenuItems}
                  label={t.searchMenuItems}
                  id="drink-search"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems
                  .filter((item) => {
                    if (item.item_type !== 'drink') return false;
                    if (!filterByAllergens(item)) return false;
                    if (!searchQuery.trim()) return true;
                    const searchLower = searchQuery.toLowerCase();
                    const itemName = (
                      translatedMenuItems[item.menu_item_id] || item.name
                    ).toLowerCase();
                    return itemName.includes(searchLower);
                  })
                  .map((item, index) => {
                    const isOutOfStock = (item.stock ?? 0) <= 0;
                    return (
                      <div
                        key={item.menu_item_id}
                        className={`bg-white rounded-lg shadow-md p-4 sm:p-6 border-2 transition-all duration-200 animate-scale-in animate-stagger-${Math.min((index % 4) + 1, 4)} ${
                          isOutOfStock
                            ? 'border-red-300 bg-gray-100 opacity-60 cursor-not-allowed'
                            : selectedDrink?.menu_item_id === item.menu_item_id
                              ? 'border-blue-500 ring-2 ring-blue-300 cursor-pointer hover-scale'
                              : 'border-gray-200 cursor-pointer hover-scale'
                        }`}
                        onClick={() => !isOutOfStock && handleSelectItem(item, 'drink')}
                      >
                        <h3 className="text-xl font-bold mb-2">
                          {translatedMenuItems[item.menu_item_id] || item.name}
                        </h3>
                        <p className="text-gray-700">
                          {t.upcharge}: ${item.upcharge.toFixed(2)}
                        </p>
                        {isOutOfStock && (
                          <div className="mt-2 px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full inline-block">
                            Out of Stock
                          </div>
                        )}
                        {renderAllergenBadge(item)}
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          <div className="text-center mb-8 animate-fade-in animate-stagger-2">
            <button
              onClick={handleAddOrUpdateOrder}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-lg sm:text-xl hover:shadow-lg button-press transition-all duration-200 animate-bounce-in"
              disabled={
                selectedMealType &&
                (selectedEntrees.length !== selectedMealType.entree_count ||
                  selectedSides.length !== selectedMealType.side_count ||
                  (selectedMealType.drink_size !== 'none' && !selectedDrink))
              }
            >
              {editIndex !== null ? t.updateItem : t.addToOrder}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const CustomerKiosk = () => {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">Loading...</div>}>
      <CustomerKioskContent />
    </Suspense>
  );
};

export default CustomerKiosk;
