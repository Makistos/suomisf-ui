import { useMemo } from "react";
import { Card } from "primereact/card";

import { getCurrenUser } from "@services/auth-service";
import { isAdmin } from "@features/user/utils/is-admin";
import { LoadError } from "@components/load-error";
import { RandomIncompleteWorks } from "../components/random-incomplete-works";
import { KirjasampoUnimportedWorks } from "../components/kirjasampo-unimported-works";
import { WorkLinkSources } from "../components/work-link-sources";
import { SimilarTags } from "../components/similar-tags";

/** Miscellaneous admin tasks, one card per task. Admins only. The link
 * sources card stays last: new cards go above it. */
export const AdminPage = () => {
    const user = useMemo(() => getCurrenUser(), []);

    if (!isAdmin(user)) {
        return <LoadError notFoundTitle="Ei käyttöoikeutta" notFoundText="Sivu on vain ylläpitäjille." />;
    }

    return (
        <main className="all-content">
            <h1>Ylläpito</h1>
            <div className="flex flex-column gap-4">
                <Card title="Satunnainen keskeneräinen teos">
                    <RandomIncompleteWorks />
                </Card>
                <Card title="Kirjasampo-asiasanat tuomatta">
                    <KirjasampoUnimportedWorks />
                </Card>
                <Card title="Samankaltaiset asiasanat">
                    <SimilarTags />
                </Card>
                <Card title="Teosten linkkien lähteet">
                    <WorkLinkSources />
                </Card>
            </div>
        </main>
    );
};

export default AdminPage;
