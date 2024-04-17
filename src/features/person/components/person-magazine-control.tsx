import { useEffect, useState } from "react"
import { getCurrenUser } from "../../../services/auth-service"
import { getApiContent } from "../../../services/user-service";
import { Issue } from "../../issue";
import { setLocale } from "yup";

interface PersonMagazineProps {
  id: number
}

export const PersonMagazineControl = ({ id }: PersonMagazineProps) => {
  const user = getCurrenUser();
  const [chiefEditor, setChiefEditor]: [Issue[], (issues: Issue[]) => void] = useState<Issue[]>([]);
  const [loadingCE, setLoadingCE] = useState(false);

  useEffect(() => {
    const getChiefEditorials = async () => {
      setLoadingCE(true);
      const url = 'person/' + id + '/chiefeditor';
      try {
        const response = await getApiContent(url, user);
        setChiefEditor(response.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingCE(false);
      }
    }
    getChiefEditorials();
  }, [id, user])

  return (
    <div></div>
  )
}