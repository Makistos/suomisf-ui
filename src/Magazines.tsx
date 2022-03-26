import axios from "axios";
import React from 'react';
//import { ProgressSpinner } from "primereact/progressspinner";
import { ProgressBar } from "primereact/progressbar";
import { Link } from 'react-router-dom';
// import "primereact/resources/themes/bootstrap4-light-blue/theme.css";
// import 'primereact/resources/primereact.min.css'
// import './App.css';
// import './index.css';
import { IMagazine } from "./Magazine";
import { SITE_URL } from "./systemProps";

const client = axios.create({
    baseURL: SITE_URL + 'magazines'
});

function Magazines() {
    const defaultMagazines: IMagazine[] = [];
    const [magazines, setMagazines]: [IMagazine[], (magazines: IMagazine[]) => void] = React.useState(defaultMagazines);
    //const [loading, setLoading]: [boolean, (loading: boolean) => void] = React.useState<boolean>(true);
    //const [error, setError]: [string, (error: string) => void] = React.useState("");

    React.useEffect(() => {
        async function getMagazines() {
            try {
                const response = await client.get("");
                setMagazines(response.data);
                //setLoading(false);
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
        <main>
            <h1 className="title">Lehdet</h1>
            {magazines.length > 0 ? (
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
            ) : (
                <div>
                    <ProgressBar mode="indeterminate" style={{ height: '6px' }}></ProgressBar>
                </div>
            )
            }
        </main >
    );
}

export default Magazines;