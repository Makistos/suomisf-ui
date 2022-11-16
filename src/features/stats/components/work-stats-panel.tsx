import { useRef } from "react";

import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";

import { WorksProps } from "../types";
import { WorkStats } from "./work-stats";


export const WorkStatsPanel = ({ works }: WorksProps) => {
    const op = useRef<OverlayPanel>(null);

    if (!works)
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
                aria-controls="workstats_panel" />
            <OverlayPanel
                ref={op}
                id="editionsstats_panel">
                <WorkStats works={works} />
            </OverlayPanel>


        </div>
    );
};
