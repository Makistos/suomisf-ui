import React from 'react';
import { Edition, EditionString } from "../features/edition";
import { ImageType } from "../types/image";
import { Work } from '../features/work';

interface ImageTooltipProps {
  edition: Edition,
}

export const ImageTooltip = ({ edition }: ImageTooltipProps) => {

  return (
    <div>
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
