'use client';

import React, { useState, useEffect, useContext, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { OrderContext, OrderItem } from '@/app/context/OrderContext';
import { EmployeeContext } from '@/app/context/EmployeeContext'; // Import EmployeeContext
import { useTranslatedTexts, useTranslation } from '@/app/hooks/useTranslation';
import Tooltip from '@/app/components/Tooltip';
import { safeJsonParse } from '@/app/utils/jsonHelper';

interface MenuItem {
  menu_item_id: number;
  name: string;
  upcharge: number;
  is_available: boolean;
  item_type: string;
  availability_start_time?: string | null;
  availability_end_time?: string | null;
}

interface MealType {
  meal_type_id: number;
  meal_type_name: string;
  meal_type_price: number;
  entree_count: number;
  side_count: number;
  drink_size: string;
}

/**
 * Cashier Interface page - allows employees to process customer orders
 * Supports meal type selection, entree/side/drink selection, and order submission
 */
const CashierInterfaceContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mealTypeId = searchParams.get('mealTypeId');
  const editIndex = searchParams.get('editIndex');

  const context = useContext(OrderContext);
  const employeeContext = useContext(EmployeeContext); // Access EmployeeContext
  const { translateBatch, currentLanguage } = useTranslation();

  // Translation labels
  const textLabels = [
    'Back to Dashboard',
    'Cashier Interface - Select Meal Type',
    'Price',
    'Entrees',
    'Sides',
    'Drink',
    'Drinks',
    'Submit Order',
    'Back to Meal Types',
    'Cashier Interface - Customize',
    'Select Entrees',
    'Select Sides',
    'Select Drink Size',
    'Select Drink',
    'Small',
    'Medium',
    'Large',
    'Upcharge',
    'Unavailable',
    'Update Item',
    'Add to Order',
    'Loading meal type...',
    'Loading...',
    'Order submitted successfully!',
    'Failed to submit order.',
    'An error occurred while submitting the order.',
  ];

  const { translatedTexts } = useTranslatedTexts(textLabels);

  const t = {
    backToDashboard: translatedTexts[0] || 'Back to Dashboard',
    selectMealType: translatedTexts[1] || 'Cashier Interface - Select Meal Type',
    price: translatedTexts[2] || 'Price',
    entrees: translatedTexts[3] || 'Entrees',
    sides: translatedTexts[4] || 'Sides',
    drink: translatedTexts[5] || 'Drink',
    drinks: translatedTexts[6] || 'Drinks',
    submitOrder: translatedTexts[7] || 'Submit Order',
    backToMealTypes: translatedTexts[8] || 'Back to Meal Types',
    customize: translatedTexts[9] || 'Cashier Interface - Customize',
    selectEntrees: translatedTexts[10] || 'Select Entrees',
    selectSides: translatedTexts[11] || 'Select Sides',
    selectDrinkSize: translatedTexts[12] || 'Select Drink Size',
    selectDrink: translatedTexts[13] || 'Select Drink',
    small: translatedTexts[14] || 'Small',
    medium: translatedTexts[15] || 'Medium',
    large: translatedTexts[16] || 'Large',
    upcharge: translatedTexts[17] || 'Upcharge',
    unavailable: translatedTexts[18] || 'Unavailable',
    updateItem: translatedTexts[19] || 'Update Item',
    addToOrder: translatedTexts[20] || 'Add to Order',
    loadingMealType: translatedTexts[21] || 'Loading meal type...',
    loading: translatedTexts[22] || 'Loading...',
    successMessage: translatedTexts[23] || 'Order submitted successfully!',
    failMessage: translatedTexts[24] || 'Failed to submit order.',
    errorMessage: translatedTexts[25] || 'An error occurred while submitting the order.',
  };

  if (!context || !employeeContext) {
    throw new Error('CashierInterface must be used within an OrderProvider and EmployeeProvider');
  }

  const { user } = employeeContext; // Get user from EmployeeContext
  const { order, setOrder } = context;

  // State for meal customization
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedEntrees, setSelectedEntrees] = useState<MenuItem[]>([]);
  const [selectedSides, setSelectedSides] = useState<MenuItem[]>([]);
  const [selectedDrink, setSelectedDrink] = useState<MenuItem | null>(null);
  const [selectedDrinkSize, setSelectedDrinkSize] = useState<string | null>(null);
  const [isDrinkSelection, setIsDrinkSelection] = useState<boolean>(false);
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [translatedMealTypes, setTranslatedMealTypes] = useState<Record<number, string>>({});
  const [translatedMenuItems, setTranslatedMenuItems] = useState<Record<number, string>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Track cycle direction for each item: true = ascending (0->1->2), false = descending (2->1->0)
  const entreeCycleDirection = useRef<Map<number, boolean>>(new Map());
  const sideCycleDirection = useRef<Map<number, boolean>>(new Map());

  // Fetch all meal types on component mount
  useEffect(() => {
    const fetchMealTypes = async () => {
      try {
        const backendUrl = '';
        const res = await fetch(`${backendUrl}/api/meal-types`);
        if (!res.ok) {
          throw new Error(`Failed to fetch meal types: ${res.status}`);
        }
        const data = await safeJsonParse(res);
        setMealTypes(data);
      } catch (error) {
        console.error('Error fetching meal types:', error);
      }
    };

    fetchMealTypes();
  }, []);

  // Translate meal types when data or language changes
  useEffect(() => {
    const translateMealTypes = async () => {
      if (mealTypes.length > 0) {
        const mealTypeNames = mealTypes.map((mt) => mt.meal_type_name);
        const translated = await translateBatch(mealTypeNames);

        const translatedMap: Record<number, string> = {};
        mealTypes.forEach((mt, index) => {
          translatedMap[mt.meal_type_id] = translated[index];
        });
        setTranslatedMealTypes(translatedMap);
      }
    };

    translateMealTypes();
  }, [mealTypes, currentLanguage, translateBatch]);

  // Translate menu items when data or language changes
  useEffect(() => {
    const translateMenuItems = async () => {
      if (menuItems.length > 0) {
        const menuItemNames = menuItems.map((item) => item.name);
        const translated = await translateBatch(menuItemNames);

        const translatedMap: Record<number, string> = {};
        menuItems.forEach((item, index) => {
          translatedMap[item.menu_item_id] = translated[index];
        });
        setTranslatedMenuItems(translatedMap);
      }
    };

    translateMenuItems();
  }, [menuItems, currentLanguage, translateBatch]);

  useEffect(() => {
    if (mealTypeId) {
      // Reset cycle direction when meal type changes
      entreeCycleDirection.current.clear();
      sideCycleDirection.current.clear();

      const mealTypeIdNum = parseInt(mealTypeId, 10);
      // If it's a drink meal type (13, 14, 15), show drink selection
      if (mealTypeIdNum === 13 || mealTypeIdNum === 14 || mealTypeIdNum === 15) {
        setIsDrinkSelection(true);
        const sizeMap: Record<number, string> = {
          13: 'Small',
          14: 'Medium',
          15: 'Large',
        };
        setSelectedDrinkSize(sizeMap[mealTypeIdNum]);
      }

      const fetchMealTypeAndMenuItems = async () => {
        try {
          const backendUrl = '';
          const mealTypeRes = await fetch(`${backendUrl}/api/meal-types/${mealTypeId}`);
          if (!mealTypeRes.ok) {
            throw new Error(`Failed to fetch meal type: ${mealTypeRes.status}`);
          }
          const mealTypeData: MealType = await safeJsonParse(mealTypeRes);
          setSelectedMealType(mealTypeData);

          // Fetch menu items with time-based availability filtering (same as customer kiosk)
          const menuItemsRes = await fetch(`${backendUrl}/api/menu-items?is_available=true`);
          if (!menuItemsRes.ok) {
            throw new Error(`Failed to fetch menu items: ${menuItemsRes.status}`);
          }
          const menuItemsData: MenuItem[] = await safeJsonParse(menuItemsRes);
          setMenuItems(menuItemsData);

          if (editIndex !== null) {
            const index = parseInt(editIndex, 10);
            if (order[index] && order[index].mealType.meal_type_id === mealTypeIdNum) {
              setSelectedEntrees(order[index].entrees);
              setSelectedSides(order[index].sides);
              if (order[index].drink) {
                setSelectedDrink(order[index].drink);
                setSelectedDrinkSize(order[index].mealType.drink_size || null);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

      fetchMealTypeAndMenuItems();
    }
  }, [mealTypeId, editIndex, order]);

  // Handle selection of entrees or sides (toggle selection)
  const handleSelectItem = (item: MenuItem, type: 'entree' | 'side') => {
    if (!selectedMealType) return; // Ensure meal type is selected

    if (type === 'entree') {
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
    }
  };

  // Add or update order item in the order context
  const handleAddOrUpdateOrder = (mealTypeOverride?: MealType) => {
    const mealTypeToUse = mealTypeOverride || selectedMealType;
    if (mealTypeToUse) {
      const newOrderItem: OrderItem = {
        mealType: mealTypeToUse,
        entrees: selectedEntrees,
        sides: selectedSides,
        drink: selectedDrink || undefined,
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
      setSelectedDrink(null);
      setSelectedDrinkSize(null);
      setSelectedMealType(null);
      setIsDrinkSelection(false);
      setSearchQuery('');
      // Reset cycle direction when clearing selections
      entreeCycleDirection.current.clear();
      sideCycleDirection.current.clear();
      router.push('/cashier-interface');
    }
  };

  const handleSelectMealType = (mealType: MealType) => {
    setSelectedMealType(mealType);
    router.push(`/cashier-interface?mealTypeId=${mealType.meal_type_id}`);
  };

  const handleSelectDrinks = () => {
    setIsDrinkSelection(true);
    setSelectedMealType(null);
    setSelectedEntrees([]);
    setSelectedSides([]);
    setSelectedDrink(null);
    setSelectedDrinkSize(null);
    setSearchQuery('');
  };

  const handleSelectDrinkSize = (size: string) => {
    setSelectedDrinkSize(size);
    // Fetch menu items if not already loaded
    if (menuItems.length === 0) {
      fetch('/api/menu-items')
        .then((res) => res.json())
        .then((data) => setMenuItems(data))
        .catch((error) => console.error('Error fetching menu items:', error));
    }
  };

  const handleSelectDrinkItem = (item: MenuItem) => {
    setSelectedDrink(item);
  };

  const getDrinkMealType = (size: string): MealType | null => {
    const sizeMap: Record<string, number> = {
      Small: 13,
      Medium: 14,
      Large: 15,
    };
    const mealTypeId = sizeMap[size];
    return mealTypes.find((mt) => mt.meal_type_id === mealTypeId) || null;
  };

  const filterMenuItems = (items: MenuItem[]) => {
    if (!searchQuery.trim()) {
      return items;
    }
    const query = searchQuery.toLowerCase().trim();
    return items.filter((item) => {
      const originalName = item.name.toLowerCase();
      const translatedName = (translatedMenuItems[item.menu_item_id] || '').toLowerCase();
      return originalName.includes(query) || translatedName.includes(query);
    });
  };

  // Filter out drink meal types (13, 14, 15) from main selection
  const nonDrinkMealTypes = mealTypes.filter(
    (mt) => mt.meal_type_id !== 13 && mt.meal_type_id !== 14 && mt.meal_type_id !== 15
  );

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      {!mealTypeId && !isDrinkSelection ? (
        <>
          <div className="mb-4 animate-slide-in-down">
            <Link href="/dashboard">
              <button
                className="bg-gray-300 text-gray-800 px-4 py-2 sm:py-2 rounded hover:bg-gray-400 inline-flex items-center button-press transition-all duration-200 hover:shadow-md min-h-[44px] text-sm sm:text-base"
                aria-label={t.backToDashboard}
              >
                <Tooltip text={t.backToDashboard} position="bottom">
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
                {t.backToDashboard}
              </button>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 animate-slide-in-down">
            {t.selectMealType}
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {nonDrinkMealTypes.map((mealType, index) => (
              <div
                key={mealType.meal_type_id}
                onClick={() => handleSelectMealType(mealType)}
                className="bg-[#D61927] rounded-lg shadow-md p-4 sm:p-6 cursor-pointer border-2 border-white/30 hover:border-white hover:shadow-xl hover:bg-[#B81520] transition-all duration-300 min-h-[44px]"
              >
                <h2 className="text-xl sm:text-2xl font-bold mb-2 text-white break-words">
                  {translatedMealTypes[mealType.meal_type_id] || mealType.meal_type_name}
                </h2>
                <p className="text-white text-sm sm:text-base">
                  {t.price}: ${mealType.meal_type_price.toFixed(2)}
                </p>
                <p className="text-white text-sm sm:text-base">
                  {t.entrees}: {mealType.entree_count}
                </p>
                <p className="text-white text-sm sm:text-base">
                  {t.sides}: {mealType.side_count}
                </p>
                {mealType.drink_size && (
                  <p className="text-white text-sm sm:text-base">
                    {t.drink}: {mealType.drink_size}
                  </p>
                )}
              </div>
            ))}
            {/* Drinks option */}
            <div
              onClick={handleSelectDrinks}
              className="bg-[#D61927] rounded-lg shadow-md p-4 sm:p-6 cursor-pointer border-2 border-white/30 hover:border-white hover:shadow-xl hover:bg-[#B81520] transition-all duration-300 min-h-[44px]"
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-2 text-white">{t.drinks}</h2>
              <p className="text-white text-sm sm:text-base">{t.selectDrinkSize}</p>
            </div>
          </div>
        </>
      ) : isDrinkSelection ? (
        <>
          <div className="mb-6">
            <button
              onClick={() => {
                setIsDrinkSelection(false);
                setSelectedDrinkSize(null);
                setSelectedDrink(null);
                setSearchQuery('');
              }}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 sm:py-2 px-4 rounded-lg min-h-[44px] text-sm sm:text-base"
            >
              ← {t.backToMealTypes}
            </button>
          </div>
          {!selectedDrinkSize ? (
            <>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8">
                {t.selectDrinkSize}
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto">
                {[
                  { name: 'Small', size: 'Small' },
                  { name: 'Medium', size: 'Medium' },
                  { name: 'Large', size: 'Large' },
                ].map((sizeOption) => {
                  const mealType = getDrinkMealType(sizeOption.size);
                  return (
                    <div
                      key={sizeOption.size}
                      onClick={() => handleSelectDrinkSize(sizeOption.size)}
                      className="bg-[#D61927] rounded-lg shadow-md p-4 sm:p-6 cursor-pointer border-2 border-white/30 hover:border-white hover:shadow-xl hover:bg-[#B81520] transition-all duration-300 min-h-[44px]"
                    >
                      <h2 className="text-xl sm:text-2xl font-bold mb-2 text-white">
                        {sizeOption.name === 'Small'
                          ? t.small
                          : sizeOption.name === 'Medium'
                            ? t.medium
                            : t.large}
                      </h2>
                      {mealType && (
                        <p className="text-white text-sm sm:text-base">
                          {t.price}: ${mealType.meal_type_price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <button
                  onClick={() => {
                    setSelectedDrinkSize(null);
                    setSelectedDrink(null);
                    setSearchQuery('');
                  }}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 sm:py-2 px-4 rounded-lg min-h-[44px] text-sm sm:text-base"
                >
                  ← {t.selectDrinkSize}
                </button>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8">
                {t.selectDrink} -{' '}
                {selectedDrinkSize === 'Small'
                  ? t.small
                  : selectedDrinkSize === 'Medium'
                    ? t.medium
                    : t.large}
              </h1>

              <div className="mb-4 sm:mb-6 max-w-2xl mx-auto">
                <input
                  type="text"
                  placeholder="Search drinks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 text-base sm:text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 min-h-[44px]"
                />
              </div>

              <section className="mb-6 sm:mb-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filterMenuItems(menuItems.filter((item) => item.item_type === 'drink')).map(
                    (item) => {
                      const isSelected = selectedDrink?.menu_item_id === item.menu_item_id;
                      return (
                        <div
                          key={item.menu_item_id}
                          className={`rounded-lg shadow-md p-4 sm:p-6 cursor-pointer border-2 transition-all duration-300 min-h-[44px] ${
                            isSelected
                              ? 'bg-black border-white border-4 shadow-2xl ring-4 ring-white/50'
                              : 'bg-[#D61927] border-white/50 hover:border-white hover:shadow-xl hover:bg-[#B81520]'
                          }`}
                          onClick={() => item.is_available && handleSelectDrinkItem(item)}
                        >
                          <h3 className="text-lg sm:text-xl font-bold mb-2 text-white break-words">
                            {translatedMenuItems[item.menu_item_id] || item.name}
                          </h3>
                          <p className="text-white text-sm sm:text-base">
                            {t.upcharge}: ${item.upcharge.toFixed(2)}
                          </p>
                          {!item.is_available && (
                            <p className="text-white font-semibold mt-2 text-sm sm:text-base">
                              {t.unavailable}
                            </p>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </section>

              <div className="text-center mb-10 sm:mb-20">
                <button
                  onClick={() => {
                    const drinkMealType = getDrinkMealType(selectedDrinkSize);
                    if (drinkMealType && selectedDrink) {
                      handleAddOrUpdateOrder(drinkMealType);
                    }
                  }}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg sm:text-xl min-h-[44px] w-full sm:w-auto"
                  disabled={!selectedDrink}
                >
                  {editIndex !== null ? t.updateItem : t.addToOrder}
                </button>
              </div>
            </>
          )}
        </>
      ) : selectedMealType ? (
        <>
          <div className="mb-6">
            <button
              onClick={() => {
                setSelectedMealType(null);
                setSelectedEntrees([]);
                setSelectedSides([]);
                setSelectedDrink(null);
                setSelectedDrinkSize(null);
                setIsDrinkSelection(false);
                setSearchQuery('');
                // Reset cycle direction when going back
                entreeCycleDirection.current.clear();
                sideCycleDirection.current.clear();
                router.push('/cashier-interface');
              }}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 sm:py-2 px-4 rounded-lg min-h-[44px] text-sm sm:text-base"
            >
              ← {t.backToMealTypes}
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8">
            {t.customize}{' '}
            {translatedMealTypes[selectedMealType.meal_type_id] || selectedMealType.meal_type_name}
          </h1>

          <div className="mb-4 sm:mb-6 max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search meal options..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 text-base sm:text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 min-h-[44px]"
            />
          </div>

          <section className="mb-6 sm:mb-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4">
              {t.selectEntrees} ({selectedEntrees.length}/{selectedMealType.entree_count})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filterMenuItems(menuItems.filter((item) => item.item_type === 'entree')).map(
                (item) => {
                  const isSelected = selectedEntrees.some(
                    (e) => e.menu_item_id === item.menu_item_id
                  );
                  return (
                    <div
                      key={item.menu_item_id}
                      className={`rounded-lg shadow-md p-4 sm:p-6 cursor-pointer border-2 transition-all duration-300 min-h-[44px] ${
                        isSelected
                          ? 'bg-black border-white border-4 shadow-2xl ring-4 ring-white/50'
                          : 'bg-[#D61927] border-white/50 hover:border-white hover:shadow-xl hover:bg-[#B81520]'
                      }`}
                      onClick={() => item.is_available && handleSelectItem(item, 'entree')}
                    >
                      <h3 className="text-lg sm:text-xl font-bold mb-2 text-white break-words">
                        {translatedMenuItems[item.menu_item_id] || item.name}
                      </h3>
                      <p className="text-white text-sm sm:text-base">
                        {t.upcharge}: ${item.upcharge.toFixed(2)}
                      </p>
                      {!item.is_available && (
                        <p className="text-white font-semibold mt-2 text-sm sm:text-base">
                          {t.unavailable}
                        </p>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </section>

          <section className="mb-6 sm:mb-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4">
              {t.selectSides} ({selectedSides.length}/{selectedMealType.side_count})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filterMenuItems(menuItems.filter((item) => item.item_type === 'side')).map(
                (item) => {
                  const isSelected = selectedSides.some(
                    (s) => s.menu_item_id === item.menu_item_id
                  );
                  return (
                    <div
                      key={item.menu_item_id}
                      className={`rounded-lg shadow-md p-4 sm:p-6 cursor-pointer border-2 transition-all duration-300 min-h-[44px] ${
                        isSelected
                          ? 'bg-black border-white border-4 shadow-2xl ring-4 ring-white/50'
                          : 'bg-[#D61927] border-white/50 hover:border-white hover:shadow-xl hover:bg-[#B81520]'
                      }`}
                      onClick={() => item.is_available && handleSelectItem(item, 'side')}
                    >
                      <h3 className="text-lg sm:text-xl font-bold mb-2 text-white break-words">
                        {translatedMenuItems[item.menu_item_id] || item.name}
                      </h3>
                      <p className="text-white text-sm sm:text-base">
                        {t.upcharge}: ${item.upcharge.toFixed(2)}
                      </p>
                      {!item.is_available && (
                        <p className="text-white font-semibold mt-2 text-sm sm:text-base">
                          {t.unavailable}
                        </p>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </section>

          <div className="text-center mb-10 sm:mb-20">
            <button
              onClick={() => handleAddOrUpdateOrder()}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg sm:text-xl min-h-[44px] w-full sm:w-auto"
              disabled={
                selectedMealType &&
                (selectedEntrees.length !== selectedMealType.entree_count ||
                  selectedSides.length !== selectedMealType.side_count)
              }
            >
              {editIndex !== null ? t.updateItem : t.addToOrder}
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-10">
          <h1 className="text-3xl font-bold">{t.loadingMealType}</h1>
        </div>
      )}
    </div>
  );
};

const CashierInterface = () => {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">Loading...</div>}>
      <CashierInterfaceContent />
    </Suspense>
  );
};

export default CashierInterface;
