import React, { useEffect, useState } from "react";

import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import _ from "lodash";

import { Person } from "../features/person";
import { ContributorWorkControl } from "./contributor-work-control";
import { ContributorEditionControl } from "./contributor-edition-control";
import { Work } from "../features/work";
import { Genre } from "../features/genre";
import { Edition } from "../features/edition";
import { Contribution } from "../types/contribution";
import { SfTag, TagGroup } from "@features/tag";
import { appearsIn } from "@utils/appears-in";

/**
 * Represents the props for the ContributorBookControl component.
 */
interface CBCProps {
    /**
     * The person object representing the contributor.
     */
    person: Person,
    /**
     * A boolean value indicating whether to view SF or non-SF works.
     */
    viewNonSf: boolean,
    /**
     * What types of books to show.
     */
    types: Number[],
    /**
     * An optional boolean value indicating whether collaborations should be
     * displayed last.
     */
    collaborationsLast?: boolean,
    /**
     * An optional array of tags associated with the contributor.
     */
    tags?: SfTag[]  // Add this line
}

export const ContributorBookControl = ({ person, viewNonSf, types, collaborationsLast = false, tags }: CBCProps) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [showTags, setShowTags] = useState(false);
    const [works, setWorks]: [Work[], (sfWorks: Work[]) => void]
        = useState<Work[]>([]);
    const [edits, setEdits]: [Edition[], (sfEdits: Edition[]) => void] = useState<Edition[]>([]);
    const [translations, setTranslations]: [Edition[], (sfTranslations: Edition[]) => void]
        = useState<Edition[]>([]);
    const [covers, setCovers] = useState<Edition[]>([]);
    const [illustrations, setIllustrations] = useState<Edition[]>([]);
    const [appearsIn_, setAppearsIn] = useState<Work[]>([]);

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
        return (genres.length === 0 || genres.filter(genre =>
            (genre.abbr !== 'kok') && (genre.abbr !== 'eiSF')).length > 0) ? false : true;
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
        // console.log(editions)
        const filtered = editions.filter(edition => types.includes(edition.work[0].work_type.id));
        return filtered.filter(edition => contributions(edition.contributions, [2, 4, 5]).length > 0);
    }

    useEffect(() => {
        setWorks(person.works.filter(
            work => ((types.includes(work.work_type.id)) &&
                (viewNonSf ? isNonSf(work.genres) : !isNonSf(work.genres)))));
        const editions = edition_contributions(person.editions)

        const newTr = editions.filter(edition =>
            contributions(edition.contributions, [2]).length > 0);
        setTranslations(newTr);
        setEdits(person.edits.filter(edition => types.includes(edition.work[0].work_type.id)));
        const newCovers = editions.filter(edition =>
            contributions(edition.contributions, [4]).length > 0);
        setCovers(newCovers);
        const newIllustrations = editions.filter(edition =>
            contributions(edition.contributions, [5]).length > 0);
        setIllustrations(newIllustrations);
        // const newAppearsIn = person.works.filter(work =>
        //     contributions(work.contributions, [6]).length > 0);
        const newAppearsIn = person.works.filter(edition =>
            contributions(edition.contributions, [6]).length > 0);

        setAppearsIn(newAppearsIn);
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
    const appearsInContributions =
        contributions(appearsIn_.map(work =>
            removeDuplicateWorkContributions(work)).flat(1), [6]).length;

    return (
        <TabView key={viewNonSf ? "nonSF" : "SF"} activeIndex={activeIndex}
            onTabChange={(e) => setActiveIndex(e.index)} className="w-full"
        >
            <TabPanel key="Kirjoittanut"
                header={headerText("Kirjoittanut", authorContributions)}
                disabled={authorContributions === 0}>
                {/* Tags section */}
                {tags && tags.length > 0 && (
                    <div className="mb-3">
                        <Button
                            icon={showTags ? "pi pi-chevron-up" : "pi pi-chevron-down"}
                            label={`Asiasanat (${tags.length})`}
                            className="p-button-text p-button-sm"
                            onClick={() => setShowTags(!showTags)}
                        />
                        {showTags && (
                            <div className="surface-ground p-3 border-round mt-2">
                                <TagGroup tags={tags} overflow={100} showOneCount />
                            </div>
                        )}
                    </div>
                )}
                <ContributorWorkControl
                    works={works}
                    person={person.id}
                    personName={person.name}
                    collaborationsLast={collaborationsLast}
                />
            </TabPanel>
            <TabPanel key="Toimittanut"
                header={headerText("Toimittanut", editContributions)}
                disabled={editContributions === 0}>
                <ContributorEditionControl editions={edits} person={person} sort="author" collaborationsLast={collaborationsLast} detailLevel="brief" />
            </TabPanel>
            <TabPanel key="Kääntänyt"
                header={headerText("Kääntänyt", translationContributions)}
                disabled={translationContributions === 0}>
                <ContributorEditionControl editions={translations} person={person} sort="author" collaborationsLast={collaborationsLast} detailLevel="brief" />
            </TabPanel>
            <TabPanel key="Kansikuva"
                header={headerText("Kansi", coverContributions)}
                disabled={coverContributions === 0}>
                <ContributorEditionControl editions={covers} person={person} sort="author" collaborationsLast={collaborationsLast} detailLevel="brief" />
            </TabPanel>
            <TabPanel key="Kuvittaja"
                header={headerText("Kuvitus", illustrationContributions)}
                disabled={illustrationContributions === 0}>
                <ContributorEditionControl editions={illustrations} person={person} sort="author" collaborationsLast={collaborationsLast} detailLevel="brief" />
            </TabPanel>
            <TabPanel key="Esiintyy"
                header={headerText("Kirjoittanut", authorContributions)}
                disabled={appearsInContributions === 0}>
                <ContributorWorkControl
                    works={appearsIn_}
                    person={person.id}
                    personName={person.name}
                    collaborationsLast={collaborationsLast}
                />
            </TabPanel>

        </TabView>
    )
}