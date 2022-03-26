import React, { Fragment } from "react";
import { IEdition, OtherEdition } from "./Edition";
import { IBookseries } from "./Bookseries";
import { GenreList } from "./Genre";
import { LinkList } from "./LinkList";
import { SITE_URL } from "../systemProps";
import { Link } from "react-router-dom";

export interface IWork {
    [index: string]: any,
    author_str: string,
    bookseriesnum: string,
    bookseriesorder: number,
    desc_attr: string,
    description: string,
    editions: IEdition[],
    id: number,
    imported_string: string,
    misc: string,
    orig_title: string,
    pubyear: number,
    subtitle: string,
    title: string,
    bookseries: IBookseries
}

interface WorkProps {
    work: IWork,
    detailLevel: string,
    orderField: string
}

export const groupWorks = (works: IWork[]) => {
    const grouped: Record<string, IWork[]> =
        works.reduce((acc: { [index: string]: any }, currentValue) => {
            const groupKey = currentValue["author_str"];
            if (!acc[groupKey]) {
                acc[groupKey] = []
            }
            acc[groupKey].push(currentValue);
            return acc;
        }, {});

    return grouped;
}

export const WorkDetails = ({ work }: WorkProps) => {
    return (
        <div></div>
    )
}

export const WorkSummary = ({ work, detailLevel }: WorkProps) => {
    return (
        <div className="work-oneliner">
            <b>
                <Link
                    to={`/works/${work.id}`}
                    key={work.id}
                >
                    {work.title}
                </Link>
            </b>

            {(work.orig_title !== work.title) && (
                <Fragment> ({work.orig_title !== work.title && work.orig_title}
                    {/* Add comma only if both original title and pubyear are
                         shown. */}
                    {work.orig_title !== work.title && work.pubyear && (
                        <Fragment>, </Fragment>
                    )}
                    {work.pubyear && <Fragment>{work.pubyear}</Fragment>}
                    )
                </Fragment>
            )}
            <Fragment>. </Fragment>
            {work.editions[0].translators.length > 0 && (
                <>
                    <Fragment> Suom. </Fragment>
                    <LinkList path={SITE_URL} items={work.editions[0].translators} />.
                </>
            )}
            {work.editions[0].publisher &&
                <Fragment> {work.editions[0].publisher.name}</Fragment>
            }
            <Fragment> {work.editions[0].pubyear}. </Fragment>
            <GenreList genres={work.genres} />
            {work.editions.map((edition) => (
                <OtherEdition key={edition.id} edition={edition} details={detailLevel} />
            ))}
        </div>
    )
}