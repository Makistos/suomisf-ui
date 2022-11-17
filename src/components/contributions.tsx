import React, { useEffect, useState } from "react";

import { Fieldset } from "primereact/fieldset";
import { TabView, TabPanel } from "primereact/tabview";
import _ from "lodash";

import { Person } from "../features/person/types";
import { WorkList } from "../features/work";
import { EditionList } from "../features/edition";
import { BookSeriesList } from "../features/bookseries";
import { Work } from "../features/work";
import { IGenre } from "../features/genre/types";
import { Edition } from "../features/edition";

interface CBCProps {
    person: Person,
    viewNonSf: boolean,
    collaborationsLast?: boolean
}

export const ContributorBookControl = ({ person, viewNonSf, collaborationsLast = false }: CBCProps) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [works, setWorks]: [Work[], (sfWorks: Work[]) => void]
        = useState<Work[]>([]);
    const [edits, setEdits]: [Edition[], (sfEdits: Edition[]) => void] = useState<Edition[]>([]);
    const [translations, setTranslations]: [Edition[], (sfTranslations: Edition[]) => void]
        = useState<Edition[]>([]);

    /**
     * Given list of genres, determines if they match a non-SF list.
     *
     * non-SF is defined as having no other genres than "nonSF" and "compilation".
     * Empty genre list is defined as being SF as there are quite a few items
     * that lack genre definitions - and this is an SF database so we assume
     * items are SF.
     *
     * @param genres List of genres.
     * @returns True - is non-SF, false - is SF.
     */
    const isNonSf = (genres: IGenre[]) => {
        let retval;
        retval = (genres.length === 0 || genres.filter(genre =>
            (genre.abbr !== 'kok') && (genre.abbr !== 'eiSF')).length > 0) ? false : true;
        return retval;
    }

    /**
     * Determines which of the three book tabs should be set active.
     *
     * If there are items in works, then this tab is selected. Else if
     * edits has items then that tab is selected. And finally if neither have items
     * but translations does it is selected. Default is always first tab.
     *
     * @param works - Books written by person.
     * @param edits - Books edited by person.
     * @param translations - Books translated by person.
     * @returns Tab number (0-2)
     */
    const calcActiveIndex = (works: Work[], edits: Edition[], translations: Edition[]) => {
        if (works.length > 0) return 0;
        if (edits.length > 0) return 1;
        if (translations.length > 0) return 2;
        return 0;

    }

    const removeDuplicateWorks = (editions: Edition[]) => {
        /**
         * Remove duplicate work entries from list. This will prevent the same
         * work being repeated in the edition list for each edition.
         */

        /* First make sure oldest edition is first in the array by sorting by
           year. Then pick unique work ids. */

        let retval: Edition[] = _.sortBy(editions, [function (e) { return e.pubyear }]);
        retval = _.uniqBy(retval, (value => value.work[0].id));
        return retval;
    }

    useEffect(() => {
        let newWorks: Work[] = [];
        let newEdits: Edition[] = [];
        let newTranslations: Edition[] = [];

        if (viewNonSf) {
            newWorks = person.works.filter(work => isNonSf(work.genres));
            newEdits = person.edits.filter(edition =>
                isNonSf(edition.work.map(work => work.genres).flat()));
            newTranslations = person.translations.filter(edition =>
                isNonSf(edition.work.map(work => work.genres).flat()));
        } else {
            newWorks = person.works.filter(work => !isNonSf(work.genres));
            newEdits = person.edits.filter(edition =>
                !isNonSf(edition.work.map(work => work.genres).flat()));
            newTranslations = person.translations.filter(edition =>
                !isNonSf(edition.work.map(work => work.genres).flat()));
        }
        newTranslations = removeDuplicateWorks(newTranslations);
        newEdits = removeDuplicateWorks(newEdits);
        setWorks(newWorks);
        setEdits(newEdits);
        setTranslations(newTranslations);
        const initialIndex = calcActiveIndex(newWorks, newEdits, newTranslations);
        setActiveIndex(initialIndex);
    }, [person.works, person.edits, person.translations, viewNonSf]);

    const headerText = (staticText: string, count: number) => {
        return staticText + " (" + count + ")";
    }

    const hasWorks = () => {
        return (works.length > 0);
    }

    const hasSeries = () => {
        const retval = works.some(work => work.bookseries !== null)
        return retval;
    }

    /**
     *
     * @param type If "edits" check edits variable, otherwise check translations.
     * @returns
     */
    const hasEditions = (type: string) => {
        if (type === "edits")
            return (edits.length > 0);
        return translations.length > 0;
    }

    return (
        <Fieldset legend={"Kirjat"} toggleable>
            <TabView key={viewNonSf ? "nonSF" : "SF"} activeIndex={activeIndex}
                onTabChange={(e) => setActiveIndex(e.index)} className="w-full"
            >
                <TabPanel key="Kirjoittanut" header={headerText("Kirjoittanut", works.length)}
                    disabled={!hasWorks()}
                >
                    <WorkList works={works} personName={person.name}
                        collaborationsLast={collaborationsLast} />
                </TabPanel>
                <TabPanel key="Toimittanut" header={headerText("Toimittanut", edits.length)}
                    disabled={!hasEditions("edits")}
                >
                    <EditionList editions={edits} person={person} />
                </TabPanel>
                <TabPanel key="Kääntänyt" header={headerText("Kääntänyt", translations.length)}
                    disabled={!hasEditions("translations")}
                >
                    <EditionList editions={translations} person={person} />
                </TabPanel>
                {viewNonSf === false &&
                    <TabPanel key="Sarjat" header="Sarjat" disabled={!hasSeries()}>
                        <BookSeriesList works={person.works} seriesType='bookseries' />
                    </TabPanel>
                }
            </TabView>
        </Fieldset>
    )
}