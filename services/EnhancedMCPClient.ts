/**
 * Enhanced MCP Client Implementation with Severity Services
 * File: services/EnhancedMCPClient.ts
 */

import type { MCPServerConfig, MCPTool, MCPToolResult } from './MCPTypes';
import { WeatherService } from './WeatherService';
import { SeverityService } from './SeverityService';

export class EnhancedMCPClient {
  private serverConfigs: Map<string, MCPServerConfig> = new Map();
  private weatherService: WeatherService | null = null;
  private severityService: SeverityService | null = null;

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

    // Configure Severity API servers
    this.serverConfigs.set('severity', {
      url: 'https://api.pixvisonz.com',
      type: 'http',
      bearerToken: process.env.BEARER_TOKEN,
    });

    this.severityService = new SeverityService();
  }

  analyzeQuery(query: string): { shouldUseTool: boolean; toolName?: string; args?: Record<string, any> } {
    const lowerQuery = query.toLowerCase();
    const words = lowerQuery.split(/\s+/);

    // Weather patterns
    const weatherKeywords = ['weather', 'temperature', 'hot', 'cold', 'warm', 'chilly', 'humid', 'rain', 'raining'];
    const forecastKeywords = ['forecast', 'tomorrow', 'week', 'later', 'next', 'upcoming', 'future', 'days'];
    
    const isWeatherQuery = weatherKeywords.some(keyword => 
      words.some(word => word.startsWith(keyword))
    );
    const isForecastQuery = forecastKeywords.some(keyword => 
      words.some(word => word.startsWith(keyword))
    );

    // Severity/Data patterns
    const severityKeywords = ['severity', 'street severity', 'streets'];
    const truckKeywords = ['truck', 'trucks', 'vehicle', 'tracking'];
    const dicKeywords = ['dic', 'dic overview', 'device overview'];
    const feedbackKeywords = ['nea feedback', 'feedback', 'complaints'];
    const defectKeywords = ['defect', 'defect notice', 'inspection'];
    const chartKeywords = ['chart', 'graph', 'visualization', 'level distribution', 'battery status'];

    // Check for weather queries
    if (isWeatherQuery || isForecastQuery) {
      const locationMatch = query.match(/(?:in|at|for|is it.*?in)\s+([A-Za-z\s,]+?)(?:\s|$|\?|\.)/i);
      const location = locationMatch ? locationMatch[1].trim() : null;

      if (!location) {
        return { shouldUseTool: false };
      }

      if (isForecastQuery) {
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

    // Check for severity queries
    if (severityKeywords.some(kw => lowerQuery.includes(kw))) {
      return {
        shouldUseTool: true,
        toolName: 'get_severity',
        args: {},
      };
    }

    // Check for truck queries
    if (truckKeywords.some(kw => lowerQuery.includes(kw))) {
      const typeMatch = query.match(/type[:\s]+(\w+)/i);
      const timeMatch = query.match(/time[:\s]+(\d+)/i);
      
      return {
        shouldUseTool: true,
        toolName: 'get_truck_data',
        args: {
          trackType: typeMatch ? typeMatch[1] : 'odcai_track2',
          selectedTime: timeMatch ? parseInt(timeMatch[1]) : 3,
        },
      };
    }

    // Check for DIC queries
    if (dicKeywords.some(kw => lowerQuery.includes(kw))) {
      return {
        shouldUseTool: true,
        toolName: 'get_dic_overview',
        args: {},
      };
    }

    // Check for feedback queries
    if (feedbackKeywords.some(kw => lowerQuery.includes(kw))) {
      const dateMatch = query.match(/(\d{4}-\d{2}-\d{2})/);
      const todayMatch = lowerQuery.includes('today');
      
      const args: any = {};
      
      if (todayMatch) {
        const today = new Date().toISOString().split('T')[0];
        args.startDate = today;
        args.endDate = today;
      } else if (dateMatch) {
        args.startDate = dateMatch[1];
      }

      // Check for type
      if (lowerQuery.includes('received')) args.type = 'received';
      if (lowerQuery.includes('acknowledged')) args.type = 'acknowledge';
      if (lowerQuery.includes('resolved')) args.type = 'resolved';
      if (lowerQuery.includes('replied')) args.type = 'reply';

      return {
        shouldUseTool: true,
        toolName: 'search_nea_feedback',
        args,
      };
    }

    // Check for defect notice queries
    if (defectKeywords.some(kw => lowerQuery.includes(kw))) {
      const dateMatch = query.match(/(\d{4}-\d{2}-\d{2})/);
      const args: any = {};
      
      if (dateMatch) {
        args.startDate = dateMatch[1];
      }

      // Extract other filters
      const sectorMatch = query.match(/sector[:\s]+(\w+)/i);
      const regionMatch = query.match(/region[:\s]+(\w+)/i);
      
      if (sectorMatch) args.sector = sectorMatch[1];
      if (regionMatch) args.region = regionMatch[1];

      return {
        shouldUseTool: true,
        toolName: 'search_defect_notice',
        args,
      };
    }

    // Check for chart queries
    if (chartKeywords.some(kw => lowerQuery.includes(kw))) {
      let chartType = 'level_distribution';
      
      if (lowerQuery.includes('battery')) chartType = 'battery_status';
      if (lowerQuery.includes('bar') || lowerQuery.includes('summary')) chartType = 'summary_bar';
      if (lowerQuery.includes('location')) chartType = 'location_distribution';
      if (lowerQuery.includes('trend') || lowerQuery.includes('line')) chartType = 'level_trend';

      return {
        shouldUseTool: true,
        toolName: 'get_chart_data',
        args: { chartType },
      };
    }

    return { shouldUseTool: false };
  }

  async callTool(serverName: string, toolName: string, args: Record<string, any>): Promise<MCPToolResult> {
    const config = this.serverConfigs.get(serverName);
    if (!config) {
      return {
        tool: toolName,
        result: null,
        error: `MCP server '${serverName}' not configured`,
      };
    }

    try {
      // Weather tools
      if (toolName === 'get_weather') {
        if (!this.weatherService) {
          throw new Error('Weather service not initialized. Check OPENWEATHER_API_KEY.');
        }
        const weatherData = await this.weatherService.getCurrentWeather(args.location, args.units);
        return { tool: toolName, result: weatherData };
      }

      if (toolName === 'get_forecast') {
        if (!this.weatherService) {
          throw new Error('Weather service not initialized. Check OPENWEATHER_API_KEY.');
        }
        const forecastData = await this.weatherService.getForecast(args.location, args.days);
        return { tool: toolName, result: forecastData };
      }

      // Severity tools
      if (!this.severityService) {
        throw new Error('Severity service not initialized.');
      }

      if (toolName === 'get_severity') {
        const data = await this.severityService.getSeverity();
        return { tool: toolName, result: data };
      }

      if (toolName === 'get_truck_data') {
        const data = await this.severityService.getTruckData(args.trackType, args.selectedTime);
        return { tool: toolName, result: data };
      }

      if (toolName === 'get_dic_overview') {
        const data = await this.severityService.getDICOverview();
        return { tool: toolName, result: data };
      }

      if (toolName === 'search_nea_feedback') {
        const data = await this.severityService.searchNEAFeedback(args);
        return { tool: toolName, result: data };
      }

      if (toolName === 'search_defect_notice') {
        const data = await this.severityService.searchDefectNotice(args);
        return { tool: toolName, result: data };
      }

      if (toolName === 'get_chart_data') {
        const data = await this.severityService.getChartData(args.chartType);
        return { tool: toolName, result: data };
      }

      return {
        tool: toolName,
        result: null,
        error: `Tool '${toolName}' not implemented`,
      };
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

    // Weather tools
    if (this.weatherService) {
      tools.push({
        name: 'get_weather',
        description: 'Get current weather information for a location',
        inputSchema: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'City name or location' },
            units: { type: 'string', enum: ['metric', 'imperial'], description: 'Temperature unit' },
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
            location: { type: 'string', description: 'City name or location' },
            days: { type: 'number', description: 'Number of days (1-7)', minimum: 1, maximum: 7 },
          },
          required: ['location'],
        },
      });
    }

    // Severity tools
    if (this.severityService) {
      tools.push(
        {
          name: 'get_severity',
          description: 'Get street severity data',
          inputSchema: { type: 'object', properties: {}, required: [] },
        },
        {
          name: 'get_truck_data',
          description: 'Get truck tracking data',
          inputSchema: {
            type: 'object',
            properties: {
              trackType: { type: 'string', description: 'Track type (default: odcai_track2)' },
              selectedTime: { type: 'number', description: 'Selected time (default: 3)' },
            },
          },
        },
        {
          name: 'get_dic_overview',
          description: 'Get DIC overview data',
          inputSchema: { type: 'object', properties: {}, required: [] },
        },
        {
          name: 'search_nea_feedback',
          description: 'Search NEA feedback records',
          inputSchema: {
            type: 'object',
            properties: {
              startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
              endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
              type: { type: 'string', enum: ['received', 'acknowledge', 'resolved', 'reply'] },
              caseId: { type: 'string' },
              sector: { type: 'string' },
              status: { type: 'string' },
            },
          },
        },
        {
          name: 'search_defect_notice',
          description: 'Search defect notice records',
          inputSchema: {
            type: 'object',
            properties: {
              startDate: { type: 'string' },
              endDate: { type: 'string' },
              routeId: { type: 'string' },
              dpcOfficer: { type: 'string' },
              supervisor: { type: 'string' },
              region: { type: 'string' },
              sector: { type: 'string' },
              status: { type: 'string' },
            },
          },
        },
        {
          name: 'get_chart_data',
          description: 'Get chart visualization data',
          inputSchema: {
            type: 'object',
            properties: {
              chartType: {
                type: 'string',
                enum: ['level_distribution', 'summary_bar', 'battery_status', 'location_distribution', 'level_trend'],
              },
            },
            required: ['chartType'],
          },
        }
      );
    }

    return tools;
  }
}

export const enhancedMcpClient = new EnhancedMCPClient();