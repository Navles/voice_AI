/**
 * Real Weather MCP Server Implementation
 * File: services/realMcpClient.ts
 * 
 * This shows how to connect to a real MCP server using HTTP or WebSocket
 * For production use, you would run an actual MCP server separately
 */

export interface MCPServerConfig {
  url: string;
  type: 'http' | 'websocket';
  apiKey?: string;
}

export interface MCPToolCall {
  tool: string;
  arguments: Record<string, any>;
}

export interface MCPToolResult {
  tool: string;
  result: any;
  error?: string;
}

class RealMCPClient {
  private serverConfigs: Map<string, MCPServerConfig> = new Map();
  private wsConnections: Map<string, WebSocket> = new Map();

  constructor() {
    this.initializeServers();
  }

  // Analyze user query to determine if it needs weather data
  analyzeQuery(query: string): { shouldUseTool: boolean; toolName?: string; args?: Record<string, any> } {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('weather') || lowerQuery.includes('temperature') || lowerQuery.includes('forecast')) {
      const locationMatch = lowerQuery.match(/(?:in|for|at)\s+([a-z\s]+?)(?:\s|$|\?|,)/i);
      const location = locationMatch ? locationMatch[1].trim() : null;
      
      if (!location) {
        return { shouldUseTool: false };
      }

      if (lowerQuery.includes('forecast') || lowerQuery.includes('next') || lowerQuery.includes('week')) {
        const daysMatch = lowerQuery.match(/(\d+)\s*days?/);
        const days = daysMatch ? parseInt(daysMatch[1]) : 3;

        return {
          shouldUseTool: true,
          toolName: 'get_forecast',
          args: { location, days },
        };
      }

      return {
        shouldUseTool: true,
        toolName: 'get_weather',
        args: { location },
      };
    }

    return { shouldUseTool: false };
  }

  private initializeServers() {
    // Example: OpenWeather API as MCP server
    this.serverConfigs.set('weather', {
      url: 'https://api.openweathermap.org/data/2.5',
      type: 'http',
      apiKey: process.env.OPENWEATHER_API_KEY || '',
    });

    // Example: Custom MCP server via WebSocket
    // this.serverConfigs.set('custom', {
    //   url: 'ws://localhost:8080/mcp',
    //   type: 'websocket',
    // });
  }

  async callTool(serverName: string = 'weather', toolName: string, args: Record<string, any>): Promise<MCPToolResult> {
    const config = this.serverConfigs.get(serverName);
    
    if (!config) {
      return {
        tool: toolName,
        result: null,
        error: `MCP server '${serverName}' not configured`,
      };
    }
    
    // Check if OpenWeather API key is configured
    if (!config.apiKey) {
      return {
        tool: toolName,
        result: null,
        error: 'OpenWeather API key not configured. Please set OPENWEATHER_API_KEY in .env.local',
      };
    }

    try {
      if (config.type === 'http') {
        return await this.callHttpTool(config, toolName, args);
      } else {
        return await this.callWebSocketTool(config, toolName, args);
      }
    } catch (error) {
      return {
        tool: toolName,
        result: null,
        error: (error as Error).message,
      };
    }
  }

  private async callHttpTool(
    config: MCPServerConfig,
    toolName: string,
    args: Record<string, any>
  ): Promise<MCPToolResult> {
    // Example: Real weather API call
    if (toolName === 'get_weather') {
      const { location, units = 'metric' } = args;
      
      const url = `${config.url}/weather?q=${encodeURIComponent(location)}&appid=${config.apiKey}&units=${units}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        tool: toolName,
        result: {
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
        },
      };
    }

    if (toolName === 'get_forecast') {
      const { location, days = 3 } = args;
      
      const url = `${config.url}/forecast?q=${encodeURIComponent(location)}&appid=${config.apiKey}&units=metric&cnt=${days * 8}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Group forecast by day
      const dailyForecasts = this.processForecastData(data.list, days);
      
      return {
        tool: toolName,
        result: {
          location: data.city.name,
          country: data.city.country,
          forecast: dailyForecasts,
        },
      };
    }

    throw new Error(`Tool '${toolName}' not implemented`);
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
      const conditions = items.map(i => i.weather[0].main);
      
      result.push({
        date,
        high: Math.max(...temps),
        low: Math.min(...temps),
        condition: this.getMostFrequent(conditions),
        humidity: Math.round(items.reduce((sum, i) => sum + i.main.humidity, 0) / items.length),
        precipitation: items.some(i => i.rain) ? 'Yes' : 'No',
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

  private async callWebSocketTool(
    config: MCPServerConfig,
    toolName: string,
    args: Record<string, any>
  ): Promise<MCPToolResult> {
    return new Promise((resolve, reject) => {
      let ws = this.wsConnections.get(config.url);
      
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        ws = new WebSocket(config.url);
        this.wsConnections.set(config.url, ws);
      }

      const messageId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const messageHandler = (event: MessageEvent) => {
        try {
          const response = JSON.parse(event.data);
          
          if (response.id === messageId) {
            ws.removeEventListener('message', messageHandler);
            
            if (response.error) {
              resolve({
                tool: toolName,
                result: null,
                error: response.error,
              });
            } else {
              resolve({
                tool: toolName,
                result: response.result,
              });
            }
          }
        } catch (error) {
          reject(error);
        }
      };

      ws.addEventListener('message', messageHandler);
      
      ws.addEventListener('error', (error) => {
        reject(new Error('WebSocket error'));
      });

      if (ws.readyState === WebSocket.CONNECTING) {
        ws.addEventListener('open', () => {
          ws.send(JSON.stringify({
            id: messageId,
            tool: toolName,
            arguments: args,
          }));
        });
      } else if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          id: messageId,
          tool: toolName,
          arguments: args,
        }));
      } else {
        reject(new Error('WebSocket is not open'));
      }

      // Timeout after 30 seconds
      setTimeout(() => {
        ws.removeEventListener('message', messageHandler);
        reject(new Error('Request timeout'));
      }, 30000);
    });
  }

  closeAllConnections() {
    this.wsConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    this.wsConnections.clear();
  }
}

// Usage example:
export const realMcpClient = new RealMCPClient();

/*
 * To use this in your App.tsx:
 * 
 * import { realMcpClient } from './services/realMcpClient';
 * 
 * // Instead of mcpClient.callTool(), use:
 * const result = await realMcpClient.callTool('weather', 'get_weather', {
 *   location: 'New York',
 *   units: 'metric'
 * });
 * 
 * Note: You need to set OPENWEATHER_API_KEY in your environment variables
 * Get a free API key from: https://openweathermap.org/api
 */

/*
 * Environment variable setup in vite.config.ts:
 * 
 * define: {
 *   'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
 *   'process.env.OPENWEATHER_API_KEY': JSON.stringify(env.OPENWEATHER_API_KEY)
 * }
 * 
 * And in .env.local:
 * OPENWEATHER_API_KEY=your_api_key_here
 */