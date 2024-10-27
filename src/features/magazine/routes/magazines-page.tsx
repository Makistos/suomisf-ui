import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import axios from "axios";
import { ProgressBar } from "primereact/progressbar";

import { Magazine } from "../types";
import { getCurrenUser } from '../../../services/auth-service';
import { useQuery } from '@tanstack/react-query';
import { getApiContent } from '../../../services/user-service';
import { useDocumentTitle } from '../../../components/document-title';
//import { API_URL } from "../../../systemProps";

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
                            <div className="three-column">
                                {
                                    data
                                        .sort((a, b) => a.name > b.name ? 1 : -1)
                                        .map((data) => (
                                            <div key={data.id}>
                                                <Link to={`/magazines/${data.id}`}
                                                    key={data.id}
                                                >
                                                    {data.name}
                                                </Link><br />
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
