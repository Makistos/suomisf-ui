import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Magazine } from "../types";

interface MagazineListProps {
  magazineList: Magazine[]
}

export const MagazineList = ({ magazineList }: MagazineListProps) => {
  const [magazines, setMagazines]: [Magazine[], (magazines: Magazine[]) => void] = useState<Magazine[]>([]);

  useEffect(() => {
    setMagazines(magazineList);
  }, [magazineList]);

  return (
    <div>
      {magazines && (
        magazines.map(magazine =>
          <>
            <Link key={magazine.id} to={`/magazines/${magazine.id}`}>{magazine.name}</Link><br />
          </>
        ))}
    </div>
  )
}