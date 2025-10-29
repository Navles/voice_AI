/**
 * MCP Types Definition
 * File: services/MCPTypes.ts
 */

// Server Configuration Types
export interface MCPServerConfig {
  url: string;
  type: 'http' | 'websocket';
  apiKey?: string;
}

// Tool Definition Types
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

// Tool Call Types
export interface MCPToolCall {
  tool: string;
  arguments: Record<string, any>;
}

export interface MCPToolResult {
  tool: string;
  result: any;
  error?: string;
}

// Weather Data Types
export interface WeatherData {
  location: string;
  country: string;
  temperature: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  condition: string;
  description: string;
  wind_speed: number;
  clouds: number;
  units: 'celsius' | 'fahrenheit';
  timestamp: string;
}

export interface ForecastDay {
  date: string;
  high: number;
  low: number;
  condition: string;
  humidity: number;
  precipitation: 'Yes' | 'No';
}

export interface ForecastData {
  location: string;
  country: string;
  forecast: ForecastDay[];
}

// Error Types
export interface MCPError {
  code: string;
  message: string;
  details?: any;
}