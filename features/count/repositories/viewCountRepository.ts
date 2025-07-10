import { ActionType, Count } from "@/features/count/models/countType";

export const findCount = async (
  slug: string,
  host: string,
  action: ActionType,
): Promise<number> => {
  try {
    const response = await fetch(
      `https://counterapi.com/api/${host}/${action}/${slug}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch view count");
    }

    const data: Count = await response.json();
    return data.value || 0;
  } catch (e) {
    console.error("Error fetching view count:", e);
    return 0;
  }
};
