import { useEffect, useState } from "react";

export const useDocumentTitle = (title: string) => {
  const [documentTitle, setDocumentTitle] = useState(title);

  useEffect(() => {
    if (title !== undefined)
      document.title = "SF-Bibliografia - " + documentTitle;
  }, [documentTitle, title]);

  return [documentTitle, setDocumentTitle] as const;
}
