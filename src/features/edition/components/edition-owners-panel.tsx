import React, { useRef } from "react";

import { OverlayPanel } from "primereact/overlaypanel";
import { Button } from "primereact/button";
import { useQuery } from "@tanstack/react-query";

import { getOwners } from "../../../api/edition/get-owners";
import { EditionOwnersList } from "./edition-owners-list";

interface EditionOwnersPanelProps {
    editionId: number;
    currentUserId: number;
}

export const EditionOwnersPanel = ({ editionId, currentUserId }: EditionOwnersPanelProps) => {
    const op = useRef<OverlayPanel>(null);

    const { data: owners } = useQuery({
        queryKey: ['edition', 'owners', editionId],
        queryFn: () => getOwners(editionId),
        staleTime: 5 * 60 * 1000,
    });

    const otherOwners = owners?.filter(
        owner => Number(owner.user.id) !== Number(currentUserId)) ?? [];

    if (otherOwners.length === 0) return null;

    return (
        <div>
            <Button
                type="button"
                icon="fa-solid fa-users"
                tooltip={`Muut omistajat (${otherOwners.length})`}
                className="p-button-text"
                onClick={(e) => op.current?.toggle(e)}
                aria-haspopup
                aria-controls="edition_owners_panel" />
            <OverlayPanel
                ref={op}
                id="edition_owners_panel">
                <EditionOwnersList owners={otherOwners} />
            </OverlayPanel>
        </div>
    );
};
