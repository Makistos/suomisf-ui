// Counts, roles and groupings for a person's page, worked out from the person's
// own contributions (agreed rule "Counts and roles", docs/ui-redesign/principles.md):
// only contributions under any name the person used (their record and its pen
// names), in a production role. "Esiintyy" (appears in, or is the subject of)
// never counts as output and never gives a role; those items are listed apart.
import type { Person } from "../types";
import type { Work } from "../../work";
import type { Edition } from "../../edition";
import type { Short } from "../../short";
import type { Awarded } from "../../award";
import type { Genre } from "../../genre";
import type { Issue } from "../../issue";
import { listIsSf } from "../../genre/utils/list-is-sf";
import { ContributionType, type Contribution } from "../../../types/contribution";

export const PRODUCTION_ROLES = [
    ContributionType.Kirjoittaja, ContributionType.Kääntäjä, ContributionType.Toimittaja,
    ContributionType.Kansikuva, ContributionType.Kuvittaja,
];
/** Work types under Teokset, as on the live page (comics, type 3, are not listed there). */
export const FICTION_TYPES = [1, 2, 5, 6];
export const NONFICTION_TYPES = [4];
/** Work types under Muu tuotanto (non-SF books), as on the live page. */
export const OTHER_TYPES = [1, 2, 3, 5, 6];

/** The person's own record and the pen names they used. */
export const ownIds = (person: Person): Set<number> =>
    new Set([person.id, ...(person.aliases ?? []).map(a => a.id)]);

export const hasRole = (contribs: Contribution[] | undefined, ids: Set<number>, roles: number[]): boolean =>
    (contribs ?? []).some(c => ids.has(c.person.id) && roles.includes(c.role.id));

/** A book is non-SF when it has genres and they are all "Ei SpeFiä" or "Kokoelma" (as the live book lists decide). */
export const isNonSfWork = (genres: Genre[] | undefined): boolean =>
    !!genres && genres.length > 0 && genres.every(g => g.abbr === "kok" || g.abbr === "eiSF");

/** A story is non-SF by the live story lists' rule (`listIsSf`). */
export const isNonSfStory = (genres: Genre[] | undefined): boolean => !listIsSf(genres ?? []);

const ROLE_ORDER = ["Kirjailija", "Tietokirjailija", "Kirjoittaja", "Kääntäjä", "Toimittaja", "Novellisti",
    "Runoilija", "Kansitaiteilija", "Kuvittaja", "Päätoimittaja"];

/**
 * The person's roles, from their own contributions only. Fixes the live page,
 * which gave "Tietokirjailija" (and "Kirjailija") for any linked book of that
 * kind, also one the person only appears in.
 */
export const derivePersonRoles = (person: Person, issues: Issue[]): string[] => {
    const ids = ownIds(person);
    const written = (person.works ?? []).filter(w => hasRole(w.contributions, ids, [ContributionType.Kirjoittaja]));
    const writtenStories = (person.stories ?? []).filter(s => hasRole(s.contributors, ids, [ContributionType.Kirjoittaja]));
    const storyOfType = (types: number[]) => writtenStories.some(s => s.type && types.includes(s.type.id));
    const editions = person.editions ?? [];
    const editionRole = (role: number) => editions.some(e => hasRole(e.contributions, ids, [role]));

    const roles: string[] = [];
    if (written.some(w => FICTION_TYPES.includes(w.work_type?.id))) roles.push("Kirjailija");
    if (written.some(w => NONFICTION_TYPES.includes(w.work_type?.id))) roles.push("Tietokirjailija");
    if (storyOfType([1, 2, 3, 5])) roles.push("Novellisti");
    if (storyOfType([4, 6])) roles.push("Runoilija");
    if (storyOfType([7, 8, 9])) roles.push("Kirjoittaja");
    if (editionRole(ContributionType.Kääntäjä)
        || (person.stories ?? []).some(s => hasRole(s.contributors, ids, [ContributionType.Kääntäjä])))
        roles.push("Kääntäjä");
    if ((person.edits ?? []).length > 0) roles.push("Toimittaja");
    if (editionRole(ContributionType.Kansikuva)) roles.push("Kansitaiteilija");
    if (editionRole(ContributionType.Kuvittaja)) roles.push("Kuvittaja");
    if (issues.some(i => hasRole(i.contributors, ids, [ContributionType.Päätoimittaja]))) roles.push("Päätoimittaja");
    return roles.sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b));
};

/** The year an article or story is listed under: its own, else its first magazine issue's. */
export const storyYear = (s: Short): number | null =>
    Number(s.pubyear) || s.issues?.find(i => i.year)?.year || null;

/** Books and articles the person appears in or that are about them, and nothing else. */
export const aboutItems = (person: Person): { books: Work[]; articles: Short[] } => {
    const ids = ownIds(person);
    const about = (contribs: Contribution[] | undefined) =>
        hasRole(contribs, ids, [ContributionType.Esiintyy]) && !hasRole(contribs, ids, PRODUCTION_ROLES);
    return {
        books: (person.works ?? []).filter(w => about(w.contributions))
            .sort((a, b) => (a.pubyear ?? 0) - (b.pubyear ?? 0) || a.title.localeCompare(b.title, "fi")),
        articles: (person.stories ?? []).filter(s => about(s.contributors))
            .sort((a, b) => (storyYear(a) ?? 0) - (storyYear(b) ?? 0) || a.title.localeCompare(b.title, "fi")),
    };
};

/** Every book printing the person has a production role in, each once. */
export const ownEditions = (person: Person): Edition[] => {
    const ids = ownIds(person);
    const seen = new Map<number, Edition>();
    for (const w of person.works ?? []) {
        if (hasRole(w.contributions, ids, PRODUCTION_ROLES))
            for (const e of w.editions ?? []) seen.set(e.id, e);
    }
    for (const e of person.editions ?? []) {
        if (hasRole(e.contributions, ids, PRODUCTION_ROLES)) seen.set(e.id, e);
    }
    for (const e of person.edits ?? []) seen.set(e.id, e);
    return [...seen.values()];
};

export const isFirstPrinting = (e: Edition) => (e.editionnum ?? 1) === 1 && (e.version ?? 1) === 1;

export type YearCount = { all: number; first: number };

/** Printings per year for the timeline: all, and first printings of a work. */
export const editionsByYear = (person: Person): Record<number, YearCount> => {
    const by: Record<number, YearCount> = {};
    for (const e of ownEditions(person)) {
        const year = Number(e.pubyear);
        if (!year) continue;
        const y = (by[year] ??= { all: 0, first: 0 });
        y.all++;
        if (isFirstPrinting(e)) y.first++;
    }
    return by;
};

export type YearBin = { from: number; to: number; all: number; first: number };

/**
 * Bars for the timeline: one a year when each bar gets at least 6 px, else 2,
 * 5 or 10 years a bar. `step` spaces the axis labels at least 44 px apart.
 */
export const binYears = (byYear: Record<number, YearCount>, width: number) => {
    const years = Object.keys(byYear).map(Number).filter(Boolean);
    if (years.length === 0) return { bin: 1, bins: [] as YearBin[], max: 0, step: 10 };
    const y0 = Math.min(...years), y1 = Math.max(...years);
    const bin = [1, 2, 5, 10].find(b => Math.ceil((y1 - y0 + 1) / b) * 6 <= width) ?? 10;
    const bins: YearBin[] = [];
    for (let from = Math.floor(y0 / bin) * bin; from <= y1; from += bin) {
        const to = Math.min(from + bin - 1, y1);
        let all = 0, first = 0;
        for (let y = from; y <= to; y++) {
            all += byYear[y]?.all ?? 0;
            first += byYear[y]?.first ?? 0;
        }
        bins.push({ from, to, all, first });
    }
    const max = Math.max(...bins.map(b => b.all));
    const step = [10, 20, 25, 50, 100].find(s => (s / bin) * (width / bins.length) >= 44) ?? 100;
    return { bin, bins, max, step };
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Distinct works of the editions where the person has the given role. */
const editionWorks = (person: Person, role: number): Work[] => {
    const ids = ownIds(person);
    const works = new Map<number, Work>();
    for (const e of person.editions ?? []) {
        if (e.work && hasRole(e.contributions, ids, [role])) works.set(e.work.id, e.work);
    }
    return [...works.values()];
};

const editedWorks = (person: Person): Work[] => {
    const works = new Map<number, Work>();
    for (const e of person.edits ?? []) if (e.work) works.set(e.work.id, e.work);
    return [...works.values()];
};

/** Stories and articles in a production role. */
export const ownStories = (person: Person): Short[] => {
    const ids = ownIds(person);
    return (person.stories ?? []).filter(s => hasRole(s.contributors, ids, PRODUCTION_ROLES));
};

/** The record's "Tuotanto" line: "30 kirjaa, 39 painosta, 80 novellia ja artikkelia, 35 palkintoa". */
export const outputSummary = (person: Person, awards: Awarded[]): string => {
    const ids = ownIds(person);
    const own = (person.works ?? []).filter(w => hasRole(w.contributions, ids, [ContributionType.Kirjoittaja])).length;
    const translated = editionWorks(person, ContributionType.Kääntäjä).length;
    const edited = editedWorks(person).length;
    const covers = editionWorks(person, ContributionType.Kansikuva).length;
    const illustrated = editionWorks(person, ContributionType.Kuvittaja).length;
    const printings = ownEditions(person).length;
    const stories = ownStories(person).length;
    const others = translated + edited + covers + illustrated > 0;
    const parts = [
        own && (others ? plural(own, "oma kirja", "omaa kirjaa") : plural(own, "kirja", "kirjaa")),
        translated && plural(translated, "suomennos", "suomennosta"),
        edited && plural(edited, "toimitettu kirja", "toimitettua kirjaa"),
        covers && plural(covers, "kansikuva", "kansikuvaa"),
        illustrated && plural(illustrated, "kuvitus", "kuvitusta"),
        printings && plural(printings, "painos", "painosta"),
        stories && (stories === 1 ? "1 novelli tai artikkeli" : `${stories} novellia ja artikkelia`),
        awards.length && plural(awards.length, "palkinto", "palkintoa"),
    ];
    return parts.filter(Boolean).join(", ");
};

export type RoleKey = "kirjoittaja" | "toimittaja" | "kaantaja" | "kansikuva" | "kuvittaja";
export const ROLE_TABS: { key: RoleKey; label: string; role: number }[] = [
    { key: "kirjoittaja", label: "Kirjoittanut", role: ContributionType.Kirjoittaja },
    { key: "toimittaja", label: "Toimittanut", role: ContributionType.Toimittaja },
    { key: "kaantaja", label: "Kääntänyt", role: ContributionType.Kääntäjä },
    { key: "kansikuva", label: "Kansikuva", role: ContributionType.Kansikuva },
    { key: "kuvittaja", label: "Kuvittanut", role: ContributionType.Kuvittaja },
];

/** A book in one of the person's roles, with the printings that role covers. */
export type BookEntry = { work: Work; editions: Edition[]; role: RoleKey; asName?: string; asId?: number; credit?: Credit };

/**
 * The person's books by role, for one group of work types and SF / non-SF:
 * written (all printings), edited, translated, cover and illustration
 * (the printings the person worked on). Each work once per role.
 */
/** Who a book or story is credited to: the person, one of their pen names, or either with co-authors. */
export type Credit = {
    /** The credited writers' ids, sorted: "2370", "7502", "2370-5521". */
    key: string;
    /** "Anne Leinonen", "Impi Kure", "Anne Leinonen & Eija Lappalainen" */
    label: string;
    /** Own name 0, pen name 1, with co-authors 2: the old page's order (own name first, collaborations last). */
    rank: 0 | 1 | 2;
    penName?: string;
    coAuthors: { id: number; name: string }[];
};
export type CreditFacet = { key: string; label: string; count: number };

const personName = (p: { name: string; alt_name?: string }) =>
    p.alt_name || (p.name.includes(", ") ? p.name.split(", ").reverse().join(" ") : p.name);

export const writerCredit = (contributions: Contribution[] | undefined, person: Person): Credit => {
    const ids = ownIds(person);
    const writers = [...new Map((contributions ?? []).filter(c => c.role.id === ContributionType.Kirjoittaja).map(c => [c.person.id, c])).values()];
    const mine = writers.filter(c => ids.has(c.person.id));
    const others = writers.filter(c => !ids.has(c.person.id));
    // Credited under the person's own name too: the own name wins over a pen name.
    const pen = mine.length > 0 && !mine.some(c => c.person.id === person.id) ? mine[0].person : null;
    const alias = pen && (person.aliases ?? []).find(a => a.id === pen.id);
    const self = pen ? personName(alias ?? pen) : personName(person);
    const coAuthors = others.map(c => ({ id: c.person.id, name: personName(c.person) }));
    return {
        key: [pen ? pen.id : person.id, ...coAuthors.map(c => c.id)].sort((a, b) => a - b).join("-"),
        label: [self, ...coAuthors.map(c => c.name)].join(" & "),
        rank: coAuthors.length > 0 ? 2 : pen ? 1 : 0,
        ...(pen ? { penName: self } : {}),
        coAuthors,
    };
};

/** More different collaborations than this become one "Yhdessä muiden kanssa" button. */
const MAX_COLLABORATION_FACETS = 4;
export const COLLABORATIONS_KEY = "yhdessa";

/**
 * Each credit with its count, own name first, then pen names (most used first), then collaborations; null with only one.
 * Many collaborations (Anne Leinonen's stories have 15) fold into one button.
 */
export const creditFacets = (credits: Credit[]): CreditFacet[] | null => {
    const byKey = new Map<string, { credit: Credit; count: number }>();
    for (const c of credits) byKey.set(c.key, { credit: c, count: (byKey.get(c.key)?.count ?? 0) + 1 });
    if (byKey.size <= 1) return null;
    const facets = [...byKey.values()]
        .sort((a, b) => a.credit.rank - b.credit.rank
            || (a.credit.rank === 1 ? b.count - a.count : 0)
            || a.credit.label.localeCompare(b.credit.label, "fi"));
    const together = facets.filter(f => f.credit.rank === 2);
    const shown = together.length > MAX_COLLABORATION_FACETS
        ? [...facets.filter(f => f.credit.rank < 2).map(({ credit, count }) => ({ key: credit.key, label: credit.label, count })),
            { key: COLLABORATIONS_KEY, label: "Yhdessä muiden kanssa", count: together.reduce((n, f) => n + f.count, 0) }]
        : facets.map(({ credit, count }) => ({ key: credit.key, label: credit.label, count }));
    return shown;
};

/** The items under one credit; all with null. */
export const byCredit = <T extends { credit?: Credit }>(items: T[], key: string | null) =>
    key === null ? items
        : key === COLLABORATIONS_KEY ? items.filter(x => x.credit?.rank === 2)
            : items.filter(x => x.credit?.key === key);

export const booksByRole = (person: Person, types: number[], keep: (w: Work) => boolean): Record<RoleKey, BookEntry[]> => {
    const ids = ownIds(person);
    const aliasNames = new Map((person.aliases ?? []).map(a => [a.id, a.alt_name || a.name]));
    const inGroup = (w: Work | null | undefined): w is Work => !!w && types.includes(w.work_type?.id) && keep(w);
    const byWork = (entries: { work: Work; edition?: Edition }[], role: RoleKey): BookEntry[] => {
        const map = new Map<number, BookEntry>();
        for (const { work, edition } of entries) {
            const entry = map.get(work.id) ?? { work, editions: [], role };
            if (edition && !entry.editions.some(e => e.id === edition.id)) entry.editions.push(edition);
            map.set(work.id, entry);
        }
        return [...map.values()];
    };
    const fromEditions = (role: number) => (person.editions ?? [])
        .filter(e => hasRole(e.contributions, ids, [role]) && inGroup(e.work))
        .map(e => ({ work: e.work as Work, edition: e }));

    const written = (person.works ?? [])
        .filter(w => inGroup(w) && hasRole(w.contributions, ids, [ContributionType.Kirjoittaja]))
        .map(w => {
            const credited = w.contributions.filter(c => c.role.id === ContributionType.Kirjoittaja && ids.has(c.person.id));
            // Published only under a pen name: the row says "nimellä Richard Bachman".
            const penId = credited.every(c => c.person.id !== person.id) ? credited[0]?.person.id : undefined;
            const pen = penId !== undefined ? aliasNames.get(penId) : undefined;
            return { work: w, editions: [...(w.editions ?? [])], role: "kirjoittaja" as RoleKey, ...(pen ? { asName: pen, asId: penId } : {}),
                credit: writerCredit(w.contributions, person) };
        });
    return {
        kirjoittaja: written,
        toimittaja: byWork((person.edits ?? []).filter(e => inGroup(e.work)).map(e => ({ work: e.work as Work, edition: e })), "toimittaja"),
        kaantaja: byWork(fromEditions(ContributionType.Kääntäjä), "kaantaja"),
        kansikuva: byWork(fromEditions(ContributionType.Kansikuva), "kansikuva"),
        kuvittaja: byWork(fromEditions(ContributionType.Kuvittaja), "kuvittaja"),
    };
};

export type StoryRoleKey = "kirjoittaja" | "kaantaja" | "toimittaja";
export const storiesByRole = (person: Person, keep: (s: Short) => boolean): Record<StoryRoleKey, Short[]> => {
    const ids = ownIds(person);
    const stories = (person.stories ?? []).filter(keep);
    return {
        kirjoittaja: stories.filter(s => hasRole(s.contributors, ids, [ContributionType.Kirjoittaja])),
        toimittaja: stories.filter(s => hasRole(s.contributors, ids, [ContributionType.Toimittaja])),
        kaantaja: stories.filter(s => hasRole(s.contributors, ids, [ContributionType.Kääntäjä])),
    };
};

export type TabKey = "teokset" | "tietokirjat" | "novellit" | "sarjat" | "lehdet" | "palkinnot" | "muut" | "henkilosta";
export type PersonTab = { key: TabKey; label: string; count: number; roles?: [string, number][] };

const roleCounts = (groups: Record<string, unknown[]>, labels: { key: string; label: string }[]): [string, number][] =>
    labels.map(l => [l.label, groups[l.key]?.length ?? 0] as [string, number]).filter(([, n]) => n > 0);

const STORY_ROLE_TABS = ROLE_TABS.filter(r => ["kirjoittaja", "toimittaja", "kaantaja"].includes(r.key));

/** The page's main tabs with fixed counts, in order, only those with content. */
export const personTabs = (person: Person, awards: Awarded[], issueCount: number): PersonTab[] => {
    const ids = ownIds(person);
    const teokset = booksByRole(person, FICTION_TYPES, w => !isNonSfWork(w.genres));
    const tietokirjat = booksByRole(person, NONFICTION_TYPES, () => true);
    const muut = booksByRole(person, OTHER_TYPES, w => isNonSfWork(w.genres));
    const stories = storiesByRole(person, s => !isNonSfStory(s.genres) && hasRole(s.contributors, ids, PRODUCTION_ROLES));
    const otherStories = ownStories(person).filter(s => isNonSfStory(s.genres));
    const series = new Set((person.works ?? [])
        .filter(w => hasRole(w.contributions, ids, [ContributionType.Kirjoittaja]) && w.bookseries)
        .map(w => w.bookseries!.id));
    const about = aboutItems(person);
    const total = (g: Record<string, unknown[]>) => Object.values(g).reduce((n, list) => n + list.length, 0);
    const storyTotal = new Set(Object.values(stories).flat().map(s => s.id)).size;

    const tabs: PersonTab[] = [
        { key: "teokset", label: "Teokset", count: total(teokset), roles: roleCounts(teokset, ROLE_TABS) },
        { key: "tietokirjat", label: "Tietokirjat", count: total(tietokirjat), roles: roleCounts(tietokirjat, ROLE_TABS) },
        { key: "novellit", label: "Novellit ja artikkelit", count: storyTotal, roles: roleCounts(stories, STORY_ROLE_TABS) },
        { key: "sarjat", label: "Sarjat", count: series.size },
        { key: "lehdet", label: "Lehdet", count: issueCount },
        { key: "palkinnot", label: "Palkinnot", count: awards.length },
        { key: "muut", label: "Muu tuotanto", count: total(muut) + otherStories.length },
        { key: "henkilosta", label: "Henkilöstä", count: about.books.length + about.articles.length },
    ];
    return tabs.filter(t => t.count > 0);
};

/** Links with an address; a saved empty row would show as a bare icon going nowhere. */
export const visibleLinks = <T extends { link?: string | null }>(links: T[] | undefined): T[] =>
    (links ?? []).filter(l => !!l.link?.trim());
