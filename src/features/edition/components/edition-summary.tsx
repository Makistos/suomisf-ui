import React, { useMemo } from 'react';
import { Link } from "react-router-dom";

import { GenreList } from "../../genre";
import { Edition, EditionProps } from "../types";
import { EditionString } from "../utils/edition-string";
import { getCurrenUser } from '@services/auth-service';


export const EditionSummary = ({ edition, person, showPerson, showVersion, isOwned, isWishlisted }: EditionProps) => {
    const user = useMemo(() => getCurrenUser(), [])
    const notFirstEdition = (edition: Edition) => {
        return !(edition.editionnum === 1 && (edition.version || edition.version === null || edition.version === 1))
    }
    // if (edition !== undefined) {
    //     console.log(edition)
    // }
    const uniquePeople = (value: string, index: number, array: string[]) => {
        return array.indexOf(value) === index;
    }
    const authorStr = (edition: Edition) => {
        return edition.work[0].contributions.map(
            contrib => contrib.person.name).filter(uniquePeople).join(' & ');
    }

    return (
        <div className={isOwned ? "book owned" : isWishlisted ? "book wishlist" : "book not-owned"}>
            {edition.work[0] && (showPerson || (person && person === authorStr(edition))) && <b>{authorStr(edition)}:&nbsp;</b>}
            {edition.work[0] && <Link to={`/works/${edition.work[0].id}`}>
                {edition.title}</Link>}
            {edition.work[0] && edition.work[0].title !== edition.work[0].orig_title && (
                <>&nbsp;({edition.work[0].orig_title}, {edition.work[0].pubyear})</>
            )}
            {showVersion && notFirstEdition(edition) && edition.editionnum !== null && (
                <>. <b>{EditionString(edition)}</b></>
            )}
            {/*{!"!?.".includes(edition.title.slice(-1)) &&
                <>.</>
            } */}
            <>.&nbsp;{edition.publisher && (
                <Link to={`/publishers/${edition.publisher.id}`}>{edition.publisher.name}</Link>
            )}</>
            <>&nbsp;{edition.pubyear}.&nbsp;</>
            {edition.work[0] && <GenreList genres={edition.work[0].genres} />}
        </div>
    )
}


