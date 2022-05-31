import { useEffect, useState } from "react";
import { IPerson } from "./Person";
import { Fieldset } from "primereact/fieldset";
import { TabView, TabPanel } from "primereact/tabview";
import { WorkList } from "./WorkList";
import { EditionList } from "./EditionList";
import { SeriesList } from "./BookseriesList";
import { IWork } from "./Work";
import { IGenre } from "./Genre";
import { IEdition } from "./Edition";

interface CBCProps {
    person: IPerson,
    viewNonSf: boolean,
}

export const ContributorBookControl = ({ person, viewNonSf }: CBCProps) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [works, setWorks]: [IWork[], (sfWorks: IWork[]) => void]
        = useState<IWork[]>([]);
    const [edits, setEdits]: [IEdition[], (sfEdits: IEdition[]) => void] = useState<IEdition[]>([]);
    const [translations, setTranslations]: [IEdition[], (sfTranslations: IEdition[]) => void]
        = useState<IEdition[]>([]);

    // const sfWorks = () => {
    //     return person.works.filter(work => !isNonSf(work.genres));
    // }

    // const nonSfWorks = () => {
    //     return person.works.filter(work => isNonSf(work.genres));
    // }
    const isNonSf = (genres: IGenre[]) => {
        let retval;
        retval = genres.filter(genre =>
            (genre.abbr !== 'kok') && (genre.abbr !== 'eiSF')).length > 0 ? false : true;
        return retval;
    }

    const calcActiveIndex = (works: IWork[], edits: IEdition[], translations: IEdition[]) => {
        if (works.length > 0) return 0;
        if (edits.length > 0) return 1;
        if (translations.length > 0) return 2;
        return 0;

    }

    useEffect(() => {
        let newWorks: IWork[] = [];
        let newEdits: IEdition[] = [];
        let newTranslations: IEdition[] = [];

        if (viewNonSf) {
            newWorks = person.works.filter(work => isNonSf(work.genres));
            newEdits = person.edits.filter(edition =>
                isNonSf(edition.work.map(work => work.genres).flat()));
            newTranslations = person.translations.filter(edition =>
                isNonSf(edition.work.map(work => work.genres).flat()));
        } else {
            newWorks = person.works.filter(work => !isNonSf(work.genres));
            newEdits = person.edits.filter(edition =>
                !isNonSf(edition.work.map(work => work.genres).flat()));
            newTranslations = person.translations.filter(edition =>
                !isNonSf(edition.work.map(work => work.genres).flat()));
        }
        setWorks(newWorks);
        setEdits(newEdits);
        setTranslations(newTranslations);
        const initialIndex = calcActiveIndex(newWorks, newEdits, newTranslations);
        setActiveIndex(initialIndex);
    }, [person.works, person.edits, person.translations, viewNonSf]);

    const headerText = (staticText: string, count: number) => {
        return staticText + " (" + count + ")";
    }

    const hasWorks = () => {
        return (works.length > 0);
    }

    const hasSeries = () => {
        const retval = works.some(work => work.bookseries !== null)
        return retval;
    }

    const hasEditions = (type: string) => {
        if (type === "edits")
            return (edits.length > 0);
        return translations.length > 0;
    }

    return (
        <Fieldset legend={viewNonSf ? "Ei-SF/Mainstream" : "Kirjat"} toggleable>
            <TabView key={viewNonSf ? "nonSF" : "SF"} activeIndex={activeIndex}
                onTabChange={(e) => setActiveIndex(e.index)}
            >
                <TabPanel key="Kirjoittanut" header={headerText("Kirjoittanut", works.length)}
                    disabled={!hasWorks()}
                >
                    <WorkList works={works} personName={person.name} />
                </TabPanel>
                <TabPanel key="Toimittanut" header={headerText("Toimittanut", edits.length)}
                    disabled={!hasEditions("edits")}
                >
                    <EditionList editions={edits} person={person} />
                </TabPanel>
                <TabPanel key="Kääntänyt" header={headerText("Kääntänyt", translations.length)}
                    disabled={!hasEditions("translations")}
                >
                    <EditionList editions={translations} person={person} />
                </TabPanel>
                {viewNonSf === false &&
                    <TabPanel key="Sarjat" header="Sarjat" disabled={!hasSeries()}>
                        <SeriesList works={person.works} seriesType='bookseries' />
                    </TabPanel>
                }
            </TabView>
        </Fieldset>
    )
}