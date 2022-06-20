import { useState } from 'react';
import { Menubar } from 'primereact/menubar';
import { AutoComplete } from 'primereact/autocomplete';
import { getCurrenUser } from './services/auth-service';
import { logout } from './services/auth-service';
import { getApiContent } from './services/user-service';
import { SITE_URL } from './systemProps';
import { MenuItemCommandParams } from 'primereact/menuitem';

export default function MainMenu() {
    let user = getCurrenUser();
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [filteredItems, setFilteredItems] = useState<any>(null);

    const not_logged_items = [
        {
            label: 'Kirjaudu',
            url: '/login'
        },
        {
            label: 'Rekisteröidy',
            url: ''
        }
    ]

    const logged_items = [
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
                    label: 'Kustantajat',
                    url: '/publishers'
                },
                {
                    label: 'Kirjasarjat',
                    url: '/bookseries'
                },
                {
                    label: 'Kustantajan sarjat',
                    url: '/pubseries'
                },
                {
                    label: 'Palkinnot'
                }
            ]
        },
        {
            label: 'Tilastoja'
        },
        {
            icon: 'fa-solid fa-circle-user',
            command: (event: MenuItemCommandParams) => {
                if (user === null) {
                    event.item.items = not_logged_items;
                } else {
                    event.item.items = logged_items;
                }

            }
        }
    ]


    let items = common_items;
    const start = <span><a href="/" > <b>SuomiSF </b></a > </span>
    const End = () => {
        async function getResults(query: string) {
            const response = await getApiContent("search/" + query, user);
            setFilteredItems(response.data);
        }
        const searchItems = (event: any) => {
            getResults(event.query);
        };

        const searchText = (str: string) => {
            if (str.length > 300) {
                str = str.slice(0, 298);
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
            let target = SITE_URL;
            switch (item.type) {
                case 'work':
                    target = target + 'works/';
                    break;
                case 'person':
                    target = target + 'people/';
                    break;

            }
            window.open(target + item.id, "_self");
            setSelectedItem(null);
        }

        return (
            <div>
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
                    delay={800}
                    scrollHeight="400px"
                />
            </div>
        );
    }
    return (
        <Menubar className="navbar-dark" model={items} start={start} end={End} />
    );
}
