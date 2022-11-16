import { useEffect, useState } from "react";
import { Pubseries } from "../features/pubseries/types";
import { Link } from 'react-router-dom';

type PubseriesListProps = {
    pubseriesList: Pubseries[]
}

export const PubseriesList = ({ pubseriesList }: PubseriesListProps) => {
    const [pubseries, setPubseries]: [Pubseries[], (pubseries: Pubseries[]) => void] = useState<Pubseries[]>([]);

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