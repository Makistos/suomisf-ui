// Display various charts and lists of some interesting statistics regarding the dataset.
// Each chart has its own backend function starting with string /api/stats/ and they are located
// in the src/api/stats folder.

import { TabView, TabPanel } from 'primereact/tabview';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useQuery } from '@tanstack/react-query';
import { getApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';
import { GenreChart } from '../components/genre-chart';
import { WorksByYearChart } from '../components/works-by-year-chart';
import { PublisherChart } from '../components/publisher-chart';
import { IssuesChart } from '../components/issues-chart';
import { AuthorChart } from '../components/author-chart';

interface GenreCounts {
    [key: string]: number;
}

interface PublisherCount {
    id: number | null;
    name: string;
    fullname: string | null;
    genres: { [key: string]: number };
    total: number;
}

interface YearCount {
    year: number;
    count: number;
    language_id: number | null;
    language_name: string | null;
}

interface IssueYearCount {
    year: number;
    count: number;
}

interface NationalityCount {
    nationality_id: number | null;
    nationality: string | null;
    count: number;
}

interface MiscStats {
    total_pages: number;
    stack_height_meters: number;
    hardback_count: number;
    paperback_count: number;
    total_editions: number;
    total_works: number;
}

export const StatsPage = () => {
    const user = getCurrenUser();

    // Fetch all statistics data
    const genreCounts = useQuery<GenreCounts>({
        queryKey: ['stats', 'genrecounts'],
        queryFn: async () => {
            const response = await getApiContent('stats/genrecounts', user);
            return response.data;
        }
    });

    const publisherCounts = useQuery<PublisherCount[]>({
        queryKey: ['stats', 'publishercounts'],
        queryFn: async () => {
            const response = await getApiContent('stats/publishercounts?count=25', user);
            return response.data;
        }
    });

    const worksByYear = useQuery<YearCount[]>({
        queryKey: ['stats', 'worksbyyear'],
        queryFn: async () => {
            const response = await getApiContent('stats/worksbyyear', user);
            return response.data;
        }
    });

    const origWorksByYear = useQuery<YearCount[]>({
        queryKey: ['stats', 'origworksbyyear'],
        queryFn: async () => {
            const response = await getApiContent('stats/origworksbyyear', user);
            return response.data;
        }
    });

    const miscStats = useQuery<MiscStats>({
        queryKey: ['stats', 'misc'],
        queryFn: async () => {
            const response = await getApiContent('stats/misc', user);
            return response.data;
        }
    });

    const issuesPerYear = useQuery<IssueYearCount[]>({
        queryKey: ['stats', 'issuesperyear'],
        queryFn: async () => {
            const response = await getApiContent('stats/issuesperyear', user);
            return response.data;
        }
    });

    const nationalityCounts = useQuery<NationalityCount[]>({
        queryKey: ['stats', 'nationalitycounts'],
        queryFn: async () => {
            const response = await getApiContent('stats/nationalitycounts', user);
            return response.data;
        }
    });

    const isLoading = genreCounts.isLoading || publisherCounts.isLoading ||
        worksByYear.isLoading || origWorksByYear.isLoading ||
        miscStats.isLoading || issuesPerYear.isLoading || nationalityCounts.isLoading;

    if (isLoading) {
        return (
            <main className="all-content">
                <ProgressSpinner />
            </main>
        );
    }

    return (
        <main className="all-content">
            <h1 className="title">Tilastoja</h1>

            {/* Misc stats overview cards */}
            <p>Tietokannassa on&nbsp;
                {miscStats.data?.total_works?.toLocaleString('fi-FI')}&nbsp;
                teosta ja&nbsp;
                {miscStats.data?.total_editions?.toLocaleString('fi-FI')}&nbsp;
                painosta. Kannasta puuttuu vielä paljon painoksia, mutta
                kannassa olevissa painoksissa on yhteensä&nbsp;
                {miscStats.data?.total_pages?.toLocaleString('fi-FI')}&nbsp;
                sivua, ja ne muodostaisivat&nbsp;
                {Math.round(miscStats.data?.stack_height_meters ?? 0).toLocaleString('fi-FI')}&nbsp;
                metriä korkean pinon. Ensipainoksista&nbsp;
                {miscStats.data?.hardback_count?.toLocaleString('fi-FI')}&nbsp;
                oli kovakantisia ja&nbsp;
                {miscStats.data?.paperback_count?.toLocaleString('fi-FI')}&nbsp;
                pehmytkantisia.
            </p>

            {/* Tabbed charts section */}
            <div className="mx-3">
                <TabView>
                    <TabPanel header="Genret">
                        {genreCounts.data && <GenreChart data={genreCounts.data} />}
                    </TabPanel>

                    <TabPanel header="Kirjailijat">
                        {nationalityCounts.data && (
                            <AuthorChart nationalityData={nationalityCounts.data} />
                        )}
                    </TabPanel>

                    <TabPanel header="Kustantajat">
                        {publisherCounts.data && <PublisherChart data={publisherCounts.data} />}
                    </TabPanel>

                    <TabPanel header="Julkaisut vuosittain">
                        {worksByYear.data && origWorksByYear.data && (
                            <WorksByYearChart
                                finnishEditionData={worksByYear.data}
                                originalYearData={origWorksByYear.data}
                            />
                        )}
                    </TabPanel>

                    <TabPanel header="Lehdet">
                        {issuesPerYear.data && <IssuesChart data={issuesPerYear.data} />}
                    </TabPanel>
                </TabView>
            </div>
        </main>
    );
};
