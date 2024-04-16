import { Link } from "react-router-dom"
import { getBookseries } from "../../../api/bookseries/get-bookseries"
import { Skeleton } from "primereact/skeleton";
import { Bookseries } from "../../bookseries";
import { Work } from "../types";
import { getWork } from "../../../api/work/get-work";
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
    let prevId = -1;
    let nextId = -1;

    useEffect(() => {
        getBookseries(bookseriesId, user).then(data => setBookSeries(data));
    }, [])

    if (bookseries) {
        for (let i = 0; i < bookseries?.works.length; i++) {
            if (bookseries.works[i].id === workId) {
                if (i > 0) {
                    prevId = bookseries.works[i - 1].id;
                }
                if (i < bookseries.works.length - 1) {
                    nextId = bookseries.works[i + 1].id;
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
                            <Link to={`/works/${prevId}`}>
                                <i className="pi pi-angle-left"></i>
                            </Link>
                        }
                        {
                            workIndex < bookseries.works.length - 1 &&
                            <Link to={`/works/${nextId}`}>
                                <i className="pi pi-angle-right"></i>
                            </Link>
                        }
                    </>
                )
            }
        </>
    )
}