import { Link } from "react-router-dom";

import { Work } from "@features/work/types";
import { IncompleteWorksResult } from "../api/incomplete-works";

const authors = (work: Work) =>
    work.contributions
        .filter(c => c.role.id === 1)
        .map(c => c.person.name)
        .join(", ");

/** Works found by an incomplete-works search, with author, type and edition count. */
export const WorkResultList = ({ result }: { result: IncompleteWorksResult }) => {
    if (result.works.length === 0) {
        return <p className="text-color-secondary m-0">Teoksia ei löytynyt.</p>;
    }
    return (
        <div>
            <h3 className="mt-0 mb-2">
                Löydetyt teokset
                <span className="text-500 font-normal text-base ml-2">
                    ({result.works.length} näytetty, {result.total.toLocaleString("fi-FI")} yhteensä)
                </span>
            </h3>
            {result.works.map(work => (
                <div key={work.id} className="p-1">
                    <h4 className="mt-0 mb-0">
                        {authors(work) && <>{authors(work)}:&nbsp;</>}
                        <Link to={`/works/${work.id}`}>{work.title}</Link>
                    </h4>
                    {work.work_type && (
                        <span className="text-sm text-600">
                            {work.work_type.name}. Painoksia: {work.editions.length}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
};
