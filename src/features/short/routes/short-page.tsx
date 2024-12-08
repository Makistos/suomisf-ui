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
import { removeDuplicateContributions } from "@utils/remove-duplicate-contributions"

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
        <> {isLoading ?
            <div className="progressbar">
                <ProgressSpinner />
            </div>
            :
            <div className="mt-5 speeddial style={{ position: 'relative', height: '500px'}}">
                {isAdmin(user) &&
                    <SpeedDial className="speeddial-right"
                        model={dialItems}
                        direction="left"
                        type="semi-circle"
                        radius={80}
                    />
                }
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
                <div className="grid align-items-center justify-content-center">
                    {data.contributors.filter(person => person.role.id === 1).length > 0 && (
                        <div className="grid col-12 justify-content-center">
                            <h2 className="mb-0 font-semibold">
                                <LinkList path="people"
                                    separator=" &amp; "
                                    items={removeDuplicateContributions(data.contributors).filter(person => person.role.id === 1).map((item) => ({
                                        id: item.person['id'],
                                        name: item.person['alt_name'] ? item.person['alt_name'] : item.person['name']
                                    }))} />
                            </h2>
                        </div>
                    )}
                    {data.contributors &&
                        data.contributors.filter(person => person.role.id === 1).length === 0 &&
                        data.contributors.filter(person => person.role.id === 3).length > 0 && (
                            <div className="grid col-12 justify-content-center">
                                <h2 className="mb-0 font-semibold">
                                    <LinkList path="people"
                                        separator=" &amp; "
                                        items={removeDuplicateContributions(data.contributors).filter(person => person.role.id === 3).map((item) => ({
                                            id: item.person['id'],
                                            name: item.person['alt_name'] ? item.person['alt_name'] : item.person['name']
                                        }))} />
                                </h2>
                            </div>
                        )}
                    <div className="grid col-12 justify-content-center">
                        <h1 className="mt-1 mb-0">{data.title}</h1>
                    </div>
                    <p className="mt-1">
                        {data.orig_title && data.orig_title !== data.title &&
                            data.orig_title
                        }
                        {data.orig_title && data.orig_title !== data.title && data.pubyear && ", "}
                        {data.pubyear && data.pubyear}
                        &nbsp;{data.lang && "(" + data.lang.name + ")"}
                    </p>
                    <div className="grid col-12 justify-content-center">
                        <GenreGroup genres={data.genres} />
                    </div>
                    <div className="col-12 justify-content-start">
                        {data.type.name}.<br />
                        {data.contributors.filter(contrib => contrib.role.id === 2).length > 0 && (
                            <>
                                Suom.&nbsp;
                                <LinkList path="people"
                                    separator=" &amp; "
                                    items={removeDuplicateContributions(data.contributors).filter(contrib => contrib.role.id === 2).map((item) => ({
                                        id: item.person['id'],
                                        name: item.person['alt_name'] ? item.person['alt_name'] : item.person['name']
                                    }))} />
                            </>
                        )}
                        {data.contributors.filter(contrib => contrib.role.id === 6).length > 0 && (
                            <>
                                Henkilöt&nbsp;
                                <LinkList path="people"
                                    separator=" &amp; "
                                    items={data.contributors.filter(contrib => contrib.role.id === 6).map((item) => ({
                                        id: item.person['id'],
                                        name: item.person['alt_name'] ? item.person['alt_name'] : item.person['name']
                                    }))} />
                            </>
                        )}
                        <br /><TagGroup tags={data.tags} overflow={10} showOneCount={false} />
                    </div>
                    <div className="col-12 justify-content-start mt-3">
                        {data.editions.length > 0 && (
                            <div>
                                <h3>Kirjoissa</h3>
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
                        )}
                        {data.issues.length > 0 && (
                            <div>
                                <h3>Lehdissä</h3>
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
                        )}
                    </div>
                </div>
            </div>
        }
        </>
    )

}
