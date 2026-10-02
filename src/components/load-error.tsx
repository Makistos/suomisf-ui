import { isAxiosError } from "axios";
import { Link } from "react-router-dom";
import { Button } from "primereact/button";

interface LoadErrorProps {
    /** Error from the page's main query; omit for a plain not-found. */
    error?: unknown;
    /** Heading when the record doesn't exist, e.g. "Teosta ei löytynyt". */
    notFoundTitle: string;
    /** Replaces the default not-found explanation. */
    notFoundText?: string;
    /** Refetch for the "loading failed" case. */
    onRetry?: () => void;
}

/** Not found (4xx, or no error at all) vs. loading failed (5xx/network). */
export const isNotFound = (error?: unknown) => {
    if (!error) return true;
    const status = isAxiosError(error) ? error.response?.status : undefined;
    return status !== undefined && status >= 400 && status < 500;
};

/**
 * Shown in place of an entity page when its record is missing or its data
 * couldn't be loaded, instead of a blank page or an endless spinner.
 */
export const LoadError = ({ error, notFoundTitle, notFoundText, onRetry }: LoadErrorProps) => {
    const notFound = isNotFound(error);
    return (
        <main className="all-content">
            <div className="py-5">
                <h1 className="text-2xl mt-0 mb-3">
                    {notFound ? notFoundTitle : "Tietojen lataaminen epäonnistui"}
                </h1>
                <p className="mt-0 mb-4 text-color-secondary">
                    {notFound
                        ? notFoundText ?? "Tarkista osoite. Tieto on voitu myös poistaa tai yhdistää toiseen."
                        : "Palvelimeen ei saatu yhteyttä tai se ei vastannut. Yritä hetken kuluttua uudelleen."}
                </p>
                <div className="flex flex-wrap gap-2 align-items-center">
                    {!notFound && onRetry && (
                        <Button label="Yritä uudelleen" icon="pi pi-refresh" onClick={onRetry} />
                    )}
                    <Link to="/">Palaa etusivulle</Link>
                </div>
            </div>
        </main>
    );
};
