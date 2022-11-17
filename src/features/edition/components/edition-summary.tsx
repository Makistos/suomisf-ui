import React from 'react';
import { Link } from "react-router-dom";

import { GenreList } from "../../genre";
import { Edition, EditionProps } from "../types";
import { EditionString } from "../utils/edition-string";



export const EditionSummary = ({ edition, person, showPerson, showVersion }: EditionProps) => {
    const notFirstEdition = (edition: Edition) => {
        return !(edition.editionnum === 1 && (edition.version || edition.version === null || edition.version === 1))
    }
    return (
        <div>
            {(showPerson || (person && person === edition.work[0].author_str)) && <b>{edition.work[0].author_str}: </b>}
            <Link to={`/works/${edition.work[0].id}`}>
                {edition.title}</Link>
            {edition.work[0].title !== edition.work[0].orig_title && (
                <> ({edition.work[0].orig_title}, {edition.work[0].pubyear})</>
            )}
            {showVersion && notFirstEdition(edition) && (
                <>. <b>{EditionString(edition)}</b></>
            )}
            {/*{!"!?.".includes(edition.title.slice(-1)) &&
                <>.</>
            } */}
            <>. {edition.publisher && (
                <Link to={`/publishers/${edition.publisher.id}`}>{edition.publisher.name}</Link>
            )}</>
            <> {edition.pubyear}. </>
            <GenreList genres={edition.work[0].genres} />
        </div>
    )
}


