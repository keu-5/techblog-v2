import { ActionType, Count } from "@/features/count/models/countType";

//TODO: https://counterapi.com/api/localhost:3000/vote/index?trackOnly=true&startNumber=0&icon=heart&noAnim=true&animDuration=3000&behavior=vote&timeline=total&color=%23ccc&iconColor=%23ff7ba8&bg=black これを参考に

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
