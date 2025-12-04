/**
 * Data Display Components
 * File: components/DataDisplay.tsx
 */

import React from 'react';
import type {
  SeverityData,
  TruckData,
  DICOverviewData,
  NEAFeedbackData,
  DefectNoticeData,
  ChartData,
} from '../services/MCPTypes';

interface DataDisplayProps {
  data: SeverityData | TruckData | DICOverviewData | NEAFeedbackData | DefectNoticeData | ChartData;
  type: 'severity' | 'truck' | 'dic' | 'feedback' | 'defect' | 'chart';
  onClose: () => void;
}

export const DataDisplay: React.FC<DataDisplayProps> = ({ data, type, onClose }) => {
  const renderContent = () => {
    switch (type) {
      case 'severity':
        return <SeverityDisplay data={data as SeverityData} />;
      case 'truck':
        return <TruckDisplay data={data as TruckData} />;
      case 'dic':
        return <DICDisplay data={data as DICOverviewData} />;
      case 'feedback':
        return <FeedbackDisplay data={data as NEAFeedbackData} />;
      case 'defect':
        return <DefectDisplay data={data as DefectNoticeData} />;
      case 'chart':
        return <ChartDisplay data={data as ChartData} />;
      default:
        return <div>Unknown data type</div>;
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Data Results</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {renderContent()}
    </div>
  );
};

const SeverityDisplay: React.FC<{ data: SeverityData }> = ({ data }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-gray-600">Status</p>
        <p className="text-lg font-semibold text-blue-600">{data.status}</p>
      </div>
      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-sm text-gray-600">Records</p>
        <p className="text-lg font-semibold">{data.data.length}</p>
      </div>
    </div>
    <div className="bg-gray-50 p-4 rounded-lg">
      <p className="text-sm text-gray-600 mb-2">Timestamp</p>
      <p className="text-sm font-mono">{new Date(data.timestamp).toLocaleString()}</p>
    </div>
    {data.data.length > 0 && (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600 mb-2">Sample Data</p>
        <pre className="text-xs overflow-x-auto">{JSON.stringify(data.data[0], null, 2)}</pre>
      </div>
    )}
  </div>
);

const TruckDisplay: React.FC<{ data: TruckData }> = ({ data }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-gray-600">Track Type</p>
        <p className="text-lg font-semibold text-blue-600">{data.trackType}</p>
      </div>
      <div className="bg-green-50 p-3 rounded-lg">
        <p className="text-sm text-gray-600">Selected Time</p>
        <p className="text-lg font-semibold text-green-600">{data.selectedTime}</p>
      </div>
      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-sm text-gray-600">Records</p>
        <p className="text-lg font-semibold">{data.data.length}</p>
      </div>
    </div>
  </div>
);

const DICDisplay: React.FC<{ data: DICOverviewData }> = ({ data }) => (
  <div className="space-y-4">
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">DIC Overview</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {data.labels.map((label, idx) => (
          <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-blue-600">{data.values[idx]}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const FeedbackDisplay: React.FC<{ data: NEAFeedbackData }> = ({ data }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-gray-600">Status</p>
        <p className="text-lg font-semibold text-blue-600">{data.status}</p>
      </div>
      <div className="bg-green-50 p-3 rounded-lg">
        <p className="text-sm text-gray-600">Total Records</p>
        <p className="text-lg font-semibold text-green-600">{data.count}</p>
      </div>
    </div>
    {Object.keys(data.filters).length > 0 && (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600 mb-2">Filters Applied</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.filters).map(([key, value]) => (
            <span key={key} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              {key}: {value}
            </span>
          ))}
        </div>
      </div>
    )}
    {data.data.length > 0 && (
      <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
        <p className="text-sm text-gray-600 mb-2">Feedback Records ({data.count} total)</p>
        <div className="space-y-2">
          {data.data.slice(0, 5).map((item: any, idx: number) => (
            <div key={idx} className="bg-white p-3 rounded border border-gray-200">
              <pre className="text-xs overflow-x-auto">{JSON.stringify(item, null, 2)}</pre>
            </div>
          ))}
          {data.count > 5 && (
            <p className="text-sm text-gray-500 text-center">
              Showing 5 of {data.count} records
            </p>
          )}
        </div>
      </div>
    )}
  </div>
);

const DefectDisplay: React.FC<{ data: DefectNoticeData }> = ({ data }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-orange-50 p-3 rounded-lg">
        <p className="text-sm text-gray-600">Status</p>
        <p className="text-lg font-semibold text-orange-600">{data.status}</p>
      </div>
      <div className="bg-red-50 p-3 rounded-lg">
        <p className="text-sm text-gray-600">Total Notices</p>
        <p className="text-lg font-semibold text-red-600">{data.count}</p>
      </div>
    </div>
    {Object.keys(data.filters).length > 0 && (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600 mb-2">Filters Applied</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.filters).map(([key, value]) => (
            <span key={key} className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
              {key}: {value}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);

const ChartDisplay: React.FC<{ data: ChartData }> = ({ data }) => {
  if (data.type === 'pie' && data.labels && data.values && data.colors) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{data.title}</h3>
        <div className="grid grid-cols-2 gap-4">
          {data.labels.map((label, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg"
              style={{ backgroundColor: `${data.colors![idx]}20` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: data.colors![idx] }}
                />
                <p className="text-sm text-gray-700">{label}</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: data.colors![idx] }}>
                {data.values![idx]}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.type === 'bar' && data.labels && data.values) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{data.title}</h3>
        <div className="space-y-2">
          {data.labels.map((label, idx) => {
            const maxValue = Math.max(...data.values!);
            const percentage = (data.values![idx] / maxValue) * 100;
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">{label}</span>
                  <span className="font-semibold">{data.values![idx]}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-4">
                  <div
                    className="h-4 rounded-full transition-all"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: data.colors?.[idx] || '#1976d2',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (data.type === 'line' && data.xLabels && data.yValues) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{data.title}</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="h-64 flex items-end gap-2">
            {data.yValues.map((value, idx) => {
              const maxValue = Math.max(...data.yValues!);
              const height = (value / maxValue) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-blue-200 rounded-t" style={{ height: `${height}%` }}>
                    <div className="text-xs text-center pt-1">{value}</div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{data.xLabels![idx]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return <div className="text-gray-500">Chart data not available</div>;
};