import { getShort } from "@api/short/get-short"
import { useDocumentTitle } from "@components/document-title"
import { LinkList } from "@components/link-list"
import { GenreGroup } from "@features/genre"
import { TagGroup } from "@features/tag"
import { getCurrenUser } from "@services/auth-service"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { selectId } from "@utils/select-id"
import { ProgressSpinner } from "primereact/progressspinner"
import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ShortsForm } from "../components"
import { Dialog } from "primereact/dialog"
import { Toast } from "primereact/toast"
import { SpeedDial } from "primereact/speeddial"
import { isAdmin } from "@features/user"
import { EditionSummary } from "@features/edition"
import { Tooltip } from "primereact/tooltip"
import { Card } from "primereact/card"
import { TabPanel, TabView } from "primereact/tabview"
import { ShortDetails } from "../components/short-defails"

interface ShortPageProps {
    id: string | null
}

export const ShortPage = (props: ShortPageProps) => {
    const user = useMemo(() => getCurrenUser(), [])
    const [queryEnabled, setQueryEnabled] = useState(true);
    const [shortFormVisible, setShortFormVisible] = useState(false);
    const [documentTitle, setDocumentTitle] = useDocumentTitle("");
    const params = useParams();
    let shortId = "";
    const toastRef = useRef<Toast>(null);
    const navigate = useNavigate();

    const queryClient = useQueryClient();

    try {
        shortId = selectId(params, props.id);
    } catch (e) {
        console.log(`${e} short`);
    }

    const fetchShort = async () => {
        if (!shortId) { return null; }
        const response = await getShort(shortId, user);
        return response
    }
    const { isLoading, data } = useQuery({
        queryKey: ['short', shortId],
        queryFn: () => fetchShort(),
        enabled: queryEnabled
    })

    useEffect(() => {
        if (data !== undefined && data !== null) {
            setDocumentTitle(data.title);
        }
    }, [data])

    const dialItems = [
        {
            label: 'Muokkaa',
            icon: 'pi pi-pencil',
            command: () => setShortFormVisible(true)
        },
    ]

    const onShow = () => {

    }

    const onHide = () => {

    }

    const onNewShort = (id: string, visible: boolean) => {
        queryClient.invalidateQueries({ queryKey: ['short', id] });
        toastRef.current?.show({ severity: 'success', summary: 'Tallentaminen onnistui' });
        setShortFormVisible(false);
    }

    const shortDeleted = () => {
        queryClient.invalidateQueries();
        navigate(-1);
    }
    if (!data) return null;

    console.log(data);
    return (
        <main className="person-page">
            <Toast ref={toastRef} />
            {isAdmin(user) && (
                <>
                    <Tooltip position="left" target=".fixed-dial .p-speeddial-action" />
                    <SpeedDial
                        model={dialItems}
                        direction="up"
                        className="fixed-dial"
                        showIcon="pi pi-plus"
                        hideIcon="pi pi-times"
                        buttonClassName="p-button-primary"
                    />
                </>
            )}
            {isLoading ? (
                <div className="progressbar">
                    <ProgressSpinner />
                </div>
            ) : (
                < div className="grid">
                    {/* Header Section */}
                    <div className="col-12">
                        <Card className="shadow-3">
                            <div className="grid pl-2 pr-2 pt-0">
                                <div className="col-12 lg:col-9">
                                    <div className="flex-column">
                                        <ShortDetails short={data} />
                                    </div>
                                </div>
                                <div className="col-12 lg:col-3">
                                    <div className="flex flex-column gap-4">
                                        <div className="flex flex-column gap-2">
                                            <h3 className="text-sm uppercase text-600 m-0">Genret</h3>
                                            <GenreGroup
                                                genres={data.genres}
                                                showOneCount
                                                className="flex-wrap"
                                            />
                                        </div>

                                        {data.tags && data.tags.length > 0 && (
                                            <div className="flex flex-column gap-2">
                                                <h3 className="text-sm uppercase text-600 m-0">Asiasanat</h3>
                                                <TagGroup
                                                    tags={data.tags}
                                                    overflow={5}
                                                    showOneCount
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="col-12">
                        <TabView className="shadow-2" scrollable={true}>
                            {data.editions.length > 0 && (
                                <TabPanel header="Kirjoissa" leftIcon="pi pi-book">
                                    <div className="card">
                                        {data.editions.map(edition => (
                                            <span key={edition.id}>
                                                <EditionSummary edition={edition}
                                                    showPerson={true}
                                                    showVersion={true}
                                                    work={edition.work[0]}
                                                    isOwned={true} />
                                            </span>
                                        ))}
                                    </div>
                                </TabPanel>
                            )}
                            {data.issues.length > 0 && (
                                <TabPanel header="Lehdissä" leftIcon="pi pi-magazine">
                                    <div className="card">
                                        {data.issues.map(issue => (
                                            <span key={issue.id}>
                                                <Link to={`/magazines/${issue.magazine.id}`}
                                                    key={issue.id}>
                                                    {issue.magazine.name} {issue.cover_number}.
                                                    <br />
                                                </Link>
                                            </span>
                                        ))}
                                    </div>
                                </TabPanel>
                            )}
                        </TabView>
                    </div>
                    <Dialog maximizable blockScroll
                        className="w-full xl:w-6"
                        visible={shortFormVisible}
                        onShow={onShow}
                        onHide={onHide}
                        header="Muokkaa">
                        <ShortsForm short={data}
                            onSubmitCallback={onNewShort}
                            onClose={() => setShortFormVisible(false)}
                            onDelete={() => shortDeleted()}
                        />
                    </Dialog>

                </div>
            )}
        </main>
    )
}
