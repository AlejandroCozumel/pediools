// hooks/use-dashboard.ts
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function useDashboardHome() {
  return useQuery({
    queryKey: ["dashboard-home"],
    queryFn: async () => {
      const { data } = await axios.get("/api/dashboard/home");
      return data;
    },
  });
}