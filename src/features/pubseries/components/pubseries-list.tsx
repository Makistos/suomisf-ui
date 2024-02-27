import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';

import { Pubseries } from "../types";

type PubseriesListProps = {
    pubseriesList: Pubseries[]
}

export const PubseriesList = ({ pubseriesList }: PubseriesListProps) => {
    const [pubseries, setPubseries]: [Pubseries[], (pubseries: Pubseries[]) => void] = useState<Pubseries[]>([]);

    useEffect(() => {
        setPubseries(pubseriesList);
    }, [pubseriesList])

    return (
        <div key="pubserieslist">
            {pubseries && (
                pubseries.map(pubseries =>
                    <>
                        <Link key={'pubseries-' + pubseries.id} to={`/pubseries/${pubseries.id}`}>{pubseries.name}</Link><br />
                    </>
                ))}
        </div>
    )
}