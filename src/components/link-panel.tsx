import { useRef } from "react";

import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";

import { LinksProps, Links } from "./links";


export const LinkPanel = ({ links }: LinksProps) => {
    // An overlay panel that shows the links for an item
    // (person, work, etc).
    const op = useRef<OverlayPanel>(null);

    if (!links)
        return null;

    return (
        <>
            <Button
                type="button"
                label="Linkit"
                className="p-button-secondary"
                icon="fa-solid fa-link"
                onClick={(e) => op.current?.toggle(e)}
                aria-haspopup
                aria-controls="links_panel"
                disabled={!links || links.length === 0} />
            <OverlayPanel
                ref={op}
                id="links_panel">
                <Links links={links} target="_blank" />
            </OverlayPanel>
        </>
    );
};
