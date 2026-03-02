import React, { useMemo } from 'react';
import { Link } from "react-router-dom";

import { GenreList } from "../../genre";
import { Edition, EditionProps } from "../types";
import { EditionString } from "../utils/edition-string";
import { getCurrenUser } from '@services/auth-service';
import { isForeign } from '@features/work/utils/is-foreign';


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
        if (!edition.work) return "";
        return edition.work.contributions.map(
            contrib => contrib.person.name).filter(uniquePeople).join(' & ');
    }

    return (
        <div className={isOwned ? "book owned" : isWishlisted ? "book wishlist" : "book not-owned"}>
            {edition.work && (showPerson || (person && person === authorStr(edition))) && <b>{authorStr(edition)}:&nbsp;</b>}
            {edition.work && <Link to={`/works/${edition.work.id}`}>
                {edition.title}</Link>}
            {edition.work
                && isForeign(edition.work) && (
                    <>&nbsp;({edition.work.orig_title}, {edition.work.pubyear})</>
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
            {edition.work &&
                <GenreList
                    genres={edition.work.genres}
                    collection={edition.work.type === 2}
                    booklet={edition.work.type === 5}
                />}
        </div>
    )
}


