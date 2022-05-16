import { Link } from 'react-router-dom';
import { useEffect, useState } from "react";
import { IWork, WorkSummary } from "./Work";
import { groupByBookSeries } from "./Bookseries";

interface SeriesListProps {
    works: IWork[]
}

export const SeriesList = ({ works }: SeriesListProps) => {
    const [groupedSeries, setGroupedSeries]: [Record<string, IWork[]>,
        (works: Record<string, IWork[]>) => void] = useState({});
    const [bookseries, setBookseries]: [Record<string, number>,
        (bookseries: Record<string, number>) => void] = useState({});

    const findBookseries = (works: IWork[]) => {
        /* Create a dictionary which maps bookseries names with bookseries ids.
           This is needed for creating links to bookseries.
         */
        let retval = {};
        retval = Object.assign({},
            ...works.filter(work => work.bookseries)
                .map(work => ({ [work.bookseries.name]: work.bookseries.id })));
        return retval;
    }

    useEffect(() => {
        setGroupedSeries(groupByBookSeries(works.filter(work => work.bookseries !== null)));
        setBookseries(findBookseries(works));
    }, [works])

    return (
        <div>
            {
                Object.entries(groupedSeries)
                    .map(([seriesName, ser]) => {
                        return (
                            <div key={bookseries[seriesName]}>
                                <h3><Link to={`/bookseries/${bookseries[seriesName]}`} key={bookseries[seriesName]}>
                                    {seriesName}
                                </Link>
                                </h3>
                                {
                                    ser.sort((a, b) => a.pubyear < b.pubyear ? -1 : 1).map((work: IWork) => (
                                        <WorkSummary work={work} key={work.id}
                                            detailLevel="brief"
                                            orderField="title"
                                        />
                                    ))
                                }
                            </div>
                        )
                    })
            }
        </div>
    )
}