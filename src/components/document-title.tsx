import { useEffect, useState, useRef } from "react";

export const useDocumentTitle = (title: string) => {
  const [documentTitle, setDocumentTitle] = useState(title);

  useEffect(() => {
    if (title !== undefined)
      document.title = "SF-Bibliografia - " + documentTitle;
    console.log("boo")
  }, [documentTitle]);

  return [documentTitle, setDocumentTitle] as const;
}
