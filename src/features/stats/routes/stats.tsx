// Statistics about the bibliography, arranged by the question asked
// (overview, publishing over time, content, people, publishers, stories,
// magazines, books as objects, awards, data coverage). Each tab fetches its
// own data from /api/stats/* when opened; shared chart pieces are in
// ../charts. The plan is in docs/stats-plan.md.

import { TabView, TabPanel } from 'primereact/tabview';
import { useSearchParams } from 'react-router-dom';
import { getCurrenUser } from '../../../services/auth-service';
import { isAdmin } from '../../user';
import { OverviewTab } from '../tabs/overview-tab';
import { PublicationsTab } from '../tabs/publications-tab';
import { ContentTab } from '../tabs/content-tab';
import { PeopleTab } from '../tabs/people-tab';
import { PublishersTab } from '../tabs/publishers-tab';
import { StoriesTab } from '../tabs/stories-tab';
import { MagazinesTab } from '../tabs/magazines-tab';
import { BooksTab } from '../tabs/books-tab';
import { AwardsTab } from '../tabs/awards-tab';
import { CoverageTab } from '../tabs/coverage-tab';
import { VisitorStats } from '../components/visitor-stats';
import { PageviewTable } from '../components/pageview-table';

interface StatsTab {
    key: string;
    header: string;
    content: () => React.JSX.Element;
    adminOnly?: boolean;
}

const TABS: StatsTab[] = [
    { key: 'yleiskatsaus', header: 'Yleiskatsaus', content: () => <OverviewTab /> },
    { key: 'julkaisut', header: 'Julkaisut ajallisesti', content: () => <PublicationsTab /> },
    { key: 'sisalto', header: 'Sisältö', content: () => <ContentTab /> },
    { key: 'henkilot', header: 'Henkilöt', content: () => <PeopleTab /> },
    { key: 'kustantajat', header: 'Kustantajat', content: () => <PublishersTab /> },
    { key: 'novellit', header: 'Novellit', content: () => <StoriesTab /> },
    { key: 'lehdet', header: 'Lehdet', content: () => <MagazinesTab /> },
    { key: 'kirjat', header: 'Kirjat esineinä', content: () => <BooksTab /> },
    { key: 'palkinnot', header: 'Palkinnot', content: () => <AwardsTab /> },
    { key: 'kattavuus', header: 'Kattavuus', content: () => <CoverageTab /> },
    { key: 'kavijat', header: 'Kävijät', content: () => <VisitorStats />, adminOnly: true },
    { key: 'kaynnit', header: 'Käynnit', content: () => <PageviewTable />, adminOnly: true },
];

export const StatsPage = () => {
    const user = getCurrenUser();
    const [searchParams, setSearchParams] = useSearchParams();
    const tabs = TABS.filter(t => !t.adminOnly || isAdmin(user));

    // The open tab is in the URL (?tab=...), so links can point at it.
    const active = Math.max(0, tabs.findIndex(t => t.key === searchParams.get('tab')));

    return (
        <main className="all-content">
            <h1 className="title">Tilastoja</h1>
            <div className="mx-3">
                <TabView
                    activeIndex={active}
                    onTabChange={(e) => setSearchParams({ tab: tabs[e.index].key }, { replace: true })}
                    scrollable
                >
                    {tabs.map(t => (
                        <TabPanel key={t.key} header={t.header}>
                            {t.content()}
                        </TabPanel>
                    ))}
                </TabView>
            </div>
        </main>
    );
};
