import React from 'react';
import { Link } from "react-router-dom";
import { LinkList } from "../../../components/link-list";
import { EditionProps } from "../types";
import { EditionString } from "../utils/edition-string";
import { Edition } from '../types';
import { LinkItem } from '../../../components/link-list';

export const OtherEdition = ({ edition, showFirst, details }: EditionProps) => {
    const isFirstVersion = (version: number | undefined) => {
        if (version === undefined || version === null) {
            return true;
        } else {
            return version === 1;
        }
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
            <div className="edition-oneliner">
                <>{EditionString(edition) + ":"}</>
                {edition.work && edition.title !== edition.work[0].title && (
                    <><i> {edition.title}. </i></>
                )}
                {edition.version > 1 && edition.editionnum === 1 &&
                    translators(edition).length > 0 &&
                    <>
                        <> Suom. </>
                        <LinkList path="people"
                            items={translators(edition)} />
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
