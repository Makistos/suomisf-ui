import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';

import { Work, WorkSummary } from "../../work";
import { groupByBookSeries } from "../utils";

interface SeriesListProps {
    works: Work[],
    seriesType: string
}

export const BookSeriesList = ({ works, seriesType }: SeriesListProps) => {
    const [groupedSeries, setGroupedSeries]: [Record<string, Work[]>,
        (works: Record<string, Work[]>) => void] = useState({});
    const [bookseries, setBookseries]: [Record<string, number>,
        (bookseries: Record<string, number>) => void] = useState({});

    const findBookseries = (works: Work[]) => {
        /* Create a dictionary which maps bookseries names with bookseries ids.
           This is needed for creating links to bookseries.
         */
        let retval = {};
        retval = Object.assign({},
            ...works.filter(work => work[seriesType])
                .map(work => ({ [work[seriesType].name]: work[seriesType].id })));
        return retval;
    }

    useEffect(() => {
        setGroupedSeries(groupByBookSeries(
            works.filter(work => work.bookseries !== null), seriesType));
        setBookseries(findBookseries(works)); // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [works, seriesType])

    return (
        <div>
            {
                Object.entries(groupedSeries)
                    .map(([seriesName, ser]) => {
                        return (
                            <div key={bookseries[seriesName]}>
                                <h3><Link to={`/${seriesType}/${bookseries[seriesName]}`} key={bookseries[seriesName]}>
                                    {seriesName}
                                </Link>
                                </h3>
                                {
                                    ser.sort((a, b) => a.pubyear < b.pubyear ? -1 : 1).map((work: Work) => (
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