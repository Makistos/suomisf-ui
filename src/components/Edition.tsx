import { Fragment } from "react";
import { IPublisher } from "./Publisher";
import { IPersonBrief } from "./Person";
import { IWork } from "./Work";
import { GenreList } from "./Genre";

export interface IEdition {
    coll_info: string,
    coverimage: number,
    dustcover: number,
    editionnum: number,
    id: number,
    imported_string: string,
    isbn: string,
    misc: string,
    pages?: number,
    printedin?: string,
    publisher: IPublisher,
    pubseriesnum?: number,
    pubyear: number,
    size?: string,
    subtitle: string,
    title: string,
    version?: number,
    translators: IPersonBrief[],
    work: IWork[],
}


interface EditionProps {
    edition: IEdition,
    showFirst?: boolean,
    details?: string,
    person?: string,
}

export const groupEditions = (editions: IEdition[]) => {
    let grouped: Record<string, IEdition[]> =
        editions.reduce((acc: { [index: string]: any }, currentValue) => {
            const groupKey = currentValue.work[0]["author_str"];
            if (!acc[groupKey]) {
                acc[groupKey] = []
            }
            acc[groupKey].push(currentValue);
            return acc;
        }, {});
    return grouped;
}

export const editionCmp = (a: IEdition, b: IEdition) => {
    let aVersion = 1;
    let bVersion = 1;
    if (a.version) {
        aVersion = a.version;
    }
    if (b.version) {
        bVersion = b.version;
    }
    if (aVersion !== bVersion) {
        /* Version (laitos) is most important sort order */
        if (aVersion < bVersion) return -1;
        return 1;
    }
    if (a.editionnum !== b.editionnum) {
        if (a.editionnum < b.editionnum) return -1;
        return 1;
    }
    /* Usually editions are in order in database so if everything
       else fails, return in the order they were, e.g. default
       return value is -1. */
    if (a.pubyear > b.pubyear) return -1;
    return -1;
}

export const OtherEdition = ({ edition, showFirst, details }: EditionProps) => {
    return (
        (details !== "brief" && (showFirst || edition.editionnum !== 1)) ? (
            <div className="edition-oneliner">
                <Fragment>{edition.editionnum}. painos.</Fragment>
                <Fragment> {edition.publisher && edition.publisher.name} </Fragment>
                <Fragment>{edition.pubyear}.</Fragment>

            </div>
        ) : (
            <Fragment></Fragment>
        )
    )
}

export const Edition = ({ edition, person }: EditionProps) => {
    return (
        <div>
            {person && person === edition.work[0].author_str && <b>{edition.work[0].author_str}: </b>}
            <Fragment>{edition.title}</Fragment>
            {!"!?.".includes(edition.title.slice(-1)) &&
                <Fragment>.</Fragment>
            }
            <Fragment> {edition.publisher && edition.publisher.name} </Fragment>
            <Fragment>{edition.pubyear}. </Fragment>
            <GenreList genres={edition.work[0].genres} />
        </div>
    )
}