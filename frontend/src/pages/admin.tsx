import Nav from "@/components/Nav";
import { AppData, useAppDataContext } from "@/contexts/AppDataContext";

export default function Admin() {
  const appDataContext = useAppDataContext();
  const appData = appDataContext.appData as AppData;

  return (
    <>
      <Nav />
    </>
  );
}
