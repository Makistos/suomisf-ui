import React from 'react';

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Rating } from "primereact/rating";
import { Link } from "react-router-dom";

import { EditionOwner } from "../types";

export interface EditionOwnersListProps {
    owners: EditionOwner[];
}

export const EditionOwnersList = ({ owners }: EditionOwnersListProps) => {

    const nameTemplate = (rowData: EditionOwner) => (
        <Link to={`/users/${rowData.user.id}`}>{rowData.user.name}</Link>
    )

    const conditionTemplate = (rowData: EditionOwner) => {
        if (!rowData.condition) return null;
        return (
            <Rating value={rowData.condition.value} readOnly cancel={false}
                className="p-rating-condensed"
            />
        )
    }

    return (
        <div>
            {owners && owners.length > 0 && (
                <DataTable value={owners} responsiveLayout="stack">
                    <Column field="user.name" header="Omistaja" body={nameTemplate} />
                    <Column field="condition.value" header="Kunto" body={conditionTemplate} />
                </DataTable>
            )}
        </div>
    )
}
