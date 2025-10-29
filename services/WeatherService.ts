/**
 * Weather Service Implementation
 * File: services/WeatherService.ts
 */

import type { WeatherData, ForecastData, MCPError } from './MCPTypes';

export class WeatherService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  async getCurrentWeather(location: string, units: 'metric' | 'imperial' = 'metric'): Promise<WeatherData> {
    try {
      const response = await fetch(
        `${this.baseUrl}/weather?q=${encodeURIComponent(location)}&appid=${this.apiKey}&units=${units}`
      );

      if (!response.ok) {
        throw await this.handleApiError(response);
      }

      const data = await response.json();

      return {
        location: data.name,
        country: data.sys.country,
        temperature: data.main.temp,
        feels_like: data.main.feels_like,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        condition: data.weather[0].main,
        description: data.weather[0].description,
        wind_speed: data.wind.speed,
        clouds: data.clouds.all,
        units: units === 'metric' ? 'celsius' : 'fahrenheit',
        timestamp: new Date(data.dt * 1000).toISOString(),
      };
    } catch (error) {
      throw this.formatError(error);
    }
  }

  async getForecast(location: string, days: number = 3): Promise<ForecastData> {
    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?q=${encodeURIComponent(location)}&appid=${this.apiKey}&units=metric&cnt=${days * 8}`
      );

      if (!response.ok) {
        throw await this.handleApiError(response);
      }

      const data = await response.json();
      return {
        location: data.city.name,
        country: data.city.country,
        forecast: this.processForecastData(data.list, days),
      };
    } catch (error) {
      throw this.formatError(error);
    }
  }

  private processForecastData(forecastList: any[], days: number) {
    const dailyData = new Map<string, any[]>();
    
    forecastList.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyData.has(date)) {
        dailyData.set(date, []);
      }
      dailyData.get(date)?.push(item);
    });

    const result = [];
    let count = 0;
    
    for (const [date, items] of dailyData.entries()) {
      if (count >= days) break;
      
      const temps = items.map(i => i.main.temp);
      
      result.push({
        date,
        high: Math.max(...temps),
        low: Math.min(...temps),
        condition: this.getMostFrequent(items.map(i => i.weather[0].main)),
        humidity: Math.round(items.reduce((sum, i) => sum + i.main.humidity, 0) / items.length),
        precipitation: items.some(i => i.rain || i.snow) ? 'Yes' : 'No',
      });
      
      count++;
    }
    
    return result;
  }

  private getMostFrequent(arr: string[]): string {
    const counts = arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }

  private async handleApiError(response: Response): Promise<MCPError> {
    const data = await response.json();
    return {
      code: `HTTP_${response.status}`,
      message: data.message || 'Unknown error occurred',
      details: data
    };
  }

  private formatError(error: any): MCPError {
    if (error.code && error.message) {
      return error as MCPError;
    }
    
    return {
      code: 'WEATHER_SERVICE_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: error
    };
  }
}