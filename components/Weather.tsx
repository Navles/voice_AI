/**
 * Weather Display Component
 * File: components/Weather.tsx
 */

import React from 'react';
import type { WeatherData, ForecastData } from '../services/MCPTypes';

interface WeatherDisplayProps {
  data: WeatherData | ForecastData;
  type: 'current' | 'forecast';
  onClose: () => void;
}

export const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ data, type, onClose }) => {
  if (type === 'current') {
    const weather = data as WeatherData;
    return (
      <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{weather.location}, {weather.country}</h2>
            <p className="text-sm text-gray-500">{new Date(weather.timestamp).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">
              {weather.temperature}°{weather.units === 'celsius' ? 'C' : 'F'}
            </p>
            <p className="text-sm text-gray-600">Feels like: {weather.feels_like}°</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-lg font-semibold capitalize">{weather.condition}</p>
            <p className="text-sm text-gray-600">{weather.description}</p>
          </div>
          
          <div className="col-span-2 grid grid-cols-3 gap-2 mt-2">
            <div className="text-center p-2 bg-gray-50 rounded">
              <p className="text-sm text-gray-500">Humidity</p>
              <p className="font-semibold">{weather.humidity}%</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <p className="text-sm text-gray-500">Wind</p>
              <p className="font-semibold">{weather.wind_speed} m/s</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <p className="text-sm text-gray-500">Clouds</p>
              <p className="font-semibold">{weather.clouds}%</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const forecast = data as ForecastData;
  return (
    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-lg max-w-2xl w-full">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {forecast.location}, {forecast.country} - {forecast.forecast.length} Day Forecast
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {forecast.forecast.map((day, index) => (
          <div key={day.date} className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-800">
              {index === 0 ? 'Today' : new Date(day.date).toLocaleDateString(undefined, { weekday: 'long' })}
            </p>
            <p className="text-sm text-gray-500">{day.date}</p>
            
            <div className="mt-2">
              <p className="text-lg font-bold text-blue-600">{day.high}°C</p>
              <p className="text-sm text-blue-400">{day.low}°C</p>
            </div>
            
            <div className="mt-2">
              <p className="text-gray-700 capitalize">{day.condition}</p>
              <p className="text-sm text-gray-500">
                Humidity: {day.humidity}%
                {day.precipitation === 'Yes' && ' • Precipitation'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};