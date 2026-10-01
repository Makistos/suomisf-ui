import React, { useCallback, useEffect, useMemo, useState } from "react";

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
// import { appearsIn } from "@utils/appears-in";

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
    types: number[],
    /**
     * An optional boolean value indicating whether collaborations should be
     * displayed last.
     */
    collaborationsLast?: boolean,
    /**
     * An optional array of tags associated with the contributor.
     */
    tags?: SfTag[]  // Add this line
    ignoreGenreFilter?: boolean
}

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

export const ContributorBookControl = ({ person, viewNonSf, types, collaborationsLast = false, tags, ignoreGenreFilter = false }: CBCProps) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [showTags, setShowTags] = useState(false);

    // Create list that contains all alias ids as well
    const person_ids = useMemo(() => {
        return [...person.aliases.map(alias => alias.id), person.id];
    }, [person.aliases, person.id]);


    /**
     * Determines which tab should be set active based on contribution counts.
     * Returns the index of the first tab that has content (is not disabled).
     *
     * @param counts - Array of contribution counts in tab order
     * @returns Tab number (0-5), defaults to 0
     */
    const calcActiveIndex = (counts: number[]) => {
        const firstWithContent = counts.findIndex(count => count > 0);
        return firstWithContent >= 0 ? firstWithContent : 0;
    }

    const removeDuplicateWorks = (editions: Edition[]) => {
        /**
         * Remove duplicate work entries from list. This will prevent the same
         * work being repeated in the edition list for each edition.
         */

        /* First make sure oldest edition is first in the array by sorting by
           year. Then pick unique work ids. */

        let retval = _.sortBy(editions, [function (e) { return e.pubyear }]);
        retval = _.uniqBy(retval, (value => value.work?.id));
        return retval;
    }

    /**
     * Filter contributions based on contribution types.
     *
     * @param {Contribution[]} contributions - The list of contributions to filter.
     * @param {number[]} contributionTypes - The list of contribution types to include.
     * @return {Contribution[]} The filtered list of contributions.
     */
    const contributions = useCallback((contributions: Contribution[], contributionTypes: number[]) => {
        if (contributions.length === 0) return [];
        return contributions.filter(contrib => (contributionTypes.includes(contrib.role.id) && person_ids.includes(contrib.person.id)))
    }, [person_ids]);

    const edition_contributions = useCallback((editions: Edition[]) => {
        const filtered = editions.filter(edition => edition.work && types.includes(edition.work.work_type.id));
        return filtered.filter(edition => contributions(edition.contributions, [2, 4, 5]).length > 0);
    }, [types, contributions]);

    const work_contributions = useCallback((works: Work[], isSf: boolean, contributionType: number) => {
        const filtered = works.filter(work => types.includes(work.work_type.id) &&
            (ignoreGenreFilter || (isSf ? isNonSf(work.genres) : !isNonSf(work.genres))));
        const retval = filtered.filter(work => contributions(work.contributions, [contributionType]).length > 0);
        const real_name_ids = (person.real_names || []).map(rn => rn.id);
        return retval.filter(work =>
            work.contributions
                .filter(c => contributionType === c.role.id && person_ids.includes(c.person.id))
                .every(c => !c.real_person?.id || person_ids.includes(c.real_person.id) || real_name_ids.includes(c.real_person.id))
        );
    }, [types, ignoreGenreFilter, contributions, person.real_names, person_ids]);

    // Derived lists, computed from props (previously copied into state by an
    // effect that missed some of its inputs, e.g. person.edits).
    const { authored, edits, translations, covers, illustrations, appearsIn_ } = useMemo(() => {
        const editions = edition_contributions(person.editions);
        return {
            authored: work_contributions(person.works, viewNonSf, 1),
            translations: editions.filter(edition => contributions(edition.contributions, [2]).length > 0),
            edits: person.edits.filter(edition => edition.work && types.includes(edition.work.work_type.id)),
            covers: editions.filter(edition => contributions(edition.contributions, [4]).length > 0),
            illustrations: editions.filter(edition => contributions(edition.contributions, [5]).length > 0),
            appearsIn_: work_contributions(person.works, viewNonSf, 6),
        };
    }, [person.works, person.editions, person.edits, viewNonSf, types,
        edition_contributions, work_contributions, contributions]);

    const headerText = (staticText: string, count: number) => {
        return staticText + " (" + count + ")";
    }

    

    // const onlyFirstEdition = (works: Work[]) => {
    //     return works.filter((work, index) => {
    //         return index === works.findIndex(w => work.id === w.id);
    //     })
    // }

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

    // Find contributions for different types. edits/translations/covers/
    // illustrations are Edition[] - one entry per edition - so a work with
    // several editions by the same person would otherwise be counted once
    // per edition instead of once per work; removeDuplicateWorks collapses
    // that down to one (the earliest) edition per work before counting.
    const authorContributions =
        contributions(authored.map(work =>
            removeDuplicateWorkContributions(work)).flat(1), [1]).length;
    const editContributions =
        contributions(removeDuplicateWorks(edits)
            .flatMap(edition => edition.work ? removeDuplicateWorkContributions(edition.work) : []), [3]).length;
    const translationContributions =
        contributions(removeDuplicateWorks(translations).map(tr =>
            removeDuplicateEditionContributions(tr)).flat(1), [2]).length;
    const coverContributions =
        contributions(removeDuplicateWorks(covers).map(tr =>
            removeDuplicateEditionContributions(tr)).flat(1), [4]).length;
    const illustrationContributions =
        contributions(removeDuplicateWorks(illustrations).map(tr =>
            removeDuplicateEditionContributions(tr)).flat(1), [5]).length;
    const appearsInContributions =
        contributions(appearsIn_.map(work =>
            removeDuplicateWorkContributions(work)).flat(1), [6]).length;

    // Set active tab to first one with content
    useEffect(() => {
        const counts = [authorContributions, editContributions, translationContributions, coverContributions, illustrationContributions, appearsInContributions];
        // oxlint-disable-next-line react/set-state-in-effect -- jump to the first non-empty tab when the data changes; the user can still switch tabs
        setActiveIndex(calcActiveIndex(counts));
    }, [authorContributions, editContributions, translationContributions, coverContributions, illustrationContributions, appearsInContributions]);

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
                    works={authored}
                    personName={person.name}
                    collaborationsLast={collaborationsLast}
                />
            </TabPanel>
            <TabPanel key="Toimittanut"
                header={headerText("Toimittanut", editContributions)}
                disabled={editContributions === 0}>
                <ContributorEditionControl editions={edits} person={person} sort="author" collaborationsLast={collaborationsLast} />
            </TabPanel>
            <TabPanel key="Kääntänyt"
                header={headerText("Kääntänyt", translationContributions)}
                disabled={translationContributions === 0}>
                <ContributorEditionControl editions={translations} person={person} sort="author" collaborationsLast={collaborationsLast} />
            </TabPanel>
            <TabPanel key="Kansikuva"
                header={headerText("Kansi", coverContributions)}
                disabled={coverContributions === 0}>
                <ContributorEditionControl editions={covers} person={person} sort="author" collaborationsLast={collaborationsLast} />
            </TabPanel>
            <TabPanel key="Kuvittaja"
                header={headerText("Kuvitus", illustrationContributions)}
                disabled={illustrationContributions === 0}>
                <ContributorEditionControl editions={illustrations} person={person} sort="author" collaborationsLast={collaborationsLast} />
            </TabPanel>
            <TabPanel key="Esiintyy"
                header={headerText("Esiintyy", appearsInContributions)}
                disabled={appearsInContributions === 0}>
                <ContributorWorkControl
                    works={appearsIn_}
                    personName={person.name}
                    collaborationsLast={collaborationsLast}
                />
            </TabPanel>

        </TabView>
    )
}