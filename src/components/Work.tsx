import React, { Fragment, useRef } from "react";
import { IEdition, OtherEdition } from "./Edition";
import { IBookseries } from "./Bookseries";
import { ICountry } from "./Country";
import { GenreGroup, GenreList } from "./Genre";
import { TagGroup } from "./SFTag";
import { LinkList } from "./LinkList";
import { SITE_URL } from "../systemProps";
import { Link } from "react-router-dom";
import { OverlayPanel } from "primereact/overlaypanel";
import { Tooltip } from "primereact/tooltip";

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
    bookseries: IBookseries,
    language: ICountry
}

interface WorkProps {
    work: IWork,
    detailLevel?: string,
    orderField?: string
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
        <div>
            <div className="grid align-items-center justify-content-center">
                <div className="grid col-12 justify-content-center"><h3 className="mb-0">{work.author_str}</h3></div>
                <div className="grid col-12 justify-content-center"><h1 className="mt-1 mb-0">{work.title}</h1></div>
                <div className="grid col-12 justify-content-center">
                    <p className="mt-1">
                        {work.orig_title !== work.title && work.orig_title + ", "}
                        {work.pubyear}
                        {work.language_name && " (" + work.language_name.name + ")"}
                    </p>
                    <div className="col-12">
                        <GenreGroup genres={work.genres} />
                    </div>
                    <div className="col-12 mb-5">
                        <TagGroup tags={work.tags} overflow={5} />
                    </div>

                </div>
            </div>
        </div>
    )
}

export const WorkSummary = ({ work, detailLevel }: WorkProps) => {
    const op = useRef<OverlayPanel>(null);



    return (

        <div className="work-oneliner">
            <Tooltip className="tooltip"
                target={".work-link-" + work.id}
            >
                <WorkDetails work={work} />
            </Tooltip>
            <b>
                <Link className={"work-link-" + work.id}
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

export const Work = () => {
    return (
        <div>

        </div>
    )
}