/**
 * Enhanced MCP Client Implementation
 * File: services/EnhancedMCPClient.ts
 */

import type { MCPServerConfig, MCPTool, MCPToolCall, MCPToolResult } from './MCPTypes';
import { WeatherService } from './WeatherService';

export class EnhancedMCPClient {
  private serverConfigs: Map<string, MCPServerConfig> = new Map();
  private weatherService: WeatherService | null = null;

  constructor() {
    this.initializeServers();
  }

  private initializeServers() {
    // Configure OpenWeather MCP server
    if (process.env.OPENWEATHER_API_KEY) {
      this.serverConfigs.set('weather', {
        url: 'https://api.openweathermap.org/data/2.5',
        type: 'http',
        apiKey: process.env.OPENWEATHER_API_KEY,
      });

      this.weatherService = new WeatherService(process.env.OPENWEATHER_API_KEY);
    }
  }

  analyzeQuery(query: string): { shouldUseTool: boolean; toolName?: string; args?: Record<string, any> } {
    const lowerQuery = query.toLowerCase();
    const words = lowerQuery.split(/\s+/);

    // Weather patterns
    const weatherKeywords = ['weather', 'temperature', 'hot', 'cold', 'warm', 'chilly', 'humid', 'rain', 'raining'];
    const forecastKeywords = ['forecast', 'tomorrow', 'week', 'later', 'next', 'upcoming', 'future', 'days'];
    
    // Check if any word starts with a weather keyword (to catch variations like "temperature", "temperatures", etc)
    const isWeatherQuery = weatherKeywords.some(keyword => 
      words.some(word => word.startsWith(keyword))
    );
    const isForecastQuery = forecastKeywords.some(keyword => 
      words.some(word => word.startsWith(keyword))
    );

    if (isWeatherQuery || isForecastQuery) {
      // Extract location - improved regex to handle more question formats
      const locationMatch = query.match(/(?:in|at|for|is it.*?in)\s+([A-Za-z\s,]+?)(?:\s|$|\?|\.)/i);
      const location = locationMatch ? locationMatch[1].trim() : null;

      if (!location) {
        return { shouldUseTool: false };
      }

      if (isForecastQuery) {
        // Extract number of days
        const daysMatch = query.match(/(\d+)\s*days?/);
        const days = daysMatch ? Math.min(Math.max(parseInt(daysMatch[1]), 1), 7) : 3;

        return {
          shouldUseTool: true,
          toolName: 'get_forecast',
          args: { location, days },
        };
      }

      return {
        shouldUseTool: true,
        toolName: 'get_weather',
        args: { 
          location,
          units: lowerQuery.includes('fahrenheit') ? 'imperial' : 'metric'
        },
      };
    }

    return { shouldUseTool: false };
  }

  async callTool(serverName: string, toolName: string, args: Record<string, any>): Promise<MCPToolResult> {
    // Validate server configuration
    const config = this.serverConfigs.get(serverName);
    if (!config) {
      return {
        tool: toolName,
        result: null,
        error: `MCP server '${serverName}' not configured`,
      };
    }

    try {
      switch (toolName) {
        case 'get_weather':
          if (!this.weatherService) {
            throw new Error('Weather service not initialized. Check OPENWEATHER_API_KEY.');
          }
          const weatherData = await this.weatherService.getCurrentWeather(
            args.location,
            args.units
          );
          return {
            tool: toolName,
            result: weatherData,
          };

        case 'get_forecast':
          if (!this.weatherService) {
            throw new Error('Weather service not initialized. Check OPENWEATHER_API_KEY.');
          }
          const forecastData = await this.weatherService.getForecast(
            args.location,
            args.days
          );
          return {
            tool: toolName,
            result: forecastData,
          };

        default:
          return {
            tool: toolName,
            result: null,
            error: `Tool '${toolName}' not implemented`,
          };
      }
    } catch (error) {
      return {
        tool: toolName,
        result: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  getAvailableTools(): MCPTool[] {
    const tools: MCPTool[] = [];

    if (this.weatherService) {
      tools.push({
        name: 'get_weather',
        description: 'Get current weather information for a location',
        inputSchema: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'City name or location',
            },
            units: {
              type: 'string',
              enum: ['metric', 'imperial'],
              description: 'Temperature unit (metric for Celsius, imperial for Fahrenheit)',
            },
          },
          required: ['location'],
        },
      });

      tools.push({
        name: 'get_forecast',
        description: 'Get weather forecast for a location',
        inputSchema: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'City name or location',
            },
            days: {
              type: 'number',
              description: 'Number of days to forecast (1-7)',
              minimum: 1,
              maximum: 7,
            },
          },
          required: ['location'],
        },
      });
    }

    return tools;
  }
}

export const enhancedMcpClient = new EnhancedMCPClient();