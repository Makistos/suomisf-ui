import { useEffect, useState } from "react";
import { IPubseries } from "./Pubseries";
import { Link } from 'react-router-dom';

type PubseriesListProps = {
    pubseriesList: IPubseries[]
}

export const PubseriesList = ({ pubseriesList }: PubseriesListProps) => {
    const [pubseries, setPubseries]: [IPubseries[], (pubseries: IPubseries[]) => void] = useState<IPubseries[]>([]);

    useEffect(() => {
        setPubseries(pubseriesList);
    }, [pubseriesList])

    return (
        <div>
            {pubseries && (
                pubseries.map(pubseries => {
                    return (<>
                        <Link to={`/pubseries/${pubseries.id}`}>{pubseries.name}</Link><br /></>)
                })
            )}
        </div>
    )
}