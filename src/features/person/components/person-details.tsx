import { useMemo, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { getCountryCode } from "@utils/country-utils"
import { Person, PersonBrief } from "../types"
import { useWikimediaImage, WikiImageInfo } from "../hooks/use-wikimedia-image"
import { getCurrenUser } from "../../../services/auth-service"
import { postApiContent } from "../../../services/user-service"
import { isAdmin } from "../../user"
import { Toast } from "primereact/toast"

interface PersonDetailsProps {
    person: Person
}

export const PersonDetails = ({ person: data }: PersonDetailsProps) => {
    const user = useMemo(() => getCurrenUser(), []);
    const hasImageRecord = !!(data.images && data.images.length > 0);
    const hasStoredImage = data.images?.some(img => img.src) ?? false;
    const savedRef = useRef(false);
    const toastRef = useRef<Toast>(null);
    const wasLoadingRef = useRef(false);

    const { imageInfo, isLoading } = useWikimediaImage(data, !hasImageRecord && isAdmin(user));

    useEffect(() => {
        if (isLoading) {
            wasLoadingRef.current = true;
        } else if (wasLoadingRef.current) {
            wasLoadingRef.current = false;
            if (imageInfo) {
                toastRef.current?.show({ severity: 'success', summary: 'Kuva lisätty', life: 3000 });
            } else {
                toastRef.current?.show({ severity: 'info', summary: 'Kuvia ei löytynyt', life: 3000 });
            }
        }
    }, [isLoading, imageInfo]);

    const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '').trim();

    // Auto-save newly discovered Wikidata image in the background
    useEffect(() => {
        if (!imageInfo || hasStoredImage || savedRef.current || String(data.qid) === '0' || !isAdmin(user)) return;
        savedRef.current = true;
        const saves = [
            postApiContent(`person/${data.id}/images`, {
                src: imageInfo.url,
                attr: stripHtml(imageInfo.credit || ''),
                license: imageInfo.license || '',
            }, user),
        ];
        if (imageInfo.descriptionUrl) {
            saves.push(postApiContent(`person/${data.id}/links`, {
                link: imageInfo.descriptionUrl,
                description: 'Wikimedia Commons'
            }, user));
        }
        Promise.all(saves).catch(console.error);
    }, [imageInfo]);

    const wikimediaLink = data.links?.find(l => l.description === 'Wikimedia Commons')?.link ?? null;

    const storedImageEntry = data.images?.find(img => img.src) ?? null;
    const displayImage: WikiImageInfo | null = storedImageEntry
        ? {
            url: storedImageEntry.src,
            descriptionUrl: wikimediaLink,
            credit: storedImageEntry.attr || null,
            license: storedImageEntry.license || null
        }
        : imageInfo;

    return (
        <>
            <Toast ref={toastRef} />
            <div className="grid">
                <div className="col-12 flex align-items-start gap-3 mt-3 p-0">
                    {displayImage && (
                        <div className="flex flex-column gap-1 flex-shrink-0" style={{ maxWidth: '120px' }}>
                            <img
                                src={displayImage.url}
                                alt={data.alt_name || data.name}
                                title={[displayImage.credit?.replace(/<[^>]+>/g, ''), displayImage.license].filter(Boolean).join(' · ')}
                                style={{ maxHeight: '160px', width: '100%', objectFit: 'cover', borderRadius: '4px' }}
                            />
                            {displayImage.descriptionUrl && (
                                <a
                                    href={displayImage.descriptionUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-500 flex align-items-center gap-1 no-underline hover:text-primary"
                                >
                                    <i className="pi pi-image" style={{ fontSize: '0.75rem' }} />
                                    Wikimedia
                                </a>
                            )}
                        </div>
                    )}
                    <div className="flex flex-column gap-2">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl uppercase m-0">
                            {data.alt_name || data.name}
                        </h1>
                        {data.fullname && (
                            <div className="text-lg sm:text-xl text-600">({data.fullname})</div>
                        )}
                        <div className="flex flex-wrap gap-3">
                            {data.nationality && (
                                <span className="flex align-items-center gap-1">
                                    {getCountryCode(data.nationality.name) !== "UNKNOWN" ? (
                                        <img
                                            src={`https://hatscripts.github.io/circle-flags/flags/${getCountryCode(data.nationality.name).toLowerCase()}.svg`}
                                            width="24"
                                            height="24"
                                            alt={data.nationality.name}
                                            className="border-circle"
                                        />
                                    ) : (
                                        <i className="pi pi-globe text-600" style={{ fontSize: '1.25rem' }} />
                                    )}
                                    {data.nationality.name}
                                </span>
                            )}
                            {(data.dob || data.dod) && (
                                <span className="flex align-items-center gap-1">
                                    <i className="pi pi-calendar" />
                                    {data.dob ? data.dob : (data.dod ? '?' : '')}{data.dob && !data.dod && data.dob < new Date().getFullYear() - 100 ? <sup>*</sup> : ''}{data.dod ? '–' : ''}{data.dod || ''}
                                </span>
                            )}
                        </div>
                        {data.dob && !data.dod && data.dob < new Date().getFullYear() - 100 && (
                            <div className="text-sm text-500 font-italic">*Tietoa kuolinvuodesta ei ole</div>
                        )}
                    </div>
                </div>

                {/* Aliases and real names */}
                {
                    ((data.aliases && data.aliases.length > 0) || data.other_names) && (
                        <div className="grid col-12 mt-3 gap-2 text-600">
                            <span className="mr-2">Myös:</span>
                            <span>
                                {(data.aliases || []).map((alias, i) => (
                                    <span key={alias.id}>
                                        {i > 0 && ', '}
                                        <Link to={`/people/${alias.id}`} className="author-link">
                                            {alias.alt_name || alias.name}
                                        </Link>
                                    </span>
                                ))}
                                {data.other_names && (
                                    <span>{data.aliases && data.aliases.length > 0 ? ', ' : ''}{data.other_names}</span>
                                )}
                            </span>
                        </div>
                    )
                }
                {
                    data.real_names && data.real_names.length > 0 && (
                        <div className="grid col-12 mt-1 gap-2 text-600">
                            <span className="mr-2">Oikea henkilö:</span>
                            <span>
                                {data.real_names.map((rn, i) => (
                                    <span key={rn.id}>
                                        {i > 0 && ', '}
                                        <Link to={`/people/${rn.id}`} className="author-link">
                                            {rn.alt_name || rn.name}
                                        </Link>
                                    </span>
                                ))}
                            </span>
                        </div>
                    )
                }
                {
                    data.bio && (
                        <div className="grid col-12 pl-2 pb-0 mb-0 p-0">
                            <div dangerouslySetInnerHTML={{ __html: data.bio }} />
                            {data.bio_src && (
                                <div className="book-attribution mt-0 col-12 text-right justify-content-end"
                                    dangerouslySetInnerHTML={{ __html: data.bio_src }} />
                            )}
                        </div>
                    )
                }
            </div >
        </>
    )
}