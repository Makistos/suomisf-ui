import React from 'react';
import { Edition } from "../features/edition/types";
import { EditionString } from "../features/edition/utils/edition-string";
// import { ImageType } from "../types/image";
// import { Work } from '../features/work';

interface ImageTooltipProps {
  edition: Edition,
}

export const ImageTooltip = ({ edition }: ImageTooltipProps) => {

  return (
    <div>
      {edition.work?.author_str}<br></br>
      <b>
        <u>{edition.title}</u>
      </b>
      <br></br>
      <div>
        {EditionString(edition)} ({edition.pubyear})
      </div>
    </div>
  )
}
