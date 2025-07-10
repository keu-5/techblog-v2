import { CounterType } from "@/features/count/models/countType";
import { getBaseUrl, toCamelCase } from "@/lib/utils";

export const findViewCount = {
  show: async (slug: string): Promise<CounterType["data"]> => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/view-count/${slug}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch view count");
      }

      const raw = await response.json();
      const data = toCamelCase(raw.data) as CounterType["data"];

      return data;
    } catch (error) {
      throw new Error("Could not retrieve view count");
    }
  },
  up: async (slug: string): Promise<CounterType["data"]> => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/view-count/${slug}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to increment view count");
      }

      const raw = await response.json();
      const data = toCamelCase(raw.data) as CounterType["data"];

      return data;
    } catch (error) {
      throw new Error("Could not increment view count");
    }
  },
};
