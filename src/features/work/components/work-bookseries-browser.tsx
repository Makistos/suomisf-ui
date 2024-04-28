import { Link } from "react-router-dom"
import { getBookseries } from "../../../api/bookseries/get-bookseries"
import { Skeleton } from "primereact/skeleton";
import { Bookseries } from "../../bookseries";
import { useEffect, useMemo, useState } from "react";
import { getCurrenUser } from "../../../services/auth-service";

interface WorkBookseriesBrowserProps {

    workId: number,
    bookseriesId: number
}

export default function WorkBookseriesBrowser({ workId, bookseriesId }: WorkBookseriesBrowserProps) {
    const user = useMemo(() => { return getCurrenUser() }, []);
    const [bookseries, setBookSeries] = useState<Bookseries | null>(null);
    let workIndex = -1;
    let prev = null;
    let next = null;

    useEffect(() => {
        getBookseries(bookseriesId, user).then(data => setBookSeries(data));
    }, [user])

    if (bookseries) {
        for (let i = 0; i < bookseries?.works.length; i++) {
            if (bookseries.works[i].id === workId) {
                if (i > 0) {
                    prev = bookseries.works[i - 1];
                }
                if (i < bookseries.works.length - 1) {
                    next = bookseries.works[i + 1];
                }
                workIndex = i;

            }
        }
    }
    console.log(workIndex);
    return (
        <>
            {!(bookseries && workId !== -1) ?
                <Skeleton width="10rem"></Skeleton>
                :
                (
                    <>
                        <Link to={`/bookseries/${bookseriesId}`}>
                            <b>{bookseries.name}</b>
                        </Link>
                        {bookseries.works[workIndex] &&
                            bookseries.works[workIndex].bookseriesnum && (
                                ", " + bookseries.works[workIndex].bookseriesnum
                            )}
                        {
                            workIndex > 0 &&
                            <Link to={`/works/${prev?.id}`}>
                                <i title={`${prev?.title}`} className="pi pi-caret-left"></i>
                            </Link>
                        }
                        {
                            workIndex < bookseries.works.length - 1 &&
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