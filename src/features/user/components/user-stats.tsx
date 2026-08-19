import { getApiContent } from "@services/user-service";
import { getCurrenUser } from "@services/auth-service";
import { TabView, TabPanel } from "primereact/tabview";
import { useEffect, useMemo, useState } from "react";
import {
    UserCollectionCharts,
    GenreData,
    CollectionComposition,
} from "./user-collection-charts";

interface UserStatsProps {
    userId: string
}

export const UserStats = ({ userId }: UserStatsProps) => {
    const user = useMemo(() => getCurrenUser(), []);
    const [genreData, setGenreData] = useState<GenreData[]>([]);
    const [comp, setComp] = useState<CollectionComposition | null>(null);
    const [readGenreData, setReadGenreData] = useState<GenreData[]>([]);
    const [readComp, setReadComp] = useState<CollectionComposition | null>(null);

    useEffect(() => {
        getApiContent(`users/${userId}/stats/genres`, null)
            .then(r => setGenreData(r.data))
            .catch(() => { });
        getApiContent(`user/${userId}/collection/stats`, user)
            .then(r => setComp(r.data))
            .catch(() => { });
        getApiContent(`users/${userId}/stats/read-genres`, null)
            .then(r => setReadGenreData(r.data))
            .catch(() => { });
        getApiContent(`user/${userId}/read/stats`, user)
            .then(r => setReadComp(r.data))
            .catch(() => { });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const hasReadData = readGenreData.length > 0 || (readComp?.total_pages ?? 0) > 0
        || (readComp?.language_distribution.length ?? 0) > 0 || (readComp?.worktype_distribution.length ?? 0) > 0;

    return (
        <TabView>
            <TabPanel header="Omistetut teokset">
                <UserCollectionCharts userId={userId} genreData={genreData} comp={comp} filterParam="owner" />
            </TabPanel>
            <TabPanel header="Luetut teokset">
                {hasReadData ? (
                    <UserCollectionCharts userId={userId} genreData={readGenreData} comp={readComp} filterParam="read" />
                ) : (
                    <p className="text-500">Ei luettuja teoksia.</p>
                )}
            </TabPanel>
        </TabView>
    );
}
