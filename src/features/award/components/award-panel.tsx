import React, { useRef } from "react";

import { OverlayPanel } from "primereact/overlaypanel";
import { Button } from "primereact/button";

import { AwardedProps, AwardList } from "./award-list";


export const AwardPanel = ({ awards }: AwardedProps) => {
    const op = useRef<OverlayPanel>(null);

    const buttonHeader = () => {
        return "Palkinnot (" + awards?.length.toString() + ")";
    };
    if (!awards)
        return null;

    return (
        <div>
            <Button
                type="button"
                label={buttonHeader()}
                className="p-button-secondary"
                icon="fa-solid fa-award"
                onClick={(e) => op.current?.toggle(e)}
                aria-haspopup
                aria-controls="awards_panel"
                disabled={awards.length === 0} />
            <OverlayPanel
                ref={op}
                id="awards_panel">
                <AwardList awards={awards} />
            </OverlayPanel>
        </div>
    );
};
