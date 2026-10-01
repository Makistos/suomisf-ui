import { Fragment, useMemo } from "react";
import { Link } from 'react-router-dom';

import { Pubseries } from "../types";

type PubseriesListProps = {
    pubseriesList: Pubseries[]
}

export const PubseriesList = ({ pubseriesList }: PubseriesListProps) => {
    const sortedPubseries = useMemo(
        () => [...pubseriesList].sort((a, b) => a.name.localeCompare(b.name, "fi")),
        [pubseriesList]);

    return (
        <div key="pubserieslist">
            {sortedPubseries.map(pubseries =>
                <Fragment key={'pubseries-' + pubseries.id}>
                    <Link to={`/pubseries/${pubseries.id}`}>{pubseries.name}</Link><br />
                </Fragment>
            )}
        </div>
    )
}