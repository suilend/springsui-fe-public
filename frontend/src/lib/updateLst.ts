import { API_URL } from "@suilend/sui-fe";
import { showErrorToast } from "@suilend/sui-fe-next";

export const patchLst = async (lstCoinType: string) => {
  try {
    await fetch(`${API_URL}/springsui/lst-info/${lstCoinType}`, {
      method: "PATCH",
    });
  } catch (err) {
    showErrorToast("Failed to refresh LST", err as Error);
    console.error(err);
  }
};
