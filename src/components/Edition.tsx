import { Fragment } from "react";
import { IPublisher } from "./Publisher";
import { IPersonBrief } from "./Person";
import { IWork } from "./Work";
import { GenreList } from "./Genre";
import { Link } from "react-router-dom";
import { IImage } from "./Image";
import { LinkList } from "./LinkList";
import { IFormat } from "./Format";
import { IBinding } from "./Binding";
export interface IEdition {
    binding: IBinding,
    coll_info: string,
    coverimage: number,
    dustcover: number,
    editionnum: number,
    format: IFormat,
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
    version: number,
    translators: IPersonBrief[],
    work: IWork[],
    images: IImage[]

}


interface EditionProps {
    edition: IEdition,
    showFirst?: boolean,
    details?: string,
    person?: string,
    work?: IWork,
    card?: boolean
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
    const isFirstVersion = (version: number | undefined) => {
        if (version === undefined || version === null) {
            return true;
        } else {
            return version === 1;
        }
    }
    return (
        (details !== "brief" &&
            (showFirst || edition.editionnum !== 1 || (!isFirstVersion(edition.version)))) ? (
            <div className="edition-oneliner">
                <>{EditionString(edition) + ":"}</>
                <> {edition.publisher && edition.publisher.name} </>
                <>{edition.pubyear}.</>

            </div>
        ) : (
            <></>
        )
    )
}

export const EditionSummary = ({ edition, person }: EditionProps) => {
    return (
        <div>
            {person && person === edition.work[0].author_str && <b>{edition.work[0].author_str}: </b>}
            <Link to={`/works/${edition.work[0].id}`}>
                {edition.title}</Link>
            {edition.work[0].title !== edition.work[0].orig_title && (
                <> ({edition.work[0].orig_title}, {edition.work[0].pubyear})</>
            )}
            {/*{!"!?.".includes(edition.title.slice(-1)) &&
                <>.</>
            } */}
            <>. {edition.publisher && edition.publisher.name} </>
            <>{edition.pubyear}. </>
            <GenreList genres={edition.work[0].genres} />
        </div>
    )
}

export const EditionString = (edition: IEdition) => {
    /* This a bit complex. The rules are:
       1. Show version if it is > 1.
       2. Show edition number always, except when it is 1
          and version is > 1.
       3. Some edition numbers are unknown. Show a question mark
          in those cases.
    */
    let retval = "";
    if (edition.version && edition.version !== 1) {
        retval = edition.version + ".laitos ";
    }
    if (edition.editionnum !== null) {
        if ((edition.version === null || edition.version === 1) || (edition.version > 1 && edition.editionnum > 1)) {
            retval = retval + edition.editionnum + ".painos";
        }
    } else {
        retval = retval + " ?. painos";
    }
    return retval;
}
export const EditionVersion = ({ edition }: EditionProps) => {
    return (
        <span>{EditionString(edition)}</span>
    )
}

export const EditionDetails = ({ edition, work, card }: EditionProps) => {
    return (
        <div>
            {card && <b><EditionVersion edition={edition} /></b>}
            {card !== undefined && work !== undefined && edition.title !== work.title &&
                <p>{edition.title}</p>
            }
            {edition.publisher && (<><br />{edition.publisher.name} </>)}
            {edition.pubyear + "."}
            {edition.translators.length > 0 && (
                <><br /><>Suom. </>
                    <LinkList path="people"
                        separator=" &amp; "
                        items={
                            edition.translators.map((item) => ({
                                id: item['id'],
                                name: item['alt_name'] ? item['alt_name'] : item['name']
                            }))}
                    />.
                </>
            )}
            {edition.pages && (<><br />{edition.pages} sivua. </>)}
            {edition.size && edition.size + " cm."}
            {edition.misc && (<><br />{edition.misc}</>)}
            {edition.isbn && (<><br />ISBN {edition.isbn}</>)}
            {edition.binding && " " + edition.binding.name}.
            {edition.dustcover === 3 && (
                <span><br />Kansipaperi.</span>
            )}
            {edition.coverimage === 3 &&
                <span><br />Ylivetokannet.</span>
            }
        </div>
    )

}