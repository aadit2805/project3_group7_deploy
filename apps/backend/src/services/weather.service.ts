import axios from 'axios';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Get current weather data for a city using OpenWeatherMap API
 * @param city - City name (e.g., 'College Station')
 * @returns Object with success status and weather data (temperature, humidity, description, etc.)
 */
export const getCurrentWeather = async (city: string) => {
  try {
    const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        q: city,
        appid: OPENWEATHER_API_KEY,
        units: 'metric', // Return temperature in Celsius
      },
    });

    const data = response.data;
    return {
      success: true,
      weather: {
        city: data.name,
        country: data.sys.country,
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        windSpeed: data.wind.speed,
      },
    };
  } catch (error: any) {
    console.error('Weather API Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch weather data',
    };
  }
};

/**
 * Get current weather data using latitude and longitude coordinates
 * @param lat - Latitude coordinate
 * @param lon - Longitude coordinate
 * @returns Object with success status and weather data
 */
export const getWeatherByCoordinates = async (lat: number, lon: number) => {
  try {
    const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
      },
    });

    const data = response.data;
    return {
      success: true,
      weather: {
        city: data.name,
        country: data.sys.country,
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        windSpeed: data.wind.speed,
      },
    };
  } catch (error: any) {
    console.error('Weather API Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch weather data',
    };
  }
};

/**
 * Get weather forecast for a city
 * @param city - City name
 * @param days - Number of days to forecast (default: 5)
 * @returns Object with success status, city info, and forecast array
 */
export const getForecast = async (city: string, days: number = 5) => {
  try {
    const response = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
      params: {
        q: city,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
        cnt: days * 8, // 8 data points per day (API provides data every 3 hours)
      },
    });

    const data = response.data;
    return {
      success: true,
      city: data.city.name,
      country: data.city.country,
      forecast: data.list.map((item: any) => ({
        datetime: item.dt_txt,
        temperature: item.main.temp,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
      })),
    };
  } catch (error: any) {
    console.error('Forecast API Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch forecast data',
    };
  }
};
