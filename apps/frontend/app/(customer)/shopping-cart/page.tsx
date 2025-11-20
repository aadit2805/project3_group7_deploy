'use client';

import React, { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OrderContext, OrderItem } from '@/app/context/OrderContext';
import { useTranslatedTexts, useTranslation } from '@/app/hooks/useTranslation';

const ShoppingCart = () => {
  const context = useContext(OrderContext);
  const router = useRouter();
  const { translateBatch, currentLanguage } = useTranslation();
  const [translatedNames, setTranslatedNames] = useState<Record<string, string>>({});

  const textLabels = [
    'Back to Ordering',
    'Your Shopping Cart',
    'Your cart is empty.',
    'Start Ordering',
    'Edit',
    'Remove',
    'Base Price',
    'Drink',
    'Entrees',
    'Sides',
    'Item Total',
    'Total',
    'Submit Order',
    'Order submitted successfully!',
    'Failed to submit order.',
    'An error occurred while submitting the order.',
  ];

  const { translatedTexts } = useTranslatedTexts(textLabels);

  const t = {
    backToOrdering: translatedTexts[0] || 'Back to Ordering',
    title: translatedTexts[1] || 'Your Shopping Cart',
    cartEmpty: translatedTexts[2] || 'Your cart is empty.',
    startOrdering: translatedTexts[3] || 'Start Ordering',
    edit: translatedTexts[4] || 'Edit',
    remove: translatedTexts[5] || 'Remove',
    basePrice: translatedTexts[6] || 'Base Price',
    drink: translatedTexts[7] || 'Drink',
    entrees: translatedTexts[8] || 'Entrees',
    sides: translatedTexts[9] || 'Sides',
    itemTotal: translatedTexts[10] || 'Item Total',
    total: translatedTexts[11] || 'Total',
    submitOrder: translatedTexts[12] || 'Submit Order',
    successMessage: translatedTexts[13] || 'Order submitted successfully!',
    failMessage: translatedTexts[14] || 'Failed to submit order.',
    errorMessage: translatedTexts[15] || 'An error occurred while submitting the order.',
  };

  const order = context?.order || [];
  const setOrder = context?.setOrder || (() => {});
  const totalPrice = context?.totalPrice || 0;

  // Translate all names in the order
  useEffect(() => {
    const translateOrderNames = async () => {
      if (order.length > 0) {
        const namesToTranslate: string[] = [];
        const nameKeys: string[] = [];

        order.forEach((orderItem) => {
          // Meal type name
          const mealTypeKey = `meal_${orderItem.mealType.meal_type_id}`;
          if (!translatedNames[mealTypeKey]) {
            namesToTranslate.push(orderItem.mealType.meal_type_name);
            nameKeys.push(mealTypeKey);
          }

          // Menu item names
          [...orderItem.entrees, ...orderItem.sides].forEach((item) => {
            const itemKey = `item_${item.menu_item_id}`;
            if (!translatedNames[itemKey]) {
              namesToTranslate.push(item.name);
              nameKeys.push(itemKey);
            }
          });

          if (orderItem.drink) {
            const drinkKey = `item_${orderItem.drink.menu_item_id}`;
            if (!translatedNames[drinkKey]) {
              namesToTranslate.push(orderItem.drink.name);
              nameKeys.push(drinkKey);
            }
          }
        });

        if (namesToTranslate.length > 0) {
          const translated = await translateBatch(namesToTranslate);
          const newTranslations: Record<string, string> = { ...translatedNames };
          nameKeys.forEach((key, index) => {
            newTranslations[key] = translated[index];
          });
          setTranslatedNames(newTranslations);
        }
      }
    };

    translateOrderNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, currentLanguage]);

  if (!context) {
    return null;
  }

  const handleEditItem = (index: number) => {
    const itemToEdit = order[index];
    router.push(
      `/customer-kiosk?mealTypeId=${itemToEdit.mealType.meal_type_id}&editIndex=${index}`
    );
  };

  const handleRemoveFromOrder = (index: number) => {
    const newOrder = [...order];
    newOrder.splice(index, 1);
    setOrder(newOrder);
  };

  const handleSubmitOrder = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_items: order }),
      });

      if (response.ok) {
        alert(t.successMessage);
        setOrder([]);
        localStorage.removeItem('order');
        router.push('/meal-type-selection');
      } else {
        alert(t.failMessage);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert(t.errorMessage);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/meal-type-selection"
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            ></path>
          </svg>
          {t.backToOrdering}
        </Link>
      </div>

      <div className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-3xl font-semibold mb-4">{t.title}</h2>
        {order.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xl mb-4">{t.cartEmpty}</p>
            <Link
              href="/meal-type-selection"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-block"
            >
              {t.startOrdering}
            </Link>
          </div>
        ) : (
          <>
            {order.map((orderItem, index) => {
              const isDrinkOnly =
                orderItem.entrees.length === 0 && orderItem.sides.length === 0 && orderItem.drink;
              const itemTotalPrice =
                orderItem.mealType.meal_type_price +
                orderItem.entrees.reduce((sum, item) => sum + item.upcharge, 0) +
                orderItem.sides.reduce((sum, item) => sum + item.upcharge, 0) +
                (orderItem.drink ? orderItem.drink.upcharge : 0);

              return (
                <div key={index} className="mb-4 pb-4 border-b border-gray-200 bg-white p-4 rounded">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold">
                      {translatedNames[`meal_${orderItem.mealType.meal_type_id}`] || orderItem.mealType.meal_type_name}
                    </h3>
                    <div>
                      <button
                        onClick={() => handleEditItem(index)}
                        className="text-blue-500 hover:text-blue-700 font-bold mr-2 px-3 py-1 border border-blue-500 rounded"
                      >
                        {t.edit}
                      </button>
                      <button
                        onClick={() => handleRemoveFromOrder(index)}
                        className="text-red-500 hover:text-red-700 font-bold px-3 py-1 border border-red-500 rounded"
                      >
                        {t.remove}
                      </button>
                    </div>
                  </div>
                  {isDrinkOnly ? (
                    <>
                      <p className="text-lg mt-2">{t.basePrice}: ${orderItem.mealType.meal_type_price.toFixed(2)}</p>
                      {orderItem.drink && (
                        <p className="text-lg">
                          {t.drink}: {translatedNames[`item_${orderItem.drink.menu_item_id}`] || orderItem.drink.name} (+${orderItem.drink.upcharge.toFixed(2)})
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-lg mt-2">{t.basePrice}: ${orderItem.mealType.meal_type_price.toFixed(2)}</p>
                      {orderItem.entrees.length > 0 && (
                        <>
                          <h4 className="text-xl font-semibold mt-4">{t.entrees}:</h4>
                          <ul className="list-disc list-inside ml-4">
                            {orderItem.entrees.map((item) => (
                              <li key={item.menu_item_id} className="text-lg">
                                {translatedNames[`item_${item.menu_item_id}`] || item.name} (+${item.upcharge.toFixed(2)})
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      {orderItem.sides.length > 0 && (
                        <>
                          <h4 className="text-xl font-semibold mt-4">{t.sides}:</h4>
                          <ul className="list-disc list-inside ml-4">
                            {orderItem.sides.map((item) => (
                              <li key={item.menu_item_id} className="text-lg">
                                {translatedNames[`item_${item.menu_item_id}`] || item.name} (+${item.upcharge.toFixed(2)})
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      {orderItem.drink && (
                        <p className="text-xl font-semibold mt-4">
                          {t.drink}: {translatedNames[`item_${orderItem.drink.menu_item_id}`] || orderItem.drink.name} (+${orderItem.drink.upcharge.toFixed(2)})
                        </p>
                      )}
                    </>
                  )}
                  <div className="mt-2 text-right">
                    <p className="text-xl font-semibold">{t.itemTotal}: ${itemTotalPrice.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
            <div className="mt-6 pt-4 border-t-2 border-gray-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">{t.total}: ${totalPrice.toFixed(2)}</h3>
                <button
                  onClick={handleSubmitOrder}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-xl"
                >
                  {t.submitOrder}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShoppingCart;

