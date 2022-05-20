import axios from "axios";
import React, { useState, useEffect } from 'react';
//import { ProgressSpinner } from "primereact/progressspinner";
import { ProgressBar } from "primereact/progressbar";
import { Link } from 'react-router-dom';
// import "primereact/resources/themes/bootstrap4-light-blue/theme.css";
// import 'primereact/resources/primereact.min.css'
// import './App.css';
// import './index.css';
import { IMagazine } from "./Magazine";
import { API_URL } from "./systemProps";

const client = axios.create({
    baseURL: API_URL + 'magazines'
});

function Magazines() {
    const defaultMagazines: IMagazine[] = [];
    const [magazines, setMagazines]: [IMagazine[], (magazines: IMagazine[]) => void] = useState(defaultMagazines);
    const [loading, setLoading] = useState(true);
    //const [error, setError]: [string, (error: string) => void] = React.useState("");

    useEffect(() => {
        async function getMagazines() {
            try {
                const response = await client.get("");
                setMagazines(response.data);
                setLoading(false);
            }
            catch (e) {
                console.error(e);
                //let ex: string = e;
                //setError(ex);
            }
        }
        getMagazines();
    }, []);

    if (!magazines) return null;

    return (
        <main className="mt-5">
            {
                loading ?
                    <div className="progressbar">
                        <ProgressBar mode="indeterminate" style={{ height: '6px' }} />
                    </div>
                    : (
                        <main>
                            <h1 className="title">Lehdet</h1>
                            <div className="three-column">
                                {
                                    magazines
                                        .sort((a, b) => a.name > b.name ? 1 : -1)
                                        .map((magazine) => (
                                            <React.Fragment key={magazine.id}>
                                                <Link to={`/magazines/${magazine.id}`}
                                                    key={magazine.id}
                                                >
                                                    {magazine.name}
                                                </Link><br></br>
                                            </React.Fragment>
                                        ))
                                }
                            </div>
                        </main >
                    )
            }
        </main>
    );
}

export default Magazines;