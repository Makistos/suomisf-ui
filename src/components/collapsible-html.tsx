import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "primereact/button";

import { safeHtml } from "@utils/safe-html";

interface CollapsibleHtmlProps {
    html: string;
    // Height of the collapsed text, in rem (about 1.5rem per line).
    collapsedHeight?: number;
    className?: string;
}

// Text only a little over the limit isn't worth collapsing: hiding two
// lines behind a button is more bother than showing them.
const COLLAPSE_SLACK = 1.3;

/**
 * Sanitized HTML that, when long, is shown clipped to collapsedHeight with a
 * fade at the bottom. Clicking the text (outside its links) or the button
 * below it toggles between the clipped and the full text.
 */
export const CollapsibleHtml = ({ html, collapsedHeight = 12, className }: CollapsibleHtmlProps) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [collapsible, setCollapsible] = useState(false);
    const [expanded, setExpanded] = useState(false);

    // Measure the full text height (scrollHeight ignores max-height) and
    // re-measure when the width changes, since that changes the line count.
    useLayoutEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        const measure = () => {
            const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
            setCollapsible(el.scrollHeight > collapsedHeight * rem * COLLAPSE_SLACK);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [html, collapsedHeight]);

    const collapsed = collapsible && !expanded;

    const onTextClick = (e: React.MouseEvent) => {
        if (!collapsible) return;
        // Let links in the text work, and don't toggle when selecting text.
        if ((e.target as HTMLElement).closest("a")) return;
        if (window.getSelection()?.toString()) return;
        setExpanded(v => !v);
    };

    return (
        <div className={className}>
            <div
                ref={contentRef}
                className={`html-content${collapsed ? " collapsible-html-collapsed" : ""}${collapsible ? " cursor-pointer" : ""}`}
                style={collapsed ? { maxHeight: `${collapsedHeight}rem` } : undefined}
                onClick={onTextClick}
                dangerouslySetInnerHTML={safeHtml(html)}
            />
            {collapsible && (
                <Button
                    link
                    size="small"
                    className="p-0 mt-1"
                    icon={expanded ? "pi pi-chevron-up" : "pi pi-chevron-down"}
                    label={expanded ? "Näytä vähemmän" : "Näytä koko kuvaus"}
                    aria-expanded={expanded}
                    onClick={() => setExpanded(v => !v)}
                />
            )}
        </div>
    );
};

export default CollapsibleHtml;
