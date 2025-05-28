import { API_URL } from "@suilend/frontend-sui";
import { showErrorToast } from "@suilend/frontend-sui-next";

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
