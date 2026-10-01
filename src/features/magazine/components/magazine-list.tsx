import { Fragment } from "react";
import { Link } from "react-router-dom";

import { Magazine } from "../types";

interface MagazineListProps {
  magazineList: Magazine[]
}

export const MagazineList = ({ magazineList }: MagazineListProps) => {
  return (
    <div>
      {magazineList && (
        magazineList.map(magazine =>
          <Fragment key={magazine.id}>
            <Link to={`/magazines/${magazine.id}`}>{magazine.name}</Link><br />
          </Fragment>
        ))}
    </div>
  )
}