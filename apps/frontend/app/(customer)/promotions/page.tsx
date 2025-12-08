'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslatedTexts } from '@/app/hooks/useTranslation';
import { useToast } from '@/app/hooks/useToast';
import Link from 'next/link';

interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
}

interface PromotionalDiscount {
  id: number;
  code: string;
  name: string;
  description: string | null;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  start_date: string;
  end_date: string;
}

/**
 * Promotions page - displays current promotions and weather-based offers
 * Shows active discount codes and weather-based special offers
 */
const PromotionsPage = () => {
  const { addToast } = useToast();
  // State for weather and promotions data
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [discounts, setDiscounts] = useState<PromotionalDiscount[]>([]);
  const [discountsLoading, setDiscountsLoading] = useState(true);
  const [weatherPromotion, setWeatherPromotion] = useState<string | null>(null);

  const textLabels = [
    'Promotions & Special Offers',
    'Current Weather',
    'Active Promotions',
    'Weather-Based Offers',
    'Discount Code',
    'Valid Until',
    'Min Order',
    'Use Code',
    'No active promotions at this time',
    'Loading weather...',
    'Loading promotions...',
    'Failed to load weather information',
    'Failed to load promotions',
    'Hot Day Special',
    'Cold Day Special',
    'Rainy Day Special',
    'Perfect Weather Special',
  ];

  const { translatedTexts } = useTranslatedTexts(textLabels);

  const t = {
    title: translatedTexts[0] || 'Promotions & Special Offers',
    currentWeather: translatedTexts[1] || 'Current Weather',
    activePromotions: translatedTexts[2] || 'Active Promotions',
    weatherOffers: translatedTexts[3] || 'Weather-Based Offers',
    discountCode: translatedTexts[4] || 'Discount Code',
    validUntil: translatedTexts[5] || 'Valid Until',
    minOrder: translatedTexts[6] || 'Min Order',
    useCode: translatedTexts[7] || 'Use Code',
    noPromotions: translatedTexts[8] || 'No active promotions at this time',
    loadingWeather: translatedTexts[9] || 'Loading weather...',
    loadingPromotions: translatedTexts[10] || 'Loading promotions...',
    weatherError: translatedTexts[11] || 'Failed to load weather information',
    promotionsError: translatedTexts[12] || 'Failed to load promotions',
    hotDaySpecial: translatedTexts[13] || 'Hot Day Special',
    coldDaySpecial: translatedTexts[14] || 'Cold Day Special',
    rainyDaySpecial: translatedTexts[15] || 'Rainy Day Special',
    perfectWeatherSpecial: translatedTexts[16] || 'Perfect Weather Special',
  };

  // Fetch current weather to generate weather-based promotions
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setWeatherLoading(true);
        const backendUrl = '';
        const response = await fetch(`${backendUrl}/api/weather/current?city=College Station`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.weather) {
            setWeather(data.weather);
            
            // Generate weather-based promotion suggestions
            const temp = data.weather.temperature;
            const desc = data.weather.description.toLowerCase();
            
            if (temp > 30) {
              setWeatherPromotion(t.hotDaySpecial + ': Cool down with iced drinks! Get 15% off all cold beverages.');
            } else if (temp < 10) {
              setWeatherPromotion(t.coldDaySpecial + ': Warm up with hot drinks! Get 15% off all hot beverages.');
            } else if (desc.includes('rain') || desc.includes('storm')) {
              setWeatherPromotion(t.rainyDaySpecial + ': Stay cozy! Get 10% off your entire order.');
            } else if (temp >= 20 && temp <= 25 && !desc.includes('cloud')) {
              setWeatherPromotion(t.perfectWeatherSpecial + ': Perfect weather for dining! Get 5% off your order.');
            } else {
              setWeatherPromotion(null);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching weather:', err);
        addToast({ message: t.weatherError, type: 'error' });
      } finally {
        setWeatherLoading(false);
      }
    };

    const fetchDiscounts = async () => {
      try {
        setDiscountsLoading(true);
        const backendUrl = '';
        const response = await fetch(`${backendUrl}/api/discounts/active`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setDiscounts(data.data);
          }
        }
      } catch (err) {
        console.error('Error fetching discounts:', err);
        addToast({ message: t.promotionsError, type: 'error' });
      } finally {
        setDiscountsLoading(false);
      }
    };

    fetchWeather();
    fetchDiscounts();
  }, [addToast, t.weatherError, t.promotionsError, t.hotDaySpecial, t.coldDaySpecial, t.rainyDaySpecial, t.perfectWeatherSpecial]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDiscountValue = (discount: PromotionalDiscount) => {
    if (discount.discount_type === 'PERCENTAGE') {
      return `${discount.discount_value}% OFF`;
    } else {
      return `$${discount.discount_value} OFF`;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">{t.title}</h1>

      {/* Weather Section */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">{t.currentWeather}</h2>
        {weatherLoading ? (
          <p className="text-gray-600">{t.loadingWeather}</p>
        ) : weather ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-4">
              {weather.icon && (
                <Image
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                  alt={weather.description}
                  width={64}
                  height={64}
                  className="w-16 h-16 sm:w-20 sm:h-20"
                />
              )}
              <div>
                <p className="text-2xl sm:text-3xl font-bold">{Math.round(weather.temperature)}°C</p>
                <p className="text-gray-600 capitalize">{weather.description}</p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {weather.city}, {weather.country}
                </p>
              </div>
            </div>
            <div className="border-l-0 sm:border-l pl-0 sm:pl-6 pt-4 sm:pt-0 border-t sm:border-t-0 w-full sm:w-auto">
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="font-semibold">Feels like:</span> {Math.round(weather.feelsLike)}°C
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="font-semibold">Humidity:</span> {weather.humidity}%
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="font-semibold">Wind:</span> {weather.windSpeed} m/s
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">{t.weatherError}</p>
        )}
      </div>

      {/* Weather-Based Promotion */}
      {weatherPromotion && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-2">{t.weatherOffers}</h2>
          <p className="text-lg">{weatherPromotion}</p>
        </div>
      )}

      {/* Active Promotions Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">{t.activePromotions}</h2>
        {discountsLoading ? (
          <p className="text-gray-600">{t.loadingPromotions}</p>
        ) : discounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {discounts.map((discount) => (
              <div
                key={discount.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-semibold text-blue-600">{discount.name}</h3>
                  <span className="bg-green-100 text-green-800 text-sm font-bold px-2 py-1 rounded">
                    {formatDiscountValue(discount)}
                  </span>
                </div>
                {discount.description && (
                  <p className="text-gray-600 mb-3 text-sm">{discount.description}</p>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{t.discountCode}:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded font-mono text-blue-600">
                      {discount.code}
                    </code>
                  </div>
                  {discount.min_order_amount && (
                    <p className="text-gray-600">
                      <span className="font-semibold">{t.minOrder}:</span> ${discount.min_order_amount}
                    </p>
                  )}
                  <p className="text-gray-600">
                    <span className="font-semibold">{t.validUntil}:</span> {formatDate(discount.end_date)}
                  </p>
                </div>
                <Link
                  href="/shopping-cart"
                  className="mt-4 inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-center w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label={`${t.useCode} ${discount.name} - ${discount.code}`}
                >
                  {t.useCode}
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">{t.noPromotions}</p>
        )}
      </div>

      {/* Back to Menu Link */}
      <div className="mt-6 text-center">
        <Link
          href="/meal-type-selection"
          className="inline-block bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          aria-label="Back to menu selection"
        >
          Back to Menu
        </Link>
      </div>
    </div>
  );
};

export default PromotionsPage;

