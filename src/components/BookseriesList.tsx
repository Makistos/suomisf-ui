import { useEffect, useState } from "react";
import { IWork, WorkSummary } from "./Work";
import { groupByBookSeries } from "./Bookseries";

interface SeriesListProps {
    works: IWork[]
}

export const SeriesList = ({ works }: SeriesListProps) => {
    const [groupedSeries, setGroupedSeries]: [Record<string, IWork[]>,
        (works: Record<string, IWork[]>) => void] = useState({});

    useEffect(() => {
        setGroupedSeries(groupByBookSeries(works.filter(work => work.bookseries !== null)));
    }, [works])

    return (
        <div>
            {
                Object.entries(groupedSeries)
                    .map(([seriesName, ser]) => {
                        return (
                            <div>
                                <h3>{seriesName}</h3>
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