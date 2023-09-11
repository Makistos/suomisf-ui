import React from 'react';
import { Link } from "react-router-dom";

import { Tooltip } from "primereact/tooltip";

import { OtherEdition } from "../../edition";
import { GenreList } from "../../genre";
import { LinkList } from "../../../components/link-list";
import { WorkProps } from "../routes";
import { WorkDetails } from "./work-details";


export const WorkSummary = ({ work, detailLevel }: WorkProps) => {
    console.log(work)

    return (

        <div className="work-oneliner">
            <Tooltip position="right" autoHide={false} className="tooltip"
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
            <>. </>

            {work.bookseries && (
                <><Link to={`/bookseries/${work.bookseries.id}`}>
                    {work.bookseries.name}
                </Link>
                    {work.bookseriesnum && (
                        <> {work.bookseriesnum}</>
                    )}
                    .</>
            )}

            {(work.orig_title !== work.title && work.orig_title !== '' && work.orig_title !== null) && (
                <> ({work.orig_title !== work.title && work.orig_title}
                    {/* Add comma only if both original title and pubyear are
                         shown and orig_title has a value. */}
                    {work.orig_title !== work.title && work.orig_title !== ''
                        && work.orig_title !== null && work.pubyear && (
                            <>, </>
                        )}
                    {work.pubyear && <>{work.pubyear}</>}
                    )
                </>
            )}
            {work.editions && work.editions.length > 0 &&
                work.editions[0].contributions &&
                work.editions[0].contributions
                    .filter(person => person.role.id === 2).length > 0 && (
                    <>
                        <> Suom. </>
                        <LinkList path="people"
                            items={work.editions[0].contributions
                                .filter(contrib => contrib.role.id === 2)
                                .map(person => person.person)}
                        />.
                    </>
                )}
            {work.editions && work.editions.length > 0 &&
                work.editions[0].publisher &&
                <Link to={`/publishers/${work.editions[0].publisher.id}`}> {work.editions[0].publisher.name}</Link>}
            <> {work.editions[0].pubyear && work.editions[0].pubyear}. </>
            {work.editions && work.editions.length > 0 &&
                work.editions[0].pubseries && (
                    <Link to={`/pubseries/${work.editions[0].pubseries.id}`}>
                        {work.editions[0].pubseries.name}.<> </>
                    </Link>
                )}
            <GenreList genres={work.genres} />
            {work.editions && work.editions.length > 0 &&
                work.editions.map((edition) => (
                    <OtherEdition key={edition.id} work={work} edition={edition} details={detailLevel} />
                ))}
        </div>
    );
};
