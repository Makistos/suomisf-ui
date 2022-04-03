import React, { Fragment, useEffect, useRef, useState } from "react";
import { EditionDetails, EditionString, IEdition, OtherEdition } from "./Edition";
import { IBookseries } from "./Bookseries";
import { ICountry } from "./Country";
import { IPerson } from "./Person";
import { GenreGroup, GenreList } from "./Genre";
import { TagGroup } from "./SFTag";
import { LinkList } from "./LinkList";
import { ILink } from "./Link";
import { IImage } from "./Image";
import { SITE_URL } from "../systemProps";
import { Link } from "react-router-dom";
import { OverlayPanel } from "primereact/overlaypanel";
import { Tooltip } from "primereact/tooltip";
import { useParams } from "react-router-dom";
import { getCurrenUser } from "../services/auth-service";
import { getApiContent } from "../services/user-service";
import { Card } from "primereact/card";
import { Image } from "primereact/image";
import { Button } from "primereact/button";

export interface IWork {
    [index: string]: any,
    author_str: string,
    authors: IPerson[],
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
    language: ICountry,
    links: ILink[]
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
        <div className="grid align-items-center justify-content-center">
            {work.authors && (
                <div className="grid col-12 justify-content-center">
                    <h3 className="mb-0">
                        <LinkList path="people"
                            separator=" &amp; "
                            items={
                                work.authors.map((item) => ({
                                    id: item['id'],
                                    name: item['alt_name'] ? item['alt_name'] : item['name']
                                }))
                            }
                        />
                    </h3>
                </div>
            )}
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
                <div className="col-12">
                    <TagGroup tags={work.tags} overflow={5} showOneCount />
                </div>
                {work.bookseries && (
                    <div className="col-12">
                        <b>{work.bookseries.name}</b>
                        {work.bookseriesnum && (
                            ", numero " + work.bookseriesnum
                        )}
                    </div>
                )}
                <div className="col-12">
                    {work.links && work.links.map((link) => (
                        <span className="mr-1">
                            <Link to={link.link} key={link.id}>
                                {link.description}
                            </Link>
                        </span>
                    ))}
                </div>
                {work.description && (
                    <div className="col-12">
                        <div dangerouslySetInnerHTML={{ __html: work.description }} />
                    </div>
                )}
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

const baseURL = "works/";

export const Work = () => {
    const params = useParams();
    const user = getCurrenUser();
    const [work, setWork]: [IWork | null, (work: IWork) => void] = useState<IWork | null>(null);

    useEffect(() => {
        async function getWork() {
            let url = baseURL + params.workId?.toString();
            try {
                const response = await getApiContent(url, user);
                setWork(response.data);
            } catch (e) {
                console.error(e);
            }
        }
        getWork();

        console.log(work);
    }, [params.workId, user])

    const editionHeader = (images: IImage[]) => {
        if (images.length > 0) {
            return (
                <Image preview width="50" src={"http://www.sf-bibliografia.fi/" + images[0].image_src} />
            )
        } else {
            return (<></>)
        }
    }

    const editionSubtitle = (title: string, original_title: string) => {
        if (title === original_title) {
            return <></>
        } else {
            return <>{title}</>
        }
    }

    const editionFooter = (edition: IEdition) => {
        return (
            <span>
                <Button label="Muokkaa" />

            </span>
        )
    }
    if (!work) return null;

    return (
        <div className="mt-5">
            <WorkDetails work={work} />
            <div>
                <h2>Painokset</h2>
                <div className="flex flex-wrap">
                    {work.editions.map((edition) => {
                        return (
                            <div className="flex flex-wrap col min-h-full">
                                <Card title={EditionString(edition)} className="m-2"
                                    subTitle={editionSubtitle(edition.title, edition.work[0].orig_title)}
                                    header={editionHeader(edition.images)}
                                    footer={editionFooter(edition)}
                                    key={edition.id}>
                                    <EditionDetails edition={edition} work={work} />
                                </Card>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}