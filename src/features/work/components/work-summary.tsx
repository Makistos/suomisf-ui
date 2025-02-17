import React, { useMemo } from 'react';
import { Link } from "react-router-dom";

import { Tooltip } from "primereact/tooltip";

import { OtherEdition } from "../../edition";
import { GenreList } from "../../genre";
import { LinkList } from "../../../components/link-list";
import { WorkProps } from "../routes";
import { WorkTooltip } from "./work-tooltip";
import { isForeign } from '../utils/is-foreign';
import { editionIsOwned } from '@features/edition/utils/edition-is-owned';
import { editionIsWishlisted } from '@features/edition/utils/edition-is-wishlisted';
import { getCurrenUser } from '@services/auth-service';

export const WorkSummary = ({ work, detailLevel }: WorkProps) => {
    const user = useMemo(() => getCurrenUser(), [])
    const isOwned = detailLevel == "brief" ? work.editions.some(edition => editionIsOwned(edition, user)) : editionIsOwned(work.editions[0], user);
    let clsName = isOwned ?
        "book owned" : editionIsWishlisted(work.editions[0], user) ? "book wishlist" : "book not-owned";
    clsName += " work-oneliner";
    //const clsName = "work-oneliner";
    return (

        // <div className={editionIsOwned(work.editions[0], user) ?
        //     "book owned" : editionIsWishlisted(work.editions[0], user) ? "book wishlist" : "book not-owned"}>
        <>
            <p className={clsName}>
                <Tooltip position="right" mouseTrack mouseTrackLeft={10}
                    target={".work-link-" + work.id}
                >
                    <WorkTooltip work={work} />
                </Tooltip>
                <b>
                    <Link className={"work-link-" + work.id}
                        to={`/works/${work.id}`}
                    >
                        {work.title}
                    </Link>
                </b>
                <>.</>

                {isForeign(work) && (
                    <>&#32;({work.orig_title}, {work.pubyear}).&#32;</>
                )}
                {work.bookseries && (
                    <><Link to={`/bookseries/${work.bookseries.id}`}>
                        {work.bookseries.name}
                    </Link>
                        {work.bookseriesnum && (
                            <>&nbsp;{work.bookseriesnum}</>
                        )}
                        .&#32;</>
                )}

                {work.editions && work.editions.length > 0 &&
                    work.editions[0].contributions &&
                    work.editions[0].contributions
                        .filter(person => person.role.id === 2).length > 0 && (
                        <>
                            Suom.&nbsp;
                            <LinkList path="people" key={`links-translators-${work.id}`}
                                uniquePart='`work-${work.id}-translator'
                                items={work.editions[0].contributions
                                    .filter(contrib => contrib.role.id === 2)
                                    .map(contrib => {
                                        return {
                                            id: contrib.person.id,
                                            name: contrib.person.alt_name,
                                            description: contrib.description
                                        }
                                    })}
                            />.&nbsp;
                        </>
                    )}

                {work.editions && work.editions.length > 0 &&
                    work.editions[0].publisher &&
                    <Link to={`/publishers/${work.editions[0].publisher.id}`}>{work.editions[0].publisher.name}</Link>}&nbsp;
                <>{work.editions[0].pubyear && work.editions[0].pubyear}.&#32;</>
                {work.editions && work.editions.length > 0 &&
                    work.editions[0].pubseries && (
                        <Link to={`/pubseries/${work.editions[0].pubseries.id}`}>
                            {work.editions[0].pubseries.name}.&#32;
                        </Link>
                    )}
                <GenreList genres={work.genres} />
            </p>
            <div>
                {work.editions && work.editions.length > 0 &&
                    work.editions.map((edition) => (
                        <>
                            <OtherEdition key={`edition-${edition.id}`} work={work} edition={edition} details={detailLevel} />
                        </>
                    ))}
            </div>
        </>
    );
};
