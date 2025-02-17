import React, { useMemo } from 'react';
import { Link } from "react-router-dom";
import { LinkList } from "../../../components/link-list";
import { EditionProps } from "../types";
import { EditionString } from "../utils/edition-string";
import { Edition } from '../types';
import { LinkItem } from '../../../components/link-list';
import { editionIsOwned } from '../utils/edition-is-owned';
import { editionIsWishlisted } from '../utils/edition-is-wishlisted';
import { getCurrenUser } from '@services/auth-service';

/**
 * Generates a JSX component for displaying an edition of a book.
 *
 * @param {EditionProps} edition - The edition to display.
 * @param {boolean} showFirst - Whether to show the first edition.
 * @param {string} details - The level of detail to display.
 * @return {JSX.Element} The JSX component for displaying the edition.
 */
export const OtherEdition = ({ edition, showFirst, details }: EditionProps) => {
    const user = useMemo(() => getCurrenUser(), [])
    const isOwned = editionIsOwned(edition, user);
    let clsName = isOwned ?
        "book owned" : editionIsWishlisted(edition, user) ? "book wishlist" : "book not-owned";
    clsName += " edition-oneliner";
    /**
     * Checks if the given version is the first version.
     *
     * @param {number | undefined} version - The version to check.
     * @return {boolean} Returns true if the version is undefined, null, or 1.
     *                   Otherwise, returns false.
     */
    const isFirstVersion = (version: number | undefined): boolean => {
        return version === undefined || version === null || version === 1;
    };

    const translators = (edition: Edition): LinkItem[] => {
        if (edition.contributions === undefined) return [];
        return edition.contributions.filter(contrib => contrib.role.id === 2)
            .map(contrib => {
                return {
                    id: contrib.person.id, name: contrib.person.alt_name, description: contrib.description
                }
            });
    }

    return (
        (details !== "brief" &&
            (showFirst || edition.editionnum !== 1 || (!isFirstVersion(edition.version)))) ? (
            <div className={clsName}>
                <>{EditionString(edition) + ":"}</>
                {edition.work && edition.title !== edition.work[0].title && (
                    <><b> {edition.title}. </b></>
                )}
                {edition.version > 1 && edition.editionnum === 1 &&
                    translators(edition).length > 0 &&
                    <>
                        <> Suom. </>
                        <LinkList path="people"
                            items={translators(edition)}
                            uniquePart='`edition-${edition.id}-translators' />
                        . </>}
                <> {edition.publisher && edition.publisher.name} </>
                <>{edition.pubyear}.</>
                {edition.pubseries && (
                    <> <Link to={`/pubseries/${edition.pubseries.id}`}>
                        {edition.pubseries.name}</Link>.
                    </>
                )}
            </div>
        ) : (
            <></>
        )
    );
};
