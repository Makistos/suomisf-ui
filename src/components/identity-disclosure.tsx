import { ReactNode, useId, useState } from "react";

interface DisclosureProps {
    /** "Näytä kuvaus" */
    showLabel: string;
    /** "Piilota kuvaus" */
    hideLabel: string;
    /** Class of the button; each identity page styles it with its own prefix. */
    className?: string;
    children: ReactNode;
}

/**
 * A closed section behind a text button, for the identity pages: only the button shows until the reader opens it
 * (work-identity.md, revision plan). The content mounts on opening, so a closed description or shelf costs nothing.
 */
export const IdentityDisclosure = ({ showLabel, hideLabel, className, children }: DisclosureProps) => {
    const [open, setOpen] = useState(false);
    const id = useId();
    return (
        <>
            <button type="button" className={className} aria-expanded={open} aria-controls={id} onClick={() => setOpen(o => !o)}>
                <i className={`pi pi-chevron-${open ? "up" : "down"}`} aria-hidden="true" />
                {open ? hideLabel : showLabel}
            </button>
            <div id={id} hidden={!open}>{open && children}</div>
        </>
    );
};
