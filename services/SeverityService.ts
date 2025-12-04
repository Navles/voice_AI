/**
 * Severity and Data Services Implementation
 * File: services/SeverityService.ts
 */

// Add new types to MCPTypes.ts first, then import them here
export interface SeverityData {
  status: string;
  timestamp: string;
  message: string;
  data: any[];
}

export interface TruckData {
  status: string;
  timestamp: string;
  message: string;
  trackType: string;
  selectedTime: number;
  data: any[];
}

export interface DICOverviewData {
  status: string;
  xaxes: string;
  labels: string[];
  values: number[];
}

export interface NEAFeedbackData {
  status: string;
  count: number;
  filters: Record<string, any>;
  data: any[];
}

export interface DefectNoticeData {
  status: string;
  count: number;
  filters: Record<string, any>;
  data: any[];
}

export interface ChartData {
  type: 'pie' | 'bar' | 'line';
  title: string;
  labels?: string[];
  values?: number[];
  colors?: string[];
  xLabels?: string[];
  yValues?: number[];
  xTitle?: string;
  yTitle?: string;
}

interface MCPError {
  code: string;
  message: string;
  details?: any;
}

export class SeverityService {
  private apiBase: string;
  private apiBase1: string;
  private apiBase2: string;
  private bearerToken: string;

  constructor() {
    this.apiBase = 'https://api.pixvisonz.com/v1';
    this.apiBase1 = 'https://ctm.sensz.ai';
    this.apiBase2 = 'https://api.pixvisonz.com/v2';
    this.bearerToken = process.env.BEARER_TOKEN || 'eyJjdHkiOiJKV1QiLCJlbmMiOiJBMTI4R0NNIiwiYWxnIjoiUlNBLU9BRVAtMjU2In0.pl2ohZA4t6EP0Vt5stbkee4esqJwW2tWPyTTHDZllehheqQsekikKV8nSg_-IScsklC2H4QBzfbivGC_Y1jNCdR2xwJaLY-7auxksNBb5hdcOw_6kenH4fCHyhu8W56XwnXN0KclF6gBbeto-xTAhJdypxlQcC6tsLf1kYL_IwscnuQBQpj_7CLkzTNTK96EQ8Xqo0kvfNcTTkd3sKzz_VPtCI858mNuHH4pEnVoUUidWr2YDZ4_Iop6NXOF8GunjxTzgjVyEZgh25XGoZAbGBYUbAvrY_PldrR_Te2DucfAvohQi7m6SrbKZklZBrLaW7a_kjmwJo9z_Q2bGdPdiw.s8nHUXSU-u9QQVwa.a0o9p9Xdk17InVTXQ3333fZt-OZqXJn50RKFSkFLp3cdXk9R4vK1zUEjeB1GqQCSW-c5cRH04mUlaA7HzwaHDKf4D2VsrGwOT_ibiKuyFYEjx2vDwMLTuOMocuMtX698584CNRgEL9C_e9mI9S3ekS03sbilp1sEgITpaCPh6QxH3eXZu1AP36xcPCYS2rSRNcZWNlxpUGlPIGpL_92E8ZWxVZCv2ZalT3QEHq0a95Cv3P3Q6Cfd-YKRrVzx4PuiOFoabgNQHbTDH6vOejlskzGFXVj_Ebb4SD4eWJiW1KztNi17dT_m7ofnxSdHfXZiGrNI-FIxJJaFPGeSFf6FeIwOQsLkrrBaySZuhr7QLusdkwIGkGZiapN8i8Sou1YyIXe630F94rrxHzw7qSboVFqdXCgPehNXNwD75aQsRnJUZY8bmgCrKL7N8l9S7Nq2VpTsbuAXttoWWm-LICfjyvIjgcKwjaQHB7QsdH2eWf17YmgUSEpqRl-8Y8rsmfCq8Y1fc13G5pG3IVxvjM5siuxuGB80ZKZztfnAh13e-DyxqkeIndQSkjYB_PUjO9i8TEqBzVJsxQGFbHHlRiWDUq1OaXWIgjq7cvG8YcvXdaSw4E3ugFdpbB4uOzbSkSJRWgh_bQrXXQeycb73FcYgQw6MsuACgUP83s-LjmXde5sYF7cogL1inRYKB9F7mxxF2YyOVNjhwSNby0nvTlvJtMYzFod6Mu7og1ajEDDXCbvVRzxZM1OyFmW8MwljvCIbEkuonzggUk4MNc3V1oCXz3uG5S_Qmpty0vsb_Y41OTEZhCAonN8E1RRTYFNBP8CKkHKqGcLWxQ.rYDMSzSwb9vIAHToYU0p1A';
  }

  private async makeRequest<T>(url: string, maxWait: number = 15000): Promise<T> {
    const headers = {
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9,ta-IN;q=0.8,ta;q=0.7',
      'Authorization': `Bearer ${this.bearerToken}`,
      'Connection': 'keep-alive',
      'Origin': 'https://ctm.sensz.ai',
      'Referer': 'https://ctm.sensz.ai/',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), maxWait);

      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw this.formatError(new Error(`Request timed out after ${maxWait}ms`));
      }
      throw this.formatError(error);
    }
  }

  // ========== SEVERITY ==========
  async getSeverity(): Promise<SeverityData> {
    const url = `${this.apiBase}/geo/streets/severity`;
    const data = await this.makeRequest<any>(url);

    return {
      status: 'success',
      timestamp: data.timeStamp || new Date().toISOString(),
      message: data.message || 'Success',
      data: data.data || [],
    };
  }

  // ========== TRUCK DATA ==========
  async getTruckData(trackType: string = 'odcai_track2', selectedTime: number = 3): Promise<TruckData> {
    const url = `${this.apiBase}/geo/map/plots/view?type=${trackType}&selectedtime=${selectedTime}`;
    const data = await this.makeRequest<any>(url);

    return {
      status: 'success',
      timestamp: data.timeStamp || new Date().toISOString(),
      message: data.message || 'Success',
      trackType,
      selectedTime,
      data: data.data || [],
    };
  }

  // ========== DIC OVERVIEW ==========
  async getDICOverview(): Promise<DICOverviewData> {
    const url = `${this.apiBase1}/wms/chart/CTM-20241202-2/dic/overview?fromDate=2025-10-13&groupId=SGOF-20241227-8`;
    const data = await this.makeRequest<any>(url);

    const responseBody = data.response?.body || {};
    const xaxes = responseBody.xaxes || 'N/A';
    const yaxes = responseBody.yaxes || [];

    const labels = yaxes.map((item: any) => item.name || 'Unknown');
    const values = yaxes.map((item: any) => {
      try {
        return parseFloat(item.value) || 0;
      } catch {
        return 0;
      }
    });

    return {
      status: 'success',
      xaxes,
      labels,
      values,
    };
  }

  // ========== NEA FEEDBACK ==========
  async searchNEAFeedback(params: {
    startDate?: string;
    endDate?: string;
    type?: 'received' | 'acknowledge' | 'resolved' | 'reply';
    caseId?: string;
    sector?: string;
    status?: string;
  }): Promise<NEAFeedbackData> {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.type) queryParams.append('type', params.type);
    if (params.caseId) queryParams.append('caseId', params.caseId);
    if (params.sector) queryParams.append('sector', params.sector);
    if (params.status) queryParams.append('status', params.status);

    const url = `${this.apiBase2}/api/necfeedback?${queryParams.toString()}`;
    const data = await this.makeRequest<any>(url);

    const feedbacks = data.response?.body || [];

    return {
      status: 'success',
      count: feedbacks.length,
      filters: params,
      data: feedbacks,
    };
  }

  // ========== DEFECT NOTICE ==========
  async searchDefectNotice(params: {
    startDate?: string;
    endDate?: string;
    routeId?: string;
    dpcOfficer?: string;
    supervisor?: string;
    region?: string;
    sector?: string;
    status?: string;
  }): Promise<DefectNoticeData> {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.routeId) queryParams.append('routeId', params.routeId);
    if (params.dpcOfficer) queryParams.append('dpcOfficer', params.dpcOfficer);
    if (params.supervisor) queryParams.append('supervisor', params.supervisor);
    if (params.region) queryParams.append('region', params.region);
    if (params.sector) queryParams.append('sector', params.sector);
    if (params.status) queryParams.append('status', params.status);

    const url = `${this.apiBase2}/api/defectnotice?${queryParams.toString()}`;
    const data = await this.makeRequest<any>(url);

    const notices = data.response?.body || [];

    return {
      status: 'success',
      count: notices.length,
      filters: params,
      data: notices,
    };
  }

  // ========== CHART DATA ==========
  async getChartData(chartType: string = 'level_distribution'): Promise<ChartData> {
    const url = `${this.apiBase1}/wms/devices/CTM-20241202-2?groupId=SGOF-20241227-8`;
    const data = await this.makeRequest<any>(url);

    const devices = data.response?.body || [];

    switch (chartType) {
      case 'level_distribution':
        return this.generateLevelDistribution(devices);
      case 'summary_bar':
        return this.generateSummaryBar(devices);
      case 'battery_status':
        return this.generateBatteryStatus(devices);
      case 'location_distribution':
        return this.generateLocationDistribution(devices);
      case 'level_trend':
        return this.generateLevelTrend();
      default:
        throw new Error(`Unknown chart type: ${chartType}`);
    }
  }

  private generateLevelDistribution(devices: any[]): ChartData {
    const critical = devices.filter(d => (d.level || 0) > 70).length;
    const warning = devices.filter(d => (d.level || 0) >= 60 && (d.level || 0) <= 70).length;
    const normal = devices.filter(d => (d.level || 0) >= 40 && (d.level || 0) < 60).length;
    const good = devices.filter(d => (d.level || 0) < 40).length;

    return {
      type: 'pie',
      title: 'DIC Device Level Distribution',
      labels: ['Critical (>70%)', 'Warning (60-70%)', 'Normal (40-60%)', 'Good (<40%)'],
      values: [critical, warning, normal, good],
      colors: ['#d32f2f', '#f57c00', '#1976d2', '#388e3c'],
    };
  }

  private generateSummaryBar(devices: any[]): ChartData {
    const critical = devices.filter(d => (d.level || 0) > 75).length;
    const moderate = devices.filter(d => (d.level || 0) >= 50 && (d.level || 0) <= 75).length;
    const good = devices.filter(d => (d.level || 0) < 50).length;

    return {
      type: 'bar',
      title: 'DIC Device Status Summary (Bar Chart)',
      labels: ['Critical', 'Moderate', 'Good'],
      values: [critical, moderate, good],
      colors: ['#d32f2f', '#f57c00', '#388e3c'],
    };
  }

  private generateBatteryStatus(devices: any[]): ChartData {
    const critical = devices.filter(d => (d.battery || 100) < 20).length;
    const low = devices.filter(d => (d.battery || 100) >= 20 && (d.battery || 100) < 40).length;
    const medium = devices.filter(d => (d.battery || 100) >= 40 && (d.battery || 100) < 70).length;
    const good = devices.filter(d => (d.battery || 100) >= 70).length;

    return {
      type: 'pie',
      title: 'Battery Status Distribution',
      labels: ['Critical (<20%)', 'Low (20-40%)', 'Medium (40-70%)', 'Good (≥70%)'],
      values: [critical, low, medium, good],
      colors: ['#d32f2f', '#f57c00', '#fbc02d', '#388e3c'],
    };
  }

  private generateLocationDistribution(devices: any[]): ChartData {
    const locationCounts: Record<string, number> = {};
    
    devices.forEach(device => {
      const addr = device.address || 'Unknown';
      locationCounts[addr] = (locationCounts[addr] || 0) + 1;
    });

    const topLocations = Object.entries(locationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    return {
      type: 'bar',
      title: 'Top 10 Locations by Device Count',
      labels: topLocations.map(([loc]) => loc),
      values: topLocations.map(([, count]) => count),
      colors: Array(10).fill('#1976d2'),
    };
  }

  private generateLevelTrend(): ChartData {
    // Dummy data for trend (replace with real historical data if available)
    return {
      type: 'line',
      title: 'Average Device Level Trend (Past 7 Days)',
      xLabels: ['Oct 16', 'Oct 17', 'Oct 18', 'Oct 19', 'Oct 20', 'Oct 21', 'Oct 22'],
      yValues: [45, 48, 55, 62, 59, 50, 42],
      xTitle: 'Date',
      yTitle: 'Avg. Level (%)',
    };
  }

  private formatError(error: any): MCPError {
    return {
      code: 'SEVERITY_SERVICE_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: error,
    };
  }
}