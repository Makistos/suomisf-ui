import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";

import { getCurrenUser } from "../../../services/auth-service";
import { getApiContent } from "../../../services/user-service";
import { WorkList } from "../../work";
import { Bookseries } from "../types";
import { User } from "../../user";

const baseURL = 'bookseries/';

export const BookseriesPage = () => {
    const params = useParams();
    const user = useMemo(() => { return getCurrenUser() }, []);

    const [bookseries, setBookseries]: [Bookseries | null, (bookseries: Bookseries) => void] = useState<Bookseries | null>(null);

    useEffect(() => {
        async function getBookseries() {
            let url = baseURL + params.bookseriesId?.toString();
            try {
                const response = await getApiContent(url, user);
                setBookseries(response.data);
            } catch (e) {
                console.error(e);
            }
        }
        getBookseries();
    }, [params.bookseriesId, user])

    if (!bookseries) return null;

    return (
        <main className="all-content">
            <div className="mb-5">
                <div className="grid col-12 mb-1 justify-content-center">
                    <h1 className="maintitle">{bookseries.name}</h1>
                </div>
                {bookseries.orig_name && (
                    <div className="grid col-12 mt-0 justify-content-center">
                        <h2>({bookseries.orig_name})</h2>
                    </div>
                )}
            </div>
            <div className="mt-5">
                <WorkList works={bookseries.works} />
            </div>
        </main>
    )
}
