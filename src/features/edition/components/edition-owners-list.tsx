import React from 'react';

import { Rating } from "primereact/rating";
import { Link } from "react-router-dom";

import { EditionOwner } from "../types";

export interface EditionOwnersListProps {
    owners: EditionOwner[];
}

export const EditionOwnersList = ({ owners }: EditionOwnersListProps) => {
    if (!owners || owners.length === 0) return null;

    return (
        <div className="flex flex-column gap-3">
            {owners.map((owner, idx) => (
                <div key={idx} className="flex align-items-center gap-3 flex-wrap">
                    <Link to={`/users/${owner.user.id}`}>{owner.user.name}</Link>
                    {owner.condition && (
                        <Rating value={owner.condition.value} readOnly cancel={false}
                            className="p-rating-condensed"
                        />
                    )}
                </div>
            ))}
        </div>
    )
}
