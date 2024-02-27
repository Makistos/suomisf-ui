import React, { useRef } from "react";

import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";

import { EditionsStats } from "./edition-stats";
import { EditionsProps } from "../types";


export const EditionsStatsPanel = ({ editions }: EditionsProps) => {
    const op = useRef<OverlayPanel>(null);

    if (!editions)
        return null;

    return (
        <div>
            <Button
                type="button"
                label="Tilastoja"
                className="p-button-secondary"
                icon="fa-solid fa-chart-line"
                onClick={(e) => op.current?.toggle(e)}
                aria-haspopup
                aria-controls="editionsstats_panel"
                disabled={!editions || editions.length === 0}
            />
            <OverlayPanel
                ref={op}
                id="editionsstats_panel">
                <EditionsStats editions={editions} />
            </OverlayPanel>
        </div>
    );
};
