import { Link } from "react-router-dom";

import { Image } from "primereact/image";

import { EditionImage } from "../types";
import { coverUrl, thumbUrl } from "../../../utils/cover-url";

interface CoversListProps {
  covers: EditionImage[]
}

export const CoversList = ({ covers }: CoversListProps) => {

  return (
    <>
      {covers.map(cover => (
        <div key={cover.id}>
          <Link to={`/works/${cover.edition.work?.id}`}>
            <Image preview className={"p-1 image-" + cover.id} src={thumbUrl(cover)} zoomSrc={coverUrl(cover)}
              alt={cover.edition.title}
              height={"200"}
              key={"image-" + cover.id}
              loading="lazy"
            />
          </Link>
        </div>
      ))}
    </>
  )
}