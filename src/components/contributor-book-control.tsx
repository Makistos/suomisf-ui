import React, { useEffect, useState } from "react";

import { Fieldset } from "primereact/fieldset";
import { TabView, TabPanel } from "primereact/tabview";
import _ from "lodash";

import { Person } from "../features/person";
import { WorkList } from "../features/work";
import { EditionList } from "../features/edition";
import { BookSeriesList } from "../features/bookseries";
import { Work } from "../features/work";
import { Genre } from "../features/genre";
import { Edition } from "../features/edition";
import { Contribution, ContributionType } from "../types/contribution";

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
    const [covers, setCovers] = useState<Edition[]>([]);
    const [illustrations, setIllustrations] = useState<Edition[]>([]);

    // Create list that contains all alias ids as well
    const person_ids = person.aliases.map(alias => alias.id);
    person_ids.push(person.id);

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
    const isNonSf = (genres: Genre[]) => {
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
    const calcActiveIndex = (works: Work[], edits: Edition[], translations: Edition[], illustrations: Edition[], covers: Edition[]) => {
        if (works.length > 0) return 0;
        if (edits.length > 0) return 1;
        if (translations.length > 0) return 2;
        if (covers.length > 0) return 3;
        if (illustrations.length > 0) return 4;
        return 0;

    }

    const removeDuplicateWorks = (editions: Edition[]) => {
        /**
         * Remove duplicate work entries from list. This will prevent the same
         * work being repeated in the edition list for each edition.
         */

        /* First make sure oldest edition is first in the array by sorting by
           year. Then pick unique work ids. */

        let retval = _.sortBy(editions, [function (e) { return e.pubyear }]);
        retval = _.uniqBy(retval, (value => value.work[0].id));
        return retval;
    }

    /**
     * Filter contributions based on contribution types.
     *
     * @param {Contribution[]} contributions - The list of contributions to filter.
     * @param {number[]} contributionTypes - The list of contribution types to include.
     * @return {Contribution[]} The filtered list of contributions.
     */
    const contributions = (contributions: Contribution[], contributionTypes: number[]) => {
        // console.log(contributionType)
        // console.log(contributions)
        if (contributions.length === 0) return [];
        return contributions.filter(contrib => (contributionTypes.includes(contrib.role.id) && person_ids.includes(contrib.person.id)))
    }

    const edition_contributions = (editions: Edition[]) => {
        return editions.filter(edition =>
            contributions(edition.contributions, [2, 4, 5]).length > 0);
    }

    useEffect(() => {
        setWorks(person.works.filter(work => isNonSf(work.genres)));
        const editions = edition_contributions(person.editions)

        const newTr = editions.filter(edition =>
            contributions(edition.contributions, [2]).length > 0);
        setTranslations(newTr);
        setEdits(person.edits);
        const newCovers = editions.filter(edition =>
            contributions(edition.contributions, [4]).length > 0);
        setCovers(newCovers);
        const newIllustrations = editions.filter(edition =>
            contributions(edition.contributions, [5]).length > 0);
        setIllustrations(newIllustrations);
    }, [person.works, person.editions, viewNonSf]);

    useEffect(() => {
        const initialIndex = calcActiveIndex(works, edits, translations, illustrations, covers);
        setActiveIndex(initialIndex);
    }, [works, edits, translations, illustrations, covers])

    const headerText = (staticText: string, count: number) => {
        return staticText + " (" + count + ")";
    }

    const hasSeries = () => {
        const retval = works.some(work => work.bookseries !== null)
        return retval;
    }

    const onlyFirstEdition = (works: Work[]) => {
        return works.filter((work, index) => {
            return index === works.findIndex(w => work.id === w.id);
        })
    }

    const removeDuplicateWorkContributions = (work: Work) => {

        return work.contributions.filter((contrib, index) => {
            return index === work.contributions.findIndex(
                c => (c.person.id === contrib.person.id && c.role.id === contrib.role.id))
        })
    }

    const removeDuplicateEditionContributions = (edition: Edition) => {
        if (!edition) return [];
        // console.log(edition)
        const retval = edition.contributions.filter((contrib, index) => {
            return index === edition.contributions.findIndex(
                c => (c.person.id === contrib.person.id && c.role.id === contrib.role.id))
        })
        // console.log(retval)
        return retval
    }

    // Find contributions for different types
    const authorContributions =
        contributions(works.map(work =>
            removeDuplicateWorkContributions(work)).flat(1), [1]).length;
    const editContributions =
        contributions(edits.map(edition =>
            edition.work).flat(1).map(work =>
                removeDuplicateWorkContributions(work)).flat(1), [3]).length;
    const translationContributions =
        contributions(translations.map(tr =>
            removeDuplicateEditionContributions(tr)).flat(1), [2]).length;
    const coverContributions =
        contributions(covers.map(tr =>
            removeDuplicateEditionContributions(tr)).flat(1), [4]).length;
    const illustrationContributions =
        contributions(illustrations.map(tr =>
            removeDuplicateEditionContributions(tr)).flat(1), [5]).length;

    return (
        <Fieldset legend={"Kirjat"} toggleable>
            <TabView key={viewNonSf ? "nonSF" : "SF"} activeIndex={activeIndex}
                onTabChange={(e) => setActiveIndex(e.index)} className="w-full"
            >
                <TabPanel key="Kirjoittanut"
                    header={headerText("Kirjoittanut", authorContributions)}
                    disabled={authorContributions === 0}>
                    <WorkList works={works} personName={person.name}
                        collaborationsLast={collaborationsLast} />
                </TabPanel>
                <TabPanel key="Toimittanut"
                    header={headerText("Toimittanut", editContributions)}
                    disabled={editContributions === 0}>
                    <EditionList editions={edits} person={person} sort="author" />
                </TabPanel>
                <TabPanel key="Kääntänyt"
                    header={headerText("Kääntänyt", translationContributions)}
                    disabled={translationContributions === 0}>
                    <EditionList editions={translations} person={person} sort="author" />
                </TabPanel>
                <TabPanel key="Kansikuva"
                    header={headerText("Kansi", coverContributions)}
                    disabled={coverContributions === 0}>
                    <EditionList editions={covers} person={person} sort="author" />
                </TabPanel>
                <TabPanel key="Kuvittaja"
                    header={headerText("Kuvitus", illustrationContributions)}
                    disabled={illustrationContributions === 0}>
                    <EditionList editions={illustrations} person={person} sort="author" />
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