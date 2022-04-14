import { useEffect, useState } from 'react';
//import "primereact/resources/themes/bootstrap4-light-blue/theme.css";
//import 'primereact/resources/primereact.min.css'
import { Menubar } from 'primereact/menubar';
import { AutoComplete } from 'primereact/autocomplete';
import { getCurrenUser } from './services/auth-service';
import { logout } from './services/auth-service';
import { getApiContent } from './services/user-service';
import { Link } from 'react-router-dom';
import { SITE_URL } from './systemProps';

const common_items = [
    {
        label: 'Kirjat',
        url: '/bookindex'
    },
    {
        label: 'Lehdet',
        url: '/magazines'
    },
    {
        label: 'Novellit',
        url: '/shortstoryindex'
    },
    {
        label: 'Hakemistot',
        items: [
            {
                label: 'Henkilöt',
                url: '/people'
            },
            {
                label: 'Kustantajat'
            },
            {
                label: 'Kirjasarjat'
            },
            {
                label: 'Kustantajan sarjat'
            },
            {
                label: 'Palkinnot'
            }
        ]
    },
    {
        label: 'Tilastoja'
    }
]

const not_logged_items = [
    {
        label: 'Käyttäjät',
        items: [
            {
                label: 'Kirjaudu',
                url: '/login'
            },
            {
                label: 'Rekisteröidy',
                url: ''
            }
        ]
    }
]

const logged_items = [
    {
        label: 'Käyttäjät',
        items: [
            {
                label: 'Lista'
            },
            {
                label: 'Omat tiedot'
            },
            {
                label: 'Kirjaudu ulos',
                command: () => { logout(); }
            }
        ]
    }
]
const start = <span><a href="/" > <b>SuomiSF </b></a > </span>
//const end = <InputText placeholder="Etsi" type="text" />;

export default function MainMenu({ }) {
    let user = getCurrenUser();
    let items = common_items;
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [filteredItems, setFilteredItems] = useState<any>(null);

    useEffect(() => {
        if (user === null) {
            items.push(not_logged_items[0]);
        } else {
            items.push(logged_items[0]);
        }
    }, [])
    const End = () => {
        async function getResults(query: string) {
            const response = await getApiContent("search/" + query, user);
            console.log("Results: " + response.data);
            setFilteredItems(response.data);
        }
        const searchItems = (event: any) => {
            getResults(event.query);
        };

        const searchText = (str: string) => {
            if (str.length > 100) {
                str = str.slice(0, 98);
                str = str + "...";
            }
            let tmp = document.createElement("DIV");
            tmp.innerHTML = str;
            return tmp.textContent || tmp.innerText || "";
        }
        const itemTemplate = (item: any) => {
            return (
                <div className="searchItem">
                    <h1 className="searchItemHeader">{item.header}</h1>
                    {item.description && (
                        <p className="searchItemContents">
                            {searchText(item.description)}
                        </p>
                    )}
                </div >
            )
        }

        const selectItem = (item: any) => {
            let target = '';
            //window.open("http://www.sf-bibliografia.fi:3000/works/" + item.id, "_self");
            switch (item.type) {
                case 'work':
                    target = 'works/';
                    break;
                case 'person':
                    target = 'people/';
                    break;

            }
            window.open("http://localhost:3000/" + target + item.id, "_self");
            setSelectedItem(null);
        }

        return (
            <AutoComplete
                placeholder="Etsi"
                minLength={3}
                onChange={(e) => setSelectedItem(e.value)}
                onSelect={(e) => selectItem(e.value)}
                completeMethod={searchItems}
                value={selectedItem}
                suggestions={filteredItems}
                field="header"
                itemTemplate={itemTemplate}
            />
        );
    }
    return (
        <Menubar className="navbar-dark" model={items} start={start} end={End} />
    );
}
