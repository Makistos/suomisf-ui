import React, { useState, useMemo } from 'react';

import { Menubar } from 'primereact/menubar';
import { AutoComplete } from 'primereact/autocomplete';
import { Dialog } from 'primereact/dialog';

import { getCurrenUser } from '../services/auth-service';
import { logout } from '../services/auth-service';
import { getApiContent } from '../services/user-service';
import { LoginView, User } from '../features/user';
import { RegisterView } from '@features/user/components/register-view';
import { classNames } from 'primereact/utils';

export default function MainMenu() {
    const user = useMemo(() => { return getCurrenUser() }, []);
    //const [currentUser, setCurrentUser] = useState<User | null>(user);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [filteredItems, setFilteredItems] = useState<any>(null);
    const [loginVisible, setLoginVisible] = useState(false);
    const [registerVisible, setRegisterVisible] = useState(false);

    const onHide = () => {
        setLoginVisible(false);
    }
    const loginScreen = () => {
        setLoginVisible(true);
    }

    const userName = (): string => {
        //return currentUser !== null ? currentUser.user : "";
        return user !== null ? user.name : "";
    }

    const not_logged_items = [
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
                    label: 'Asiasanat',
                    url: '/tags'
                },
                {
                    label: 'Palkinnot',
                    url: '/awards'
                },
            ]
        },
        {
            label: userName(),
            icon: 'fa-solid fa-circle-user',
            items: [
                {
                    label: 'Kirjaudu',
                    command: () => {
                        loginScreen();
                    }
                },
                {
                    label: 'Rekisteröidy',
                    command: () => {
                        setRegisterVisible(true);
                    }
                }
            ]
        }
    ]

    const logged_items = [
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
                    label: 'Asiasanat',
                    url: '/tags'
                },
                {
                    label: 'Palkinnot',
                    url: '/awards'
                }
            ]
        },
        {
            label: userName(),
            icon: 'fa-solid fa-circle-user',
            items: [
                {
                    label: 'Lista'
                },
                {
                    label: 'Omat tiedot',
                    url: '/users/' + user?.id
                },
                {
                    label: 'Kirjaudu ulos',
                    command: () => { logout(); }
                }

            ]
        }
    ]

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
        const itemIcon = (itemType: string) => {
            let retval = "";
            switch (itemType) {
                case 'work':
                    // return <i>(Teos)</i>
                    return <i className={classNames('fa', 'fa-book')}></i>
                case 'person':
                    // return <i>(Henkilö)</i>
                    return <i className={classNames('fa', 'fa-user')}></i>
                case 'story':
                    // return <i>(Novelli)</i>
                    return <i className={classNames('fa', 'fa-scroll')}></i>
            }
            return retval;
        }

        const itemTemplate = (item: any) => {
            return (
                <div className="searchItem">
                    {itemIcon(item.type)}&nbsp;
                    <span className="searchItemHeader">{item.header}</span>
                    {item.author && (
                        <>
                            <span className="searchItemAuthor">
                                :&nbsp;{item.author}
                            </span>
                        </>
                    )}
                    {item.description && (
                        <>
                            <div dangerouslySetInnerHTML={{ __html: item.description }} className="searchItemContents" >
                                {/* <p className="searchItemContents">
                                    {searchText(item.description)}
                                </p> */}
                            </div>
                        </>
                    )}
                </div >
            )
        }

        const selectItem = (item: any) => {
            let target = import.meta.env.VITE_SITE_URL;
            switch (item.type) {
                case 'work':
                    target = target + 'works/';
                    break;
                case 'person':
                    target = target + 'people/';
                    break;
                case 'story':
                    target = target + 'shorts/';
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
        <div>
            <Dialog visible={loginVisible} onHide={() => onHide()}
                breakpoints={{ '960px': '75vw', '640px': '100vw' }} style={{ width: '50vw' }}
            >
                <LoginView />
            </Dialog>
            <Dialog visible={registerVisible} onHide={() => onHide()}
                breakpoints={{ '960px': '75vw', '640px': '100vw' }} style={{ width: '50vw' }}
            >
                <RegisterView />
            </Dialog>

            <Menubar className="navbar-dark" model={user === null ? not_logged_items : logged_items} start={start} end={End} />
        </div>
    );
}
