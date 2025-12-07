'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback, useContext } from 'react';

export interface WeatherData {
  temperature: number;
  city: string;
  country: string;
  humidity: number;
  description: string;
}

interface WeatherContextType {
  weather: WeatherData | null;
  weatherLoading: boolean;
  fetchWeather: (city?: string) => Promise<void>;
}

export const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const WeatherProvider = ({ children }: { children: ReactNode }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const fetchWeather = useCallback(async (city: string = 'College Station') => {
    try {
      setWeatherLoading(true);
      const backendUrl = '';
      const response = await fetch(`${backendUrl}/api/weather/current?city=${encodeURIComponent(city)}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.weather) {
          setWeather({
            temperature: data.weather.temperature,
            city: data.weather.city,
            country: data.weather.country,
            humidity: data.weather.humidity,
            description: data.weather.description,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching weather:', err);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  return (
    <WeatherContext.Provider 
      value={{ 
        weather, 
        weatherLoading, 
        fetchWeather 
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};

