import React from 'react';
import { Link } from "react-router-dom";
import _ from "lodash"

import { GenreGroup } from "../../genre";
import { TagGroup } from "../../tag";
import { LinkList } from "../../../components/link-list";
import { AwardPanel } from "../../award";
import { LinkPanel } from "../../../components/link-panel";
import { WorkProps } from "../routes";
import { Contribution } from '../../../types/contribution';
import WorkBookseriesBrowser from './work-bookseries-browser';
import { isForeign } from '../utils/is-foreign';
import { Work } from '../types';

export const WorkDetails = ({ work }: WorkProps) => {

    const compareContribs = (a: Contribution, b: Contribution) => {
        if (a.person.id !== b.person.id) return false;
        if (a.role.id !== b.role.id) return false;
        return true;
    }
    const authors = (contributions: Contribution[]) => {
        const uniques = _.uniqWith(contributions, compareContribs);
        return uniques.filter(person => person.role.id === 1).map((item) => ({
            id: item.person['id'],
            name: item.person['name'],
            alt_name: item.person['alt_name'] ? item.person['alt_name'] : item.person['name']
        }))
    }

    const original = (work: Work) => {
        let retval = '';
        if (isForeign(work) && work.orig_title) {
            retval = work.orig_title + ", "
        }
        retval += work.pubyear
        if (work.type && work.type === 2 && work.stories && work.stories.length > 0) {
            // Count frequency of each language
            const languageCounts = work.stories.reduce((acc, story) => {
                if (story.lang && story.lang.name) {
                    const langName = story.lang.name;
                    acc[langName] = (acc[langName] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);

            // Sort languages by frequency (descending) and get unique sorted list
            const sortedLanguages = Object.entries(languageCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([langName]) => langName);

            if (sortedLanguages.length > 0) {
                retval += " (" + sortedLanguages.join(', ') + ")"
            }
        } else if (work.language_name) {
            retval += " (" + work.language_name.name + ")"
        }
        return retval
    }

    console.log(work.part_of);

    return (
        <>
            <div className="grid">
                {work.contributions.filter(person => person.role.id === 1).length > 0 && (
                    <div className="grid col-12 mb-0 pb-0">
                        <h2 className="mb-0 font-semibold">
                            <LinkList path="people"
                                separator=" &amp; "
                                items={authors(work.contributions)} />
                        </h2>
                    </div>
                )}
                {work.contributions &&
                    work.contributions.filter(person => person.role.id === 1).length === 0 &&
                    work.contributions.filter(person => person.role.id === 3).length > 0 && (
                        <div className="grid col-12">
                            <h2 className="mb-0 mt-0 font-semibold">
                                Toim.&nbsp;
                                <LinkList path="people"
                                    separator=" &amp; "
                                    items={work.contributions.filter(
                                        contrib => contrib.role.id === 3).map((item) => ({
                                            id: item.person['id'],
                                            name: item.person['name'],
                                            alt_name: item.person['alt_name'] ? item.person['alt_name'] : item.person['name']
                                        }))} />
                            </h2>
                        </div>
                    )}
                <div className="grid col-12 pt-0 mt-3 mb-2 pb-0">
                    <h1 className="mt-0 mb-0 text-2xl sm:text-3xl lg:text-4xl uppercase"
                        style={{ lineHeight: '1.0' }}>
                        {work.title}<br />
                        {work.subtitle && (
                            <span className="text-base sm:text-lg pt-0 mt-0">{work.subtitle}</span>
                        )}
                    </h1>
                </div>
                <div className="grid col-12 mt-0 pt-0 p-2">
                    <p className="font-medium text-sm mt-0">
                        {original(work)}
                    </p>

                    {work.bookseries && (
                        <div className="col-12 p-0">
                            <WorkBookseriesBrowser workId={work.id} bookseriesId={work.bookseries.id} />
                        </div>
                    )}
                    {(work.consists_of && work.consists_of.length > 0) && (
                        <div className="col-12 p-0 mt-2">
                            <b>Sisältää teokset:</b>
                            <ul className="mt-0 mb-2">
                                {
                                    work.consists_of.map((item) => (
                                        <li key={item.work.id} className="mb-1">
                                            <Link to={`/works/${item.work.id}`}>
                                                {item.work.title}
                                                {(item.work.orig_title && item.work.language_name?.id !== 7) || item.work.pubyear ? (
                                                    ` (${[
                                                        item.work.orig_title && item.work.language_name?.id !== 7 ? item.work.orig_title : null,
                                                        item.work.pubyear
                                                    ].filter(Boolean).join(', ')})`
                                                ) : ''}
                                            </Link>
                                            {item.explanation && (
                                                <span> [{item.explanation}]</span>
                                            )}
                                        </li>
                                    ))
                                }
                            </ul>
                        </div>
                    )}
                    {work.part_of && work.part_of.length > 0 && (
                        <div className="col-12 p-0 mt-2">
                            {work.part_of.length === 1 && <b>Myös teoksessa:</b>}
                            {work.part_of.length > 1 && <b>Myös teoksissa:</b>}
                            <ul className="mt-0 mt-2 mb-2">
                                {work.part_of.sort((a, b) => a.omnibus.title.localeCompare(b.omnibus.title)).map((parentwork) => (
                                    <li key={parentwork.omnibus.id}>
                                        <Link to={`/works/${parentwork.omnibus.id}`}>
                                            {parentwork.omnibus.title}
                                            {(parentwork.omnibus.orig_title && parentwork.omnibus.language_name?.id !== 7) || parentwork.omnibus.pubyear ? (
                                                ` (${[
                                                    parentwork.omnibus.orig_title && parentwork.omnibus.language_name?.id !== 7 ? parentwork.omnibus.orig_title : null,
                                                    parentwork.omnibus.pubyear
                                                ].filter(Boolean).join(', ')})`
                                            ) : ''}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {work.editions && work.editions.length > 0 && (
                        <div className="col-12 p-0">
                            <div className="col-12 p-0">
                                {work.misc}
                            </div>
                            {work.description && (
                                <div className="grid flex-wrap col-12 pb-0 mb-0 p-0">
                                    <div dangerouslySetInnerHTML={{ __html: work.description }} />
                                    {work.descr_attr && (
                                        <div className="book-attribution"
                                            dangerouslySetInnerHTML={{ __html: work.descr_attr }} />
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
