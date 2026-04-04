export interface HourlySeatOccupancy {
  label: string;
  occupancyMinutes: number;
  seatOccupancyRate: number;
}

export interface BusinessDashboardResponse {
  storeId: string;
  date: string;
  hourlySeatOccupancyRate: HourlySeatOccupancy[];
}
