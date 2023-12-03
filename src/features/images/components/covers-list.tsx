import { Link } from "react-router-dom";

import { Image } from "primereact/image";

import { EditionImage } from "../types";

interface CoversListProps {
  covers: EditionImage[]
}

export const CoversList = ({ covers }: CoversListProps) => {

  return (
    <>
      {covers.map(cover => (
        <div key={cover.id}>
          <Link to={`/works/${cover.edition.work[0].id}`}>
            <Image preview className={"p-1 image-" + cover.id} src={process.env.REACT_APP_IMAGE_URL + cover.image_src}
              alt={cover.edition.title}
              height={"200"}
              key={"image-" + cover.id}
            />
          </Link>
        </div>
      ))}
    </>
  )
}