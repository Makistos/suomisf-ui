import { IPerson } from "./Person";
import { Fieldset } from "primereact/fieldset";
import { TabView, TabPanel } from "primereact/tabview";
import { WorkList } from "./WorkList";
import { EditionList } from "./EditionList";
import { SeriesList } from "./BookseriesList";

interface CBCProps {
    person: IPerson
}

export const ContributorBookControl = ({ person }: CBCProps) => {

    const headerText = (staticText: string, count: number) => {
        return staticText + " (" + count + ")";
    }
    return (
        <Fieldset legend="Kirjat" toggleable>
            <TabView>
                {person.works.length > 0 &&
                    <TabPanel header={headerText("Kirjoittanut", person.works.length)}>
                        <WorkList works={person.works} personName={person.name} />
                    </TabPanel>
                }
                {person.edits.length > 0 &&
                    <TabPanel header={headerText("Toimittanut", person.edits.length)}>
                        <EditionList editions={person.edits} person={person} />
                    </TabPanel>
                }
                {person.translations.length > 0 &&
                    <TabPanel header={headerText("Kääntänyt", person.translations.length)}>
                        <EditionList editions={person.translations} person={person} />
                    </TabPanel>
                }
                {person.works.some((work) => work.bookseries !== null) &&
                    <TabPanel header="Sarjat">
                        <SeriesList works={person.works} seriesType='bookseries' />
                    </TabPanel>
                }
            </TabView>
        </Fieldset>
    )
}