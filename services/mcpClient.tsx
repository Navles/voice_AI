/**
 * MCP Client for integrating with Model Context Protocol servers
 * File: services/mcpClient.ts
 */

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPServer {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
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

class MCPClient {
  private availableTools: Map<string, MCPTool> = new Map();
  private servers: MCPServer[] = [];

  constructor() {
    this.initializeServers();
  }

  private initializeServers() {
    // Weather MCP Server
    this.servers.push({
      name: 'weather',
      command: 'weather-mcp-server',
      args: [],
    });

    // Register weather tools
    this.registerTool({
      name: 'get_weather',
      description: 'Get current weather information for a location',
      inputSchema: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city name or location to get weather for',
          },
          units: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description: 'Temperature unit (default: celsius)',
          },
        },
        required: ['location'],
      },
    });

    this.registerTool({
      name: 'get_forecast',
      description: 'Get weather forecast for the next few days',
      inputSchema: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city name or location',
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

  registerTool(tool: MCPTool) {
    this.availableTools.set(tool.name, tool);
  }

  getAvailableTools(): MCPTool[] {
    return Array.from(this.availableTools.values());
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<MCPToolResult> {
    const tool = this.availableTools.get(toolName);
    
    if (!tool) {
      return {
        tool: toolName,
        result: null,
        error: `Tool '${toolName}' not found`,
      };
    }

    try {
      switch (toolName) {
        case 'get_weather':
          return await this.getWeather(args as { location: string; units?: string });
        case 'get_forecast':
          return await this.getForecast(args as { location: string; days?: number });
        default:
          return {
            tool: toolName,
            result: null,
            error: 'Tool handler not implemented',
          };
      }
    } catch (error) {
      return {
        tool: toolName,
        result: null,
        error: (error as Error).message,
      };
    }
  }

  private async getWeather(args: { location: string; units?: string }): Promise<MCPToolResult> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const weatherData = this.simulateWeatherData(args.location, args.units || 'celsius');

    return {
      tool: 'get_weather',
      result: weatherData,
    };
  }

  private async getForecast(args: { location: string; days?: number }): Promise<MCPToolResult> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const days = Math.min(args.days || 3, 7);
    const forecast = this.simulateForecastData(args.location, days);

    return {
      tool: 'get_forecast',
      result: forecast,
    };
  }

  private simulateWeatherData(location: string, units: string) {
    const temp = units === 'fahrenheit' ? 72 : 22;
    const conditions = ['Sunny', 'Cloudy', 'Partly Cloudy', 'Rainy', 'Clear'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    return {
      location,
      temperature: temp + Math.floor(Math.random() * 10 - 5),
      units,
      condition,
      humidity: 60 + Math.floor(Math.random() * 30),
      wind_speed: 5 + Math.floor(Math.random() * 20),
      description: `Current weather in ${location}: ${condition} with ${temp}°${units === 'fahrenheit' ? 'F' : 'C'}`,
    };
  }

  private simulateForecastData(location: string, days: number) {
    const forecast = [];
    const conditions = ['Sunny', 'Cloudy', 'Partly Cloudy', 'Rainy', 'Clear'];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        high: 20 + Math.floor(Math.random() * 15),
        low: 10 + Math.floor(Math.random() * 10),
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        precipitation: Math.floor(Math.random() * 100),
      });
    }

    return {
      location,
      forecast,
      description: `${days}-day forecast for ${location}`,
    };
  }

  analyzeQuery(query: string): { shouldUseTool: boolean; toolName?: string; args?: Record<string, any> } {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('weather') || lowerQuery.includes('temperature') || lowerQuery.includes('forecast')) {
      const locationMatch = lowerQuery.match(/(?:in|for|at)\s+([a-z\s]+?)(?:\s|$|\?|,)/i);
      const location = locationMatch ? locationMatch[1].trim() : 'current location';

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
        args: { location, units: 'celsius' },
      };
    }

    return { shouldUseTool: false };
  }
}

export const mcpClient = new MCPClient();