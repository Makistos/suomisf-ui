import React, { useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Stepper, StepperRefAttributes } from "primereact/stepper";
import { StepperPanel } from "primereact/stepperpanel";
import { MultiSelect } from "primereact/multiselect";
import { SelectButton } from "primereact/selectbutton";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import { Chip } from "primereact/chip";

import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { useDocumentTitle } from "../../../components/document-title";
import { getGenreIcon } from "../../genre/utils/genre-icons";
import { Genre } from "../../genre";
import { Country } from "../../../types/country";
import { User } from "../../user";
import { Work } from "../../work/types";

// TagType ids in the database (select * from tagtype).
const TAG_TYPE = {
    AIHE: 1,      // subject / theme
    ALAGENRE: 2,  // subgenre
    TYYLI: 3,     // style
    TOIMIJA: 4,   // actor / character
    PAIKKA: 5,    // location
    AIKA: 6,      // story-setting era
    LISTA: 7,     // list
};

const SUGGESTION_COUNT = 10;

interface TagOption {
    id: number;
    name: string;
    type: { id: number; name: string };
    workcount: number;
}

interface Filters {
    genres: number[];
    subgenres: number[];
    styles: number[];
    nationalities: number[];
    decades: number[];
    length: string | null;
    awardOnly: boolean;
    ownedOnly: boolean;
    hideRead: boolean;
    subjects: number[];
    locations: number[];
    eras: number[];
    actors: number[];
    lists: number[];
}

interface FacetSets {
    tagCounts: Map<number, number>;
    nationalities: Set<number>;
    decades: Set<number>;
    lengths: Set<string>;
}

const emptyFilters: Filters = {
    genres: [], subgenres: [], styles: [], nationalities: [], decades: [],
    length: null, awardOnly: false, ownedOnly: false, hideRead: false,
    subjects: [], locations: [], eras: [], actors: [], lists: [],
};

const lengthOptions = [
    { label: "Lyhyt (alle 200 s.)", value: "short" },
    { label: "Keskipitkä (200–500 s.)", value: "medium" },
    { label: "Pitkä (yli 500 s.)", value: "long" },
];

// Decade chips from the current decade down to the 1900s, plus a
// "before 1900" bucket (value 0, matched as pubyear < 1900 on the server).
const decadeOptions = (() => {
    const current = Math.floor(new Date().getFullYear() / 10) * 10;
    const opts = [];
    for (let d = current; d >= 1900; d -= 10) {
        opts.push({ label: `${d}-luku`, value: d });
    }
    opts.push({ label: "ennen 1900", value: 0 });
    return opts;
})();

// Build the request body for /searchworks from the accumulated filters.
const buildParams = (f: Filters, userId: number | null,
    exclude: number[] = []) => {
    const params: Record<string, any> = {
        random: true,
        count: SUGGESTION_COUNT,
    };
    if (f.genres.length) params.genre = f.genres;
    if (f.nationalities.length) params.nationality = f.nationalities;
    if (f.decades.length) params.decades = f.decades;
    if (f.length) params.length = f.length;
    if (f.awardOnly) params.award_only = true;
    if (f.ownedOnly && userId) {
        params.owned = true;
        params.user_id = userId;
    }
    if (f.hideRead && userId) {
        params.read = false;
        params.user_id = userId;
    }

    // Each facet is its own group: AND across groups, OR within a group.
    const groups: number[][] = [];
    for (const g of [f.subgenres, f.styles, f.subjects, f.locations,
        f.eras, f.actors, f.lists]) {
        if (g.length) groups.push(g);
    }
    if (groups.length) params.tag_groups = groups;
    if (exclude.length) params.exclude = exclude;
    return params;
};

export const SuggestionPage = () => {
    const user = getCurrenUser();
    const stepperRef = useRef<StepperRefAttributes>(null);
    const reqRef = useRef(0);

    const [filters, setFilters] = useState<Filters>(emptyFilters);
    const [works, setWorks] = useState<Work[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [emptyPool, setEmptyPool] = useState(false);
    // Option ids that still have matches given the committed filters, so
    // later steps only offer values that exist in the narrowed pool. Null
    // until the first query (all options shown).
    const [facets, setFacets] = useState<FacetSets | null>(null);

    const [documentTitle] = useDocumentTitle("Kirjaehdotukset");
    if (documentTitle !== undefined) document.title = documentTitle;

    async function getOptions<T>(endpoint: string): Promise<T> {
        const data = await getApiContent(endpoint, user)
            .then(response => response.data)
            .catch((error) => console.log(error));
        return data;
    }

    const genres = useQuery({
        queryKey: ["genres"],
        queryFn: () => getOptions<Genre[]>("genres"),
    });
    const countries = useQuery({
        queryKey: ["countries"],
        queryFn: () => getOptions<Country[]>("countries"),
    });
    const tags = useQuery({
        queryKey: ["tagsquick"],
        queryFn: () => getOptions<TagOption[]>("tagsquick"),
    });

    const tagsOfType = (typeId: number): TagOption[] =>
        (tags.data ?? [])
            .filter(t => t.type?.id === typeId && t.workcount > 0)
            .sort((a, b) => b.workcount - a.workcount);

    // Tag options for a type, constrained to the current pool with counts
    // reflecting the narrowed selection. Already-picked values are always
    // kept so selections never vanish from their own list.
    const tagOptions = (typeId: number, selected: number[]) =>
        tagsOfType(typeId)
            .filter(t => !facets || facets.tagCounts.has(t.id)
                || selected.includes(t.id))
            .map(t => ({
                name: t.name,
                value: t.id,
                count: facets?.tagCounts.get(t.id) ?? t.workcount,
            }))
            .sort((a, b) => b.count - a.count)
            .map(t => ({ label: `${t.name} (${t.count})`, value: t.value }));

    // Suomi first, then alphabetical; constrained to the current pool.
    const countryOptions = (countries.data ?? [])
        .slice()
        .sort((a, b) => {
            if (a.name === "Suomi") return -1;
            if (b.name === "Suomi") return 1;
            return a.name.localeCompare(b.name, "fi");
        })
        .filter(c => !facets || facets.nationalities.has(c.id)
            || filters.nationalities.includes(c.id))
        .map(c => ({ label: c.name, value: c.id }));

    const availableDecades = decadeOptions.filter(
        d => !facets || facets.decades.has(d.value)
            || filters.decades.includes(d.value));
    const availableLengths = lengthOptions.filter(
        l => !facets || facets.lengths.has(l.value)
            || filters.length === l.value);

    // Concise summary of the current selections, shown under the stepper.
    const nameOf = (arr: { id: number; name: string }[] | undefined,
        id: number) => arr?.find(x => x.id === id)?.name ?? String(id);
    const tagName = (id: number) => nameOf(tags.data, id);
    const decadeLabel = (v: number) =>
        decadeOptions.find(d => d.value === v)?.label ?? String(v);
    const summary: { label: string; values: string[] }[] = [
        { label: "Genre", values: filters.genres.map(id => nameOf(genres.data, id)) },
        { label: "Alagenre", values: filters.subgenres.map(tagName) },
        { label: "Tyyli", values: filters.styles.map(tagName) },
        { label: "Kotimaa", values: filters.nationalities.map(id => nameOf(countries.data, id)) },
        { label: "Julkaisuaika", values: filters.decades.map(decadeLabel) },
        {
            label: "Pituus", values: filters.length
                ? [lengthOptions.find(l => l.value === filters.length)?.label
                    ?? filters.length] : [],
        },
        { label: "Aihe", values: filters.subjects.map(tagName) },
        { label: "Tapahtumapaikka", values: filters.locations.map(tagName) },
        { label: "Tapahtuma-aika", values: filters.eras.map(tagName) },
        { label: "Toimija", values: filters.actors.map(tagName) },
        { label: "Lista", values: filters.lists.map(tagName) },
        { label: "Palkitut", values: filters.awardOnly ? ["kyllä"] : [] },
        { label: "Vain omat", values: filters.ownedOnly ? ["kyllä"] : [] },
        { label: "Piilota luetut", values: filters.hideRead ? ["kyllä"] : [] },
    ].filter(g => g.values.length > 0);

    const apiUrl = import.meta.env.VITE_API_URL + "searchworks";
    const userId = user?.id ?? null;

    // decadeSource lets the decade options be computed from a facet query
    // that ignores the decade selection itself, so several decades stay
    // selectable (a work belongs to exactly one decade).
    const setFacetsFromData = (fd: any, decadeSource: any = fd) => {
        setFacets({
            tagCounts: new Map<number, number>(
                Object.entries(fd?.tags ?? {})
                    .map(([k, v]) => [Number(k), v as number])),
            nationalities: new Set<number>(fd?.nationalities ?? []),
            decades: new Set<number>(decadeSource?.decades ?? []),
            lengths: new Set<string>(fd?.lengths ?? []),
        });
    };

    // Fetch a fresh random 10 matching the given filters, plus the facets
    // (available options) so both the suggestions and the later steps reflect
    // the current selection. A sequence guard makes the latest request win so
    // rapid selection changes don't clobber each other with stale responses.
    const refresh = async (f: Filters, exclude: number[] = []) => {
        const reqId = ++reqRef.current;
        setLoading(true);
        setEmptyPool(false);
        try {
            const [worksResp, facetsResp, decadeFacetResp] = await Promise.all([
                axios.post(apiUrl, buildParams(f, userId, exclude)),
                axios.post(apiUrl, { ...buildParams(f, userId), facets: true }),
                axios.post(apiUrl, {
                    ...buildParams({ ...f, decades: [] }, userId),
                    facets: true,
                }),
            ]);
            if (reqId !== reqRef.current) return; // a newer request superseded
            const result: Work[] = worksResp.data ?? [];
            if (result.length === 0) {
                // Empty-pool guard: keep the previous suggestions.
                setEmptyPool(true);
            } else {
                setWorks(result);
            }
            setFacetsFromData(facetsResp.data, decadeFacetResp.data);
        } catch (e) {
            console.error(e);
        } finally {
            if (reqId === reqRef.current) setLoading(false);
        }
    };

    // Update a selection and immediately refresh the suggestions and options
    // so they fit what the user has chosen on the current step.
    const updateFilter = (partial: Partial<Filters>) => {
        const merged = { ...filters, ...partial };
        setFilters(merged);
        refresh(merged);
    };

    // Merge a partial selection, store it and re-query, then advance.
    const applyAndNext = (partial: Partial<Filters>) => {
        const merged = { ...filters, ...partial };
        setFilters(merged);
        refresh(merged);
        stepperRef.current?.nextCallback();
    };

    const shuffle = () => {
        const exclude = (works ?? []).map(w => w.id);
        refresh(filters, exclude);
    };

    const startOver = () => {
        setFilters(emptyFilters);
        setWorks(null);
        setEmptyPool(false);
        setFacets(null);
        stepperRef.current?.setActiveStep(0);
    };

    // Reusable per-step navigation footer.
    const StepNav = ({ onNext, showBack = true }:
        { onNext: () => void; showBack?: boolean }) => (
        <div className="flex flex-wrap justify-content-between gap-2 mt-4">
            <div>
                {showBack && (
                    <Button label="Takaisin" severity="secondary" text
                        icon="pi pi-arrow-left"
                        onClick={() => stepperRef.current?.prevCallback()} />
                )}
            </div>
            <div className="flex gap-2">
                <Button label="Ohita" severity="secondary" outlined
                    onClick={onNext} />
                <Button label="Seuraava" icon="pi pi-arrow-right"
                    iconPos="right" onClick={onNext} />
            </div>
        </div>
    );

    const optionsLoading = genres.isLoading || countries.isLoading
        || tags.isLoading;

    return (
        <div className="grid w-full" style={{ minWidth: 0 }}>
            <div className="col-12 flex flex-wrap justify-content-between
                align-items-start gap-3">
                <div className="flex-1" style={{ minWidth: "15rem" }}>
                    <h1 className="mb-1">Kirjaehdotukset</h1>
                    <p className="text-color-secondary mt-0 mb-4">
                        Valitse mieltymyksesi vaihe vaiheelta. Voit valita
                        useita vaihtoehtoja tai ohittaa vaiheen. Ehdotukset
                        päivittyvät jokaisen vaiheen jälkeen.
                    </p>
                </div>
                <Button label="Aloita alusta" icon="pi pi-replay"
                    severity="secondary" outlined onClick={startOver}
                    className="flex-shrink-0" />
            </div>

            {optionsLoading ? (
                <div className="col-12 flex justify-content-center">
                    <ProgressSpinner />
                </div>
            ) : (
                <div className="col-12" style={{ overflowX: "auto", minWidth: 0 }}>
                    <Stepper ref={stepperRef}>
                        <StepperPanel header="Genre">
                            <p className="text-color-secondary">
                                Mistä genrestä olet kiinnostunut?
                            </p>
                            <MultiSelect
                                value={filters.genres}
                                options={(genres.data ?? []).map(g => ({
                                    label: g.name, value: g.id,
                                }))}
                                onChange={(e) => updateFilter({
                                    genres: e.value,
                                })}
                                display="chip"
                                placeholder="Valitse genret"
                                filter
                                className="w-full" />
                            {user && (
                                <div className="field flex align-items-center gap-2 mt-3">
                                    <InputSwitch
                                        checked={filters.ownedOnly}
                                        onChange={(e) => updateFilter({
                                            ownedOnly: e.value,
                                        })} />
                                    <label>Vain omistamani teokset</label>
                                </div>
                            )}
                            {user && (
                                <div className="field flex align-items-center gap-2 mt-2">
                                    <InputSwitch
                                        checked={filters.hideRead}
                                        onChange={(e) => updateFilter({
                                            hideRead: e.value,
                                        })} />
                                    <label>Piilota jo lukemani teokset</label>
                                </div>
                            )}
                            <StepNav showBack={false}
                                onNext={() => applyAndNext({
                                    genres: filters.genres,
                                })} />
                        </StepperPanel>

                        <StepperPanel header="Alagenre & tyyli">
                            <div className="field">
                                <label className="block mb-2">Alagenre</label>
                                <MultiSelect
                                    value={filters.subgenres}
                                    options={tagOptions(TAG_TYPE.ALAGENRE,
                                        filters.subgenres)}
                                    onChange={(e) => updateFilter({
                                        subgenres: e.value,
                                    })}
                                    display="chip" filter
                                    placeholder="Valitse alagenret"
                                    className="w-full" />
                            </div>
                            <div className="field mt-3">
                                <label className="block mb-2">Tyyli</label>
                                <MultiSelect
                                    value={filters.styles}
                                    options={tagOptions(TAG_TYPE.TYYLI,
                                        filters.styles)}
                                    onChange={(e) => updateFilter({
                                        styles: e.value,
                                    })}
                                    display="chip" filter
                                    placeholder="Valitse tyylit"
                                    className="w-full" />
                            </div>
                            <StepNav onNext={() => applyAndNext({
                                subgenres: filters.subgenres,
                                styles: filters.styles,
                            })} />
                        </StepperPanel>

                        <StepperPanel header="Kirjailijan kotimaa">
                            <p className="text-color-secondary">
                                Mistä maasta kirjailija on kotoisin?
                            </p>
                            <MultiSelect
                                value={filters.nationalities}
                                options={countryOptions}
                                onChange={(e) => updateFilter({
                                    nationalities: e.value,
                                })}
                                display="chip" filter
                                placeholder="Valitse maat"
                                className="w-full" />
                            <StepNav onNext={() => applyAndNext({
                                nationalities: filters.nationalities,
                            })} />
                        </StepperPanel>

                        <StepperPanel header="Alkuperäinen julkaisuaika">
                            <p className="text-color-secondary">
                                Miltä vuosikymmeneltä teos on alun perin
                                (alkuperäinen ilmestymisvuosi, ei suomennoksen)?
                            </p>
                            <SelectButton
                                multiple
                                value={filters.decades}
                                options={availableDecades}
                                onChange={(e) => updateFilter({
                                    decades: e.value ?? [],
                                })} />
                            <StepNav onNext={() => applyAndNext({
                                decades: filters.decades,
                            })} />
                        </StepperPanel>

                        <StepperPanel header="Pituus">
                            <p className="text-color-secondary">
                                Kuinka pitkän kirjan haluat?
                            </p>
                            <SelectButton
                                value={filters.length}
                                options={availableLengths}
                                onChange={(e) => updateFilter({
                                    length: e.value,
                                })} />
                            <StepNav onNext={() => applyAndNext({
                                length: filters.length,
                            })} />
                        </StepperPanel>

                        <StepperPanel header="Tarkennukset">
                            <div className="field flex align-items-center gap-2">
                                <InputSwitch
                                    checked={filters.awardOnly}
                                    onChange={(e) => updateFilter({
                                        awardOnly: e.value,
                                    })} />
                                <label>Vain palkitut teokset</label>
                            </div>
                            {([
                                ["Aihe", TAG_TYPE.AIHE, "subjects"],
                                ["Tapahtumapaikka", TAG_TYPE.PAIKKA, "locations"],
                                ["Tapahtuma-aika", TAG_TYPE.AIKA, "eras"],
                                ["Toimija", TAG_TYPE.TOIMIJA, "actors"],
                                ["Lista", TAG_TYPE.LISTA, "lists"],
                            ] as [string, number, keyof Filters][])
                                .map(([label, typeId, key]) => (
                                    <div className="field mt-3" key={key}>
                                        <label className="block mb-2">
                                            {label}
                                        </label>
                                        <MultiSelect
                                            value={filters[key] as number[]}
                                            options={tagOptions(typeId,
                                                filters[key] as number[])}
                                            onChange={(e) => updateFilter({
                                                [key]: e.value,
                                            })}
                                            display="chip" filter
                                            placeholder={`Valitse: ${label}`}
                                            className="w-full" />
                                    </div>
                                ))}
                            <div className="flex justify-content-between mt-4">
                                <Button label="Takaisin" severity="secondary"
                                    text icon="pi pi-arrow-left"
                                    onClick={() =>
                                        stepperRef.current?.prevCallback()} />
                                <Button label="Näytä ehdotukset"
                                    icon="pi pi-check" iconPos="right"
                                    onClick={() => refresh(filters)} />
                            </div>
                        </StepperPanel>
                    </Stepper>
                </div>
            )}

            {summary.length > 0 && (
                <div className="col-12">
                    <div className="flex flex-wrap align-items-center gap-3
                        p-3 surface-100 border-round">
                        <span className="font-semibold">Valinnat:</span>
                        {summary.map(g => (
                            <div key={g.label}
                                className="flex align-items-center gap-2 flex-wrap">
                                <span className="text-color-secondary text-sm">
                                    {g.label}
                                </span>
                                {g.values.map((v, i) => (
                                    <Chip key={i} label={v} />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="col-12">
                <div className="flex flex-wrap align-items-center
                    justify-content-between gap-2 mb-3">
                    <h2 className="m-0">Ehdotukset</h2>
                    {works && works.length > 0 && (
                        <Button label="Sekoita" icon="pi pi-refresh"
                            outlined onClick={shuffle} />
                    )}
                </div>

                {emptyPool && (
                    <Message severity="warn" className="mb-3 w-full"
                        text={"Näillä valinnoilla ei löytynyt teoksia. "
                            + "Näytetään edelliset ehdotukset — löysää jotain "
                            + "valintaa saadaksesi uusia."} />
                )}

                {loading ? (
                    <div className="flex justify-content-center">
                        <ProgressSpinner />
                    </div>
                ) : works === null ? (
                    <p className="text-color-secondary">
                        Aloita rajaamalla teoksia - ehdotukset ilmestyvät tähän.
                    </p>
                ) : (
                    <div className="grid">
                        {works.map(work => (
                            <SuggestionCard key={work.id} work={work} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const SuggestionCard = ({ work }: { work: Work }) => {
    const cover = work.editions?.[0]?.images?.[0]?.image_src;
    const genreIcons = (work.genres ?? []) as Genre[];
    return (
        <div className="col-12 sm:col-6 lg:col-4 xl:col-3">
            <a href={`/works/${work.id}`} target="_blank" rel="noreferrer"
                className="flex flex-column h-full p-3 border-round surface-card
                    shadow-1 hover:shadow-3 transition-duration-200 no-underline
                    text-color">
                <div className="flex justify-content-center mb-3"
                    style={{ minHeight: "8rem" }}>
                    {cover ? (
                        <img src={import.meta.env.VITE_IMAGE_URL + cover}
                            alt={work.title}
                            style={{ maxHeight: "12rem", maxWidth: "100%" }} />
                    ) : (
                        <i className="pi pi-book text-6xl
                            text-color-secondary flex align-items-center" />
                    )}
                </div>
                <div className="mt-auto">
                    <div className="font-bold">
                        {work.title}
                        {work.pubyear ? ` (${work.pubyear})` : ""}
                    </div>
                    <div className="text-color-secondary text-sm">
                        {work.author_str}
                    </div>
                    <div className="flex align-items-center gap-2 mt-2 flex-wrap">
                        {work.has_awards && (
                            <svg viewBox="0 0 24 24" width="1rem"
                                height="1rem" fill="#d4a017" role="img"
                                aria-label="Palkittu teos">
                                <title>Palkittu teos</title>
                                <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0
                                    2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63
                                    3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33
                                    2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21
                                    8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5
                                    9.3 5 8zm14 0c0 1.3-.84 2.4-2
                                    2.82V7h2v1z" />
                            </svg>
                        )}
                        {genreIcons.map(g => (
                            <i key={g.id} className={getGenreIcon(g.name)}
                                title={g.name} />
                        ))}
                    </div>
                </div>
            </a>
        </div>
    );
};
