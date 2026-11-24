import { Link } from "react-router-dom"
import { getBookseries } from "../../../api/bookseries/get-bookseries"
import { Skeleton } from "primereact/skeleton";
import { Bookseries } from "../../bookseries";
import { useEffect, useMemo, useState } from "react";
import { getCurrenUser } from "../../../services/auth-service";
import { seriesPosition } from "../utils/work-facts";
import { Work } from "../types";

interface WorkBookseriesBrowserProps {

    workId: number,
    bookseriesId: number
}

export default function WorkBookseriesBrowser({ workId, bookseriesId }: WorkBookseriesBrowserProps) {
    const user = useMemo(() => { return getCurrenUser() }, []);
    const [bookseries, setBookSeries] = useState<Bookseries | null>(null);

    useEffect(() => {
        getBookseries(bookseriesId, user).then(data => setBookSeries(data));
    }, [bookseriesId, user])

    // The series page's order (series order, number, original year, title), not the database order.
    const position = bookseries ? seriesPosition({ id: workId, bookseries } as unknown as Work) : null;
    const prev = position?.prev ?? null;
    const next = position?.next ?? null;
    const current = bookseries?.works.find(w => w.id === workId);
    return (
        <>
            {!(bookseries && workId !== -1) ?
                <Skeleton width="10rem"></Skeleton>
                :
                (
                    <>
                        {bookseries.partof && (
                            <>
                                <Link to={`/bookseries/${bookseries.partof.id}`}>
                                    <b>{bookseries.partof.name}</b>
                                </Link>
                                {" > "}
                            </>
                        )}
                        <Link to={`/bookseries/${bookseriesId}`}>
                            <b>{bookseries.name}</b>
                        </Link>
                        {current?.bookseriesnum && (
                                ", " + current.bookseriesnum
                            )}
                        {
                            prev &&
                            <Link to={`/works/${prev?.id}`}>
                                <i title={`${prev?.title}`} className="pi pi-caret-left"></i>
                            </Link>
                        }
                        {
                            next &&
                            <Link to={`/works/${next?.id}`}>
                                <i title={`${next?.title}`} className="pi pi-caret-right"></i>
                            </Link>
                        }
                    </>
                )
            }
        </>
    )
}