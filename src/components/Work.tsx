import { useEffect, useState } from "react";
import { EditionDetails, EditionString, IEdition, OtherEdition } from "./Edition";
import { IBookseries } from "./Bookseries";
import { ICountry } from "./Country";
import { IPerson, IPersonBrief } from "./Person";
import { GenreGroup, GenreList } from "./Genre";
import { TagGroup } from "./SFTag";
import { LinkList } from "./LinkList";
import { ILink } from "./Link";
import { IMAGE_URL } from "../systemProps";
import { Link } from "react-router-dom";
import { Tooltip } from "primereact/tooltip";
import { useParams } from "react-router-dom";
import { getCurrenUser } from "../services/auth-service";
import { getApiContent } from "../services/user-service";
import { Image } from "primereact/image";
import { DataView, DataViewLayoutOptions, DataViewLayoutType, DataViewLayoutOptionsChangeParams } from "primereact/dataview";
import { Panel } from "primereact/panel";
import { Ripple } from "primereact/ripple";
import { ShortsList } from "./ShortsList";
import { IShort } from "./Short";
import { SpeedDial } from "primereact/speeddial";
import { confirmDialog } from "primereact/confirmdialog";
import { IAwarded } from "./Awarded";
import { AwardPanel } from "./Awarded";
import { LinkPanel } from "./Links";
import { IPubseries } from "./Pubseries";
export interface IWork {
    [index: string]: any,
    author_str: string,
    authors: IPerson[],
    awards: IAwarded[],
    bookseries: IBookseries,
    bookseriesnum: string,
    bookseriesorder: number,
    desc_attr: string,
    description: string,
    editions: IEdition[],
    id: number,
    imported_string: string,
    language: ICountry,
    links: ILink[],
    misc: string,
    orig_title: string,
    pubseries: IPubseries,
    pubyear: number,
    stories: IShort[],
    subtitle: string,
    title: string,
    translators: IPersonBrief[]
}

interface WorkProps {
    work: IWork,
    detailLevel?: string,
    orderField?: string
}

export const isAnthology = (work: IWork) => {
    // Check if work is a collection with multiple
    // authors. This is the definition of anthology.
    if (work.stories.length === 0) {
        // Not even a collection
        return false;
    }
    // Create a dictionary with the authors' names
    // as key. If our dictionary has more than one
    // value it's an anthology.
    let authors: Record<string, any> = {};
    work.stories.map(story => {
        const author_name: string = story.authors
            .sort((a, b) => a.name > b.name ? -1 : 1)
            .map(author => author.name).toString();
        if (!(author_name in authors)) {
            authors[author_name] = author_name;
        }
        return true;
    })
    if (Object.keys(authors).length > 1) {
        return true;
    }
    return false;
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
                <div className="grid col-12 justify-content-center">
                    <div className="grid col-6 p-3 justify-content-end">
                        <AwardPanel awards={work.awards}></AwardPanel>
                    </div>
                    <div className="grid col-6 p-3 justify-content-start">
                        <LinkPanel links={work.links} />
                    </div>
                </div>
                {work.bookseries && (
                    <div className="col-12">
                        <Link to={`/bookseries/${work.bookseries.id}`}>
                            <b>{work.bookseries.name}</b>
                        </Link>
                        {work.bookseriesnum && (
                            ", numero " + work.bookseriesnum
                        )}
                    </div>
                )}
                <div className="col-12">
                    {work.misc}
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

            {(work.orig_title !== work.title) && (
                <> ({work.orig_title !== work.title && work.orig_title}
                    {/* Add comma only if both original title and pubyear are
                         shown. */}
                    {work.orig_title !== work.title && work.pubyear && (
                        <>, </>
                    )}
                    {work.pubyear && <>{work.pubyear}</>}
                    )
                </>
            )}
            {work.editions[0].translators.length > 0 && (
                <>
                    <> Suom. </>
                    <LinkList path="people"
                        items={work.editions[0].translators}
                    />.
                </>
            )}
            {work.editions[0].publisher &&
                <Link to={`/publishers/${work.editions[0].publisher.id}`}> {work.editions[0].publisher.name}</Link>
            }
            <> {work.editions[0].pubyear}. </>
            {work.editions[0].pubseries && (
                <Link to={`/pubseries/${work.editions[0].pubseries.id}`}>
                    {work.editions[0].pubseries.name}.<> </>
                </Link>
            )}
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
    const [layout, setLayout]: [DataViewLayoutType, (layout: DataViewLayoutType) => void] = useState<DataViewLayoutType>('list');
    const ConfirmNewWork = () => {
        confirmDialog({
            message: 'Tähän tulee uuden teoksen lisäys-näkymä',
            header: 'Uuden teoksen lisääminen',
            icon: 'fa-solid fa-circle-plus'
        });
    };

    const ConfirmEdit = () => {
        confirmDialog({
            message: 'Tähän tulee teoksen muokkaus-näkymä',
            header: 'Teoksen muokkaaminen',
            icon: 'fa-solid fa-pen-to-square'
        });
    };
    const ConfirmNewEdition = () => {
        confirmDialog({
            message: 'Tähän tulee uuden painoksen lisäys-näkymä',
            header: 'Uuden painoksen lisääminen',
            icon: 'fa-solid fa-circle-plus'
        });
    };

    const dialItems = [
        {
            label: 'Uusi teos',
            icon: 'fa-solid fa-circle-plus',
            command: () => {
                ConfirmNewWork();
            }
        },
        {
            label: 'Muokkaa',
            icon: 'fa-solid fa-pen-to-square',
            command: () => {
                ConfirmEdit();
            }
        },
        {
            label: 'Uusi painos',
            icon: 'fa-solid fa-file-circle-plus',
            command: () => {
                ConfirmNewEdition();
            }
        },
        {
            label: 'Muokkaa novelleja',
            icon: 'fa-solid fa-list-ul',
            disabled: !(work !== null &&
                work.stories !== null &&
                work.stories.length > 0),
            command: () => {

            }
        }
    ]
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
    }, [params.workId, user])

    // const editionHeader = (images: IImage[]) => {
    //     if (images.length > 0) {
    //         return (
    //             <Image preview width="50" src={"https://www.sf-bibliografia.fi/" + images[0].image_src} />
    //         )
    //     } else {
    //         return (<></>)
    //     }
    // }

    // const editionSubtitle = (title: string, original_title: string) => {
    //     if (title === original_title) {
    //         return <></>
    //     } else {
    //         return <>{title}</>
    //     }
    // }

    // const editionFooter = (edition: IEdition) => {
    //     return (
    //         <span>
    //             <Button label="Muokkaa" />

    //         </span>
    //     )
    // }

    const renderListItem = (edition: IEdition) => {
        return (
            <div className="col-12">
                <div className="grid">
                    <div className="col-8" >
                        <EditionDetails edition={edition} card work={edition.work[0]} />
                    </div>
                    <div className="flex col-4 justify-content-end align-content-center">
                        {edition.images.length > 0 &&
                            <Image className="pt-2" preview width="100px" src={IMAGE_URL + edition.images[0].image_src} />
                        }
                    </div>
                </div>
            </div>
        )
    }

    const renderGridItem = (edition: IEdition) => {
        return (
            <div className="col-12 md:col-4 editioncard">
                <div className="editionheader">
                    <div className="editionnum">
                        {EditionString(edition)}
                    </div>
                </div>
                <div className="editionimage">
                    {edition.images.length > 0 &&
                        <Image preview height="250px"
                            src={IMAGE_URL + edition.images[0].image_src}
                            alt={EditionString(edition) + " kansikuva"}
                        />
                    }
                </div>
                <div className="editioncontent">
                    <p className="editiontitle">{edition.title}</p>
                    <EditionDetails edition={edition} />
                </div>
                <div className="editionfooter">
                </div>
            </div>
        )
    }


    const itemTemplate = (edition: IEdition, layout: DataViewLayoutType) => {
        if (!edition) {
            return;
        }
        if (layout === 'list') {
            return renderListItem(edition);
        } else if (layout === 'grid') {
            return renderGridItem(edition);
        }
    }

    const renderHeader = () => {
        return (
            <div className="grid grid-nogutter">
                <div className="col" style={{ textAlign: 'left' }}>
                    <DataViewLayoutOptions layout={layout}
                        onChange={(e: DataViewLayoutOptionsChangeParams) => setLayout(e.value)} />
                </div>
            </div>
        )
    }

    const header = renderHeader();

    const panelTemplate = (options: any) => {
        const toggleIcon = options.collapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up';
        const className = `${options.className} justify-content-start`;
        const titleClassName = `${options.titleClassName} pl-1`;

        return (
            <div className={className}>
                <span className={titleClassName}>
                    Novellit
                </span>
                <button className={options.togglerClassName} onClick={options.onTogglerClick}>
                    <span className={toggleIcon}></span>
                    <Ripple />
                </button>
            </div>
        )
    }

    if (!work) return null;

    const anthology = isAnthology(work);

    return (
        <main className="all-content">
            <div className="mt-5 speeddial style={{ position: 'relative', height: '500px'}}">
                {/* user !== null && user.is_admin && ( */}
                <div>
                    <Tooltip target=".speeddial .speeddial-right .p-speedial-action">

                    </Tooltip>
                    <SpeedDial className="speeddial-right"
                        model={dialItems}
                        direction="left"
                        type="semi-circle"
                        radius={80}
                    />
                </div>
                {/* ) */}
                <WorkDetails work={work} />
                {
                    work.stories.length > 0 && (
                        <Panel header="Novellit"
                            headerTemplate={panelTemplate}
                            toggleable collapsed>
                            <ShortsList shorts={work.stories} person={work.authors[0]}
                                anthology={anthology}
                            />
                        </Panel>
                    )
                }
                <div>
                    <h2>Painokset</h2>
                    <div>
                        <DataView value={work.editions} layout={layout}
                            header={header} itemTemplate={itemTemplate} />
                        {/*{work.editions.map((edition) => {
                        return (
                            <div className="grid col-fixed m-1">
                                <Card title={EditionString(edition)}
                                    subTitle={editionSubtitle(edition.title, edition.work[0].orig_title)}
                                    header={editionHeader(edition.images)}
                                    footer={editionFooter(edition)}
                                    key={edition.id}>
                                    <EditionDetails edition={edition} work={work} />
                                </Card>
                            </div>
                        )
                    })} */}
                    </div>
                </div>
            </div>
        </main>
    )
}