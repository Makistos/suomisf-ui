import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import axios from "axios";
import { ProgressBar } from "primereact/progressbar";

import { Magazine } from "../types";
import { getCurrenUser } from '../../../services/auth-service';
import { useQuery } from '@tanstack/react-query';
import { getApiContent } from '../../../services/user-service';
import { useDocumentTitle } from '../../../components/document-title';

const PublishInfo = ({ magazine }: { magazine: Magazine }) => {
    let info = "";
    if (magazine.issues.length === 0) {
        return <></>;
    }
    const firstYear = Math.max(...magazine.issues.map(issue => issue.year));
    const lastYear = Math.min(...magazine.issues.map(issue => issue.year));
    if (firstYear === 0 || lastYear === 0) {
        info = "";
    } else {
        if (firstYear === lastYear) {
            info = `${firstYear}` + ": ";
        } else {
            info = `${lastYear} - ${firstYear}` + ": ";
        }
    }
    const pubCount = magazine.issues.length;
    info += pubCount + (pubCount === 1 ? " numero" : " numeroa");
    return (
        <><br />{info}<br /></>
    )
}

export function MagazinesPage() {
    const user = getCurrenUser();
    const [documentTitle, setDocumentTitle] = useDocumentTitle("");

    useEffect(() => {
        setDocumentTitle("Lehdet");
    })

    const fetchMagazines = async (): Promise<Magazine[]> => {
        const url = 'magazines';
        const data = await getApiContent(url, user).then(response => {
            return response.data;
        })
        return data;
    }

    const { isLoading, data } = useQuery({
        queryKey: ['magazines'],
        queryFn: fetchMagazines
    });

    if (!data) return null;

    return (
        <main className="all-content">
            {
                isLoading ?
                    <div className="progressbar">
                        <ProgressBar mode="indeterminate" style={{ height: '6px' }} />
                    </div>
                    : (
                        <div>
                            <h1 className="title">Lehdet</h1>
                            <div className="mb-4 pl-3 pr-5">
                                Lehdistä on luetteloitu novellit ja artikkelit.
                                Sarjakuvat puuttuvat, mutta ne on tarkoitus jossain vaiheessa lisätä.
                                Vakiopalstoja, kuten pääkirjoitus-, uutis-, kirja-arvostelu-, elokuva- ja videopalstoja, ei ole yleensä listattu, elleivät ne ole sisältäneet pidempää artikkelia.
                                Artikkelimuotoiset arvostelut on luetteloitu.
                            </div>
                            <div className="three-column">
                                {
                                    data
                                        .sort((a, b) => a.name > b.name ? 1 : -1)
                                        .map((data) => (
                                            <div key={data.id} className="mb-2">
                                                <Link to={`/magazines/${data.id}`}
                                                    key={data.id}
                                                >
                                                    <b>{data.name}</b>
                                                </Link>
                                                <PublishInfo magazine={data} />
                                            </div>
                                        ))
                                }
                            </div>
                        </div >
                    )
            }
        </main>
    );
}
