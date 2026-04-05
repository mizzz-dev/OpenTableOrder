export interface HourlySeatOccupancy {
  label: string;
  occupancyMinutes: number;
  seatOccupancyRate: number;
}

export interface HourlyAverageTicketSize {
  label: string;
  sales: number;
  guests: number;
  averageTicketSize: number;
}

export interface OperationsKpi {
  averageStayMinutes: number;
  tableTurnoverRate: number;
}

export interface BusinessDashboardResponse {
  storeId: string;
  date: string;
  hourlySeatOccupancyRate: HourlySeatOccupancy[];
  hourlyAverageTicketSize: HourlyAverageTicketSize[];
  operationsKpi: OperationsKpi;
}

export interface BusinessDashboardQuery {
  storeId: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  days?: number;
  timezone?: string;
}
