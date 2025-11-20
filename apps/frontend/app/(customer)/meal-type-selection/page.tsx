'use client';

import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { OrderContext } from '@/app/context/OrderContext';
import { useTranslatedTexts, useTranslation } from '@/app/hooks/useTranslation';

interface MealType {
  meal_type_id: number;
  meal_type_name: string;
  meal_type_price: number;
  entree_count: number;
  side_count: number;
  drink_size: string;
}

const MealTypeSelection = () => {
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const context = useContext(OrderContext);
  const { translateBatch, currentLanguage } = useTranslation();
  const [translatedMealTypeNames, setTranslatedMealTypeNames] = useState<string[]>([]);

  const textLabels = [
    'Select Your Meal Type',
    'Shopping Cart',
    'Price',
    'Entrees',
    'Sides',
    'Drink',
    'A La Carte',
    'Create your own meal',
    'Drinks',
    'Select a beverage',
  ];

  const { translatedTexts } = useTranslatedTexts(textLabels);

  const t = {
    title: translatedTexts[0] || 'Select Your Meal Type',
    shoppingCart: translatedTexts[1] || 'Shopping Cart',
    price: translatedTexts[2] || 'Price',
    entrees: translatedTexts[3] || 'Entrees',
    sides: translatedTexts[4] || 'Sides',
    drink: translatedTexts[5] || 'Drink',
    aLaCarte: translatedTexts[6] || 'A La Carte',
    createYourOwn: translatedTexts[7] || 'Create your own meal',
    drinks: translatedTexts[8] || 'Drinks',
    selectBeverage: translatedTexts[9] || 'Select a beverage',
  };

  useEffect(() => {
    const fetchMealTypes = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/meal-types');
        const data = await res.json();
        setMealTypes(data);
      } catch (error) {
        console.error('Error fetching meal types:', error);
      }
    };

    fetchMealTypes();
  }, []);

  // Translate meal type names when mealTypes or language changes
  useEffect(() => {
    const translateMealTypeNames = async () => {
      if (mealTypes.length > 0) {
        const filtered = mealTypes.filter(
          (mt) =>
            (mt.meal_type_id >= 1 && mt.meal_type_id <= 3) ||
            (mt.meal_type_id >= 10 && mt.meal_type_id <= 12)
        );
        const names = filtered.map((mt) => mt.meal_type_name);
        const translated = await translateBatch(names);
        setTranslatedMealTypeNames(translated);
      }
    };

    translateMealTypeNames();
  }, [mealTypes, currentLanguage, translateBatch]);

  if (!context) {
    return null;
  }

  const { order } = context;
  const itemCount = order.length;

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center my-8">
        <h1 className="text-4xl font-bold">{t.title}</h1>
        <Link
          href="/shopping-cart"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg inline-flex items-center"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            ></path>
          </svg>
          {t.shoppingCart}
          {itemCount > 0 && (
            <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-1 text-sm">
              {itemCount}
            </span>
          )}
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mealTypes
          .filter(
            (mt) =>
              (mt.meal_type_id >= 1 && mt.meal_type_id <= 3) ||
              (mt.meal_type_id >= 10 && mt.meal_type_id <= 12)
          )
          .map((mealType, index) => (
            <Link
              key={mealType.meal_type_id}
              href={`/customer-kiosk?mealTypeId=${mealType.meal_type_id}`}
            >
              <div className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200">
                <h2 className="text-2xl font-bold mb-2">
                  {translatedMealTypeNames[index] || mealType.meal_type_name}
                </h2>
                <p className="text-gray-700">{t.price}: ${mealType.meal_type_price.toFixed(2)}</p>
                <p className="text-gray-700">{t.entrees}: {mealType.entree_count}</p>
                <p className="text-gray-700">{t.sides}: {mealType.side_count}</p>
                {mealType.drink_size && (
                  <p className="text-gray-700">{t.drink}: {mealType.drink_size}</p>
                )}
              </div>
            </Link>
          ))}
        <Link href="/a-la-carte">
          <div className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-2xl font-bold mb-2">{t.aLaCarte}</h2>
            <p className="text-gray-700">{t.createYourOwn}</p>
          </div>
        </Link>
        <Link href="/drinks">
          <div className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200">
            <h2 className="text-2xl font-bold mb-2">{t.drinks}</h2>
            <p className="text-gray-700">{t.selectBeverage}</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default MealTypeSelection;
