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
    const isOwned = detailLevel == "brief"
        ? work.editions.some(edition => editionIsOwned(edition, user))
        : editionIsOwned(work.editions[0], user);
    const clsName = (isOwned
        ? "book owned"
        : editionIsWishlisted(work.editions[0], user) ? "book wishlist" : "book not-owned")
        + " work-oneliner mb-0";

    const firstEdition = work.editions?.[0];
    const translators = firstEdition?.contributions?.filter(c => c.role.id === 2) ?? [];

    const metaItems: React.ReactNode[] = [];

    if (work.bookseries) {
        metaItems.push(
            <React.Fragment key="series">
                <Link to={`/bookseries/${work.bookseries.id}`}>
                    {work.bookseries.name}{work.bookseriesnum ? ` ${work.bookseriesnum}` : ''}
                </Link>.{' '}
            </React.Fragment>
        );
    }

    if (translators.length > 0) {
        metaItems.push(
            <React.Fragment key="translator">
                Suom.{' '}
                <LinkList
                    path="people"
                    uniquePart={`work-${work.id}-translator`}
                    items={translators.map(c => ({
                        id: c.person.id,
                        name: c.person.name,
                        alt_name: c.person.alt_name ?? c.person.name,
                        description: c.description,
                    }))}
                />.{' '}
            </React.Fragment>
        );
    }

    if (firstEdition?.publisher) {
        metaItems.push(
            <React.Fragment key="publisher">
                <Link to={`/publishers/${firstEdition.publisher.id}`}>
                    {firstEdition.publisher.name}
                </Link>
                {firstEdition.pubyear && <> {firstEdition.pubyear}</>}.{' '}
            </React.Fragment>
        );
    } else if (firstEdition?.pubyear) {
        metaItems.push(
            <React.Fragment key="year">{firstEdition.pubyear}.{' '}</React.Fragment>
        );
    }

    if (firstEdition?.pubseries) {
        metaItems.push(
            <React.Fragment key="pubseries">
                <Link to={`/pubseries/${firstEdition.pubseries.id}`}>
                    {firstEdition.pubseries.name}
                </Link>.{' '}
            </React.Fragment>
        );
    }

    if (work.genres?.length > 0) {
        metaItems.push(
            <GenreList
                key="genres"
                genres={work.genres}
                collection={work.type === 2}
                booklet={work.type === 5}
            />
        );
    }

    return (
        <div style={{ marginBottom: '0.5rem' }}>
            <div className={clsName}>
                <Tooltip position="right" mouseTrack mouseTrackLeft={10}
                    target={".work-link-" + work.id}
                >
                    <WorkTooltip work={work} />
                </Tooltip>

                <div>
                    <Link className={"work-link-" + work.id} to={`/works/${work.id}`}>
                        <strong>{work.title}</strong>
                    </Link>
                    {isForeign(work) && (
                        <span className="text-700 text-sm font-medium ml-2">
                            ({work.orig_title}{work.pubyear ? `, ${work.pubyear}` : ''})
                        </span>
                    )}
                </div>

                {metaItems.length > 0 && (
                    <div className="text-sm text-700 font-medium">
                        {metaItems}
                    </div>
                )}
            </div>

            {work.editions?.map((edition, index) => (
                <div key={`${work.id}-${edition.id}-${index}`} className="text-sm" style={{ marginLeft: '0.15rem' }}>
                    <OtherEdition work={work} edition={edition} details={detailLevel} />
                </div>
            ))}
        </div>
    );
};
