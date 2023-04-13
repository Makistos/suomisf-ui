import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import axios from "axios";
import { ProgressBar } from "primereact/progressbar";

import { Magazine } from "../types";
//import { API_URL } from "../../../systemProps";

function MagazinesPage() {
    const defaultMagazines: Magazine[] = [];
    const [magazines, setMagazines]: [Magazine[], (magazines: Magazine[]) => void] = useState(defaultMagazines);
    const [loading, setLoading] = useState(true);

    const client = axios.create({
        baseURL: process.env.REACT_APP_API_URL + 'magazines'
    });


    useEffect(() => {
        async function getMagazines() {
            try {
                const response = await client.get("");
                setMagazines(response.data);
                setLoading(false);
            }
            catch (e) {
                console.error(e);
            }
        }
        getMagazines();
    }, []);

    if (!magazines) return null;

    return (
        <main className="all-content">
            {
                loading ?
                    <div className="progressbar">
                        <ProgressBar mode="indeterminate" style={{ height: '6px' }} />
                    </div>
                    : (
                        <div>
                            <h1 className="title">Lehdet</h1>
                            <div className="three-column">
                                {
                                    magazines
                                        .sort((a, b) => a.name > b.name ? 1 : -1)
                                        .map((magazine) => (
                                            <>
                                                <Link to={`/magazines/${magazine.id}`}
                                                    key={magazine.id}
                                                >
                                                    {magazine.name}
                                                </Link><br></br>
                                            </>
                                        ))
                                }
                            </div>
                        </div >
                    )
            }
        </main>
    );
}

export default MagazinesPage;