import { useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useQuery } from '@tanstack/react-query';
import { getApiContent } from '../../../services/user-service';
import { getCurrenUser } from '../../../services/auth-service';
import { WorkList } from '../../work/components/work-list';
import { Work } from '../../work/types';
import { ShortsList } from '../../short/components/shorts-list';
import { Short } from '../../short/types';

// What a chart asks to list when a mark is clicked.
export interface Drilldown {
    title: string;
    // Query string for stats/filterworks or stats/filterstories.
    params: URLSearchParams;
}

const Loading = () => (
    <div className="flex justify-content-center p-4">
        <ProgressSpinner style={{ width: '50px', height: '50px' }} />
    </div>
);

const DrilldownDialog = ({ drilldown, onHide, loading, empty, children }: {
    drilldown: Drilldown | null;
    onHide: () => void;
    loading: boolean;
    empty: boolean;
    children: React.ReactNode;
}) => (
    <Dialog
        header={drilldown?.title ?? ''}
        visible={drilldown !== null}
        onHide={onHide}
        style={{ width: '80vw', maxHeight: '90vh' }}
        breakpoints={{ '640px': '95vw' }}
        maximizable
    >
        {loading ? <Loading /> : empty ? <p className="text-500">Ei tuloksia</p> : children}
    </Dialog>
);

// Works behind a clicked mark, from stats/filterworks.
export const WorksDrilldownDialog = ({ drilldown, onHide }: { drilldown: Drilldown | null; onHide: () => void }) => {
    const user = useMemo(() => getCurrenUser(), []);
    const query = drilldown?.params.toString() ?? '';
    const works = useQuery<Work[]>({
        queryKey: ['stats', 'filterworks', query],
        queryFn: async () => (await getApiContent(`stats/filterworks?${query}`, user)).data,
        enabled: drilldown !== null,
    });
    return (
        <DrilldownDialog drilldown={drilldown} onHide={onHide}
            loading={works.isLoading} empty={!works.data?.length}>
            <WorkList works={works.data ?? []} />
        </DrilldownDialog>
    );
};

// Stories behind a clicked mark, from stats/filterstories. The endpoint
// returns brief objects, so list fields get defaults.
export const StoriesDrilldownDialog = ({ drilldown, onHide }: { drilldown: Drilldown | null; onHide: () => void }) => {
    const user = useMemo(() => getCurrenUser(), []);
    const query = drilldown?.params.toString() ?? '';
    const stories = useQuery<Short[]>({
        queryKey: ['stats', 'filterstories', query],
        queryFn: async () => {
            const response = await getApiContent(`stats/filterstories?${query}`, user);
            return (response.data || []).map((short: Partial<Short>) => ({
                ...short,
                genres: short.genres || [],
                editions: short.editions || [],
                issues: short.issues || [],
                tags: short.tags || [],
                awards: short.awards || [],
                order_num: short.order_num ?? 0,
            })) as Short[];
        },
        enabled: drilldown !== null,
    });
    return (
        <DrilldownDialog drilldown={drilldown} onHide={onHide}
            loading={stories.isLoading} empty={!stories.data?.length}>
            <ShortsList shorts={stories.data ?? []} listPublications groupAuthors anthology />
        </DrilldownDialog>
    );
};
