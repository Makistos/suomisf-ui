interface KirjasampoImportedNoteProps {
    // ISO timestamp of the last Kirjasampo tag import (Work.kirjasampo_imported).
    imported?: string | null;
    className?: string;
}

/**
 * Small note telling that the work's tags have been imported from
 * Kirjasampo, with the date of the last import. Renders nothing if the
 * import has never been done.
 */
export const KirjasampoImportedNote = ({ imported, className }: KirjasampoImportedNoteProps) => {
    if (!imported) return null;
    const date = new Date(imported).toLocaleDateString('fi-FI');
    return (
        <span
            className={`text-xs text-color-secondary${className ? ` ${className}` : ''}`}
            title="Asiasanat on tuotu Kirjasamposta"
        >
            <i className="pi pi-check-circle mr-1" style={{ fontSize: '0.75rem' }} />
            Tuotu Kirjasamposta <span className="white-space-nowrap">{date}</span>
        </span>
    );
};
