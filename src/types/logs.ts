export type LogTab = 'audit' | 'monitoring';

export interface MonitoringLog {
  id: string;
  timestamp: string;
  event_type: 'system_performance' | 'api_latency' | 'error_rate' | 'user_activity' | 'resource_usage';
  metric_name: string;
  metric_value: number;
  details: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  operation: 'create' | 'update' | 'delete';
  table_name: string;
  record_id: string;
  details: string;
}