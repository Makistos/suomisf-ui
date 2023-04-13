import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";

import { Image } from "primereact/image";
import { DataView, DataViewLayoutOptions, DataViewLayoutType, DataViewLayoutOptionsChangeParams } from "primereact/dataview";
import { Panel } from "primereact/panel";
import { Ripple } from "primereact/ripple";
import { Tooltip } from "primereact/tooltip";
import { SpeedDial } from "primereact/speeddial";
import { confirmDialog } from "primereact/confirmdialog";

import { Edition, EditionString, EditionDetails } from "../../edition";
//import { IMAGE_URL } from "../../../systemProps";
import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { ShortsList } from "../../short";
import { Work } from "../types";
import { WorkDetails } from "../components/work-details";
import { isAnthology } from "../utils/is-anthology";
import { selectId } from "../../../utils";
import { useDocumentTitle } from '../../../components/document-title';

export interface WorkProps {
    work: Work,
    detailLevel?: string,
    orderField?: string
}

const baseURL = "works/";

interface WorkPageProps {
    id: string | null;
}

let workId = "";

export const WorkPage = ({ id }: WorkPageProps) => {
    const params = useParams();
    const user = useMemo(() => { return getCurrenUser() }, []);
    const [work, setWork]: [Work | null, (work: Work) => void] = useState<Work | null>(null);
    const [layout, setLayout]: [DataViewLayoutType, (layout: DataViewLayoutType) => void] = useState<DataViewLayoutType>('list');
    const [documentTitle, setDocumentTitle] = useDocumentTitle("");
    const ConfirmNewWork = () => {
        confirmDialog({
            message: 'Tähän tulee uuden teoksen lisäys-näkymä',
            header: 'Uuden teoksen lisääminen',
            icon: 'fa-solid fa-circle-plus'
        });
    };

    try {
        workId = selectId(params, id);
    } catch (e) {
        console.log(`${e} bookseries`);
    }


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
            let url = baseURL + workId;
            try {
                const response = await getApiContent(url, user);
                setWork(response.data);
            } catch (e) {
                console.error(e);
            }
        }
        getWork();
    }, [params.workId, user])

    useEffect(() => {
        if (work !== undefined && work !== null)
            setDocumentTitle(work.title);
    }, [work])

    const renderListItem = (edition: Edition) => {
        return (
            <div className="col-12">
                <div className="grid">
                    <div className="col-8" >
                        <EditionDetails edition={edition} card work={edition.work[0]} />
                    </div>
                    <div className="flex col-4 justify-content-end align-content-center">
                        {edition.images.length > 0 &&
                            <Image className="pt-2" preview width="100px" src={process.env.REACT_APP_IMAGE_URL + edition.images[0].image_src} />
                        }
                    </div>
                </div>
            </div>
        )
    }

    const renderGridItem = (edition: Edition) => {
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
                            src={process.env.REACT_APP_IMAGE_URL + edition.images[0].image_src}
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


    const itemTemplate = (edition: Edition, layout: DataViewLayoutType) => {
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