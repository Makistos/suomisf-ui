import { ReactNode, Suspense, useCallback, useEffect, useState } from "react";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";

import { getCurrenUser } from "@services/auth-service";
import { isAdmin } from "@features/user";
import {
    isPageVersionHotkey, PAGE_VERSION_HOTKEY, readPageVersion, writePageVersion, type PageVersion,
} from "@utils/page-version";

const storage = () => {
    try { return window.localStorage; } catch { return null; }
};

interface PageVersionSwitchProps {
    /** localStorage key of this page type's choice. */
    storageKey: string;
    /** "henkilösivu", "teossivu": the button reads "Uusi henkilösivu" / "Nykyinen henkilösivu". */
    pageName: string;
    current: ReactNode;
    /** Rendered only for admins who chose it; lazy-load it so visitors never download it. */
    next: ReactNode;
}

/**
 * A page under trial. Everyone sees the current page; an admin can switch
 * to the new version with the button or Shift+U, and the choice stays in
 * this browser until switched back.
 */
export const PageVersionSwitch = ({ storageKey, pageName, current, next }: PageVersionSwitchProps) => {
    const admin = isAdmin(getCurrenUser());
    const [version, setVersion] = useState<PageVersion>(() => readPageVersion(storage(), storageKey));
    const showNew = admin && version === "uusi";

    const toggle = useCallback(() => setVersion(v => {
        const nextVersion: PageVersion = v === "uusi" ? "vanha" : "uusi";
        writePageVersion(storage(), storageKey, nextVersion);
        return nextVersion;
    }), [storageKey]);

    useEffect(() => {
        if (!admin) return;
        const onKey = (e: KeyboardEvent) => {
            if (!isPageVersionHotkey(e)) return;
            e.preventDefault();
            toggle();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [admin, toggle]);

    return (
        <>
            {showNew ? (
                <Suspense fallback={<div className="flex justify-content-center p-5"><ProgressSpinner /></div>}>
                    {next}
                </Suspense>
            ) : current}
            {admin && (
                <Button type="button" size="small" severity="secondary" raised
                    icon={showNew ? "pi pi-undo" : "pi pi-eye"}
                    label={showNew ? `Nykyinen ${pageName}` : `Uusi ${pageName}`}
                    aria-keyshortcuts={PAGE_VERSION_HOTKEY}
                    tooltip={`${showNew ? `Palaa nykyiseen ${pageName}un` : `Kokeile uutta ${pageName}a (näkyy vain ylläpitäjille)`} – ${PAGE_VERSION_HOTKEY}`}
                    tooltipOptions={{ position: "top" }}
                    data-testid="page-version"
                    style={{ position: "fixed", left: "1rem", bottom: "1rem", zIndex: 1000 }}
                    onClick={toggle} />
            )}
        </>
    );
};
