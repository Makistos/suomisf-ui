import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCurrenUser } from "../services/auth-service";
import { getApiContent } from "../services/user-service";
import { IEdition } from "../feature/Edition/Edition";
import { IPublisher } from "../feature/Publisher/Publisher";
import { IWork } from "../feature/Work";
import { WorkList } from "../feature/Work/WorkList";

const baseURL = 'bookseries/';
export interface IBookseries {
    id: number,
    name: string,
    orig_name: string,
    important: number,
    image_src: string,
    image_attr: string,
    works: IWork[],
    publisher: IPublisher,
    editions: IEdition[]
}

export const groupByBookSeries = (works: IWork[], seriesType: string) => {
    const grouped: Record<string, IWork[]> =
        works.reduce((acc: { [index: string]: any }, currentValue) => {

            const groupKey = currentValue[seriesType].name;
            if (!acc[groupKey]) {
                acc[groupKey] = []
            }
            acc[groupKey].push(currentValue);
            return acc;
        }, {})
    return grouped;
}

export const BookseriesSummary = () => {
    return (
        <div></div>
    )
}


export const Bookseries = () => {
    const params = useParams();
    const user = getCurrenUser();

    const [bookseries, setBookseries]: [IBookseries | null, (bookseries: IBookseries) => void] = useState<IBookseries | null>(null);

    useEffect(() => {
        async function getBookseries() {
            let url = baseURL + params.bookseriesId?.toString();
            try {
                const response = await getApiContent(url, user);
                setBookseries(response.data);
            } catch (e) {
                console.error(e);
            }
        }
        getBookseries();
    }, [params.bookseriesId, user])

    if (!bookseries) return null;

    return (
        <main className="all-content">
            <div className="mb-5">
                <div className="grid col-12 mb-1 justify-content-center">
                    <h1 className="maintitle">{bookseries.name}</h1>
                </div>
                {bookseries.orig_name && (
                    <div className="grid col-12 mt-0 justify-content-center">
                        <h2>({bookseries.orig_name})</h2>
                    </div>
                )}
            </div>
            <div className="mt-5">
                <WorkList works={bookseries.works} />
            </div>
        </main>
    )
}
