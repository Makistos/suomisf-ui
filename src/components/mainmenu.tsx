import React, { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';

import { Menubar } from 'primereact/menubar';
import { AutoComplete } from 'primereact/autocomplete';
import { Checkbox } from 'primereact/checkbox';
import { Dialog } from 'primereact/dialog';

import { getCurrenUser } from '../services/auth-service';
import { logout } from '../services/auth-service';
import { getApiContent } from '../services/user-service';
import { ProgressSpinner } from 'primereact/progressspinner';
import {
    SEARCH_MIN_LENGTH, SearchItem, searchItemIcon, searchItemPath, searchItemText, searchResultsPath,
} from '@features/search/utils/search-items';

// The menu is on every page, but these only open in its dialogs. Loading
// them on demand keeps the forms (and their editors, tables and pickers)
// out of the bundle every visitor downloads before the first paint.
const LoginView = lazy(() => import('@features/user/components/login-view'));
const RegisterView = lazy(() => import('@features/user/components/register-view').then(m => ({ default: m.RegisterView })));
const WorkForm = lazy(() => import('../features/work/components/work-form').then(m => ({ default: m.WorkForm })));
const PersonForm = lazy(() => import('../features/person/components/person-form').then(m => ({ default: m.PersonForm })));

const dialogFallback = (
    <div className="flex justify-content-center p-4">
        <ProgressSpinner style={{ width: '3rem', height: '3rem' }} />
    </div>
);

export default function MainMenu() {
    const user = useMemo(() => { return getCurrenUser() }, []);
    const navigate = useNavigate();
    //const [currentUser, setCurrentUser] = useState<User | null>(user);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [filteredItems, setFilteredItems] = useState<any>(null);
    // Restrict search to titles/names only (persisted preference, on by default).
    const [titlesOnly, setTitlesOnly] = useState<boolean>(
        () => localStorage.getItem('searchTitlesOnly') !== '0');
    const [lastQuery, setLastQuery] = useState<string>('');
    // Term just sent to the results page with Enter: its suggestion search
    // (debounced, so it may still be pending) must not pop up over the page.
    const submittedTerm = useRef<string | null>(null);
    const [loginVisible, setLoginVisible] = useState(false);
    const [registerVisible, setRegisterVisible] = useState(false);
    const [workFormVisible, setWorkFormVisible] = useState(false);
    const [personFormVisible, setPersonFormVisible] = useState(false);
    // Path to navigate to once the corresponding creation dialog has closed.
    const [pendingNav, setPendingNav] = useState<string | null>(null);

    // Re-run the current search when the titles-only toggle changes.
    useEffect(() => {
        if (lastQuery.trim().length >= SEARCH_MIN_LENGTH) {
            getApiContent("search/" + lastQuery + (titlesOnly ? "?titles=1" : ""), user)
                .then(r => setFilteredItems(r.data))
                .catch(() => { });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [titlesOnly]);

    const onHide = () => {
        setLoginVisible(false);
    }

    // The forms are told not to self-navigate (navigateOnSuccess={false}) and
    // instead hand us the new item id. The Dialog is a React portal that lives
    // in this (route-persistent) menu; navigating while it is still mounted —
    // or unmounting it after the route has already changed — throws a portal
    // "removeChild" error that blanks the target page. So we close the dialog
    // first and record where to go; the navigation happens in the effect below,
    // which runs only after the dialog has actually unmounted.
    const workFormCallback = (status: boolean, message: string) => {
        if (status && message) setPendingNav('/works/' + message);
        setWorkFormVisible(false);
    }
    const personFormCallback = (id?: string) => {
        if (id) setPendingNav('/people/' + id);
        setPersonFormVisible(false);
    }

    useEffect(() => {
        if (pendingNav && !workFormVisible && !personFormVisible) {
            const target = pendingNav;
            setPendingNav(null);
            navigate(target);
        }
    }, [pendingNav, workFormVisible, personFormVisible, navigate]);
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
                    label: 'Kirjaehdotukset',
                    url: '/suggestions',
                    target: '_blank'
                },
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
                {
                    label: 'Tietokirjat',
                    url: '/nonfiction'
                }
            ]
        },
        {
            // Icon-only for visitors: the label is visually hidden but names the
            // item for screen readers (PrimeReact uses it as aria-label).
            label: 'Käyttäjätili',
            className: 'icon-only-menuitem',
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
            label: 'Muut',
            items: [
                {
                    label: 'Kirjaehdotukset',
                    url: '/suggestions',
                    target: '_blank'
                },
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
                {
                    label: 'Tietokirjat',
                    url: '/nonfiction'
                },
                {
                    label: 'Tilastot',
                    url: '/stats'
                }
            ]
        },
        ...(user?.role === 'admin' ? [{
            label: 'Ylläpito',
            icon: 'fa-solid fa-screwdriver-wrench',
            items: [
                {
                    label: 'Uusi teos',
                    icon: 'fa-solid fa-book',
                    command: () => {
                        setWorkFormVisible(true);
                    }
                },
                {
                    label: 'Uusi henkilö',
                    icon: 'fa-solid fa-user',
                    command: () => {
                        setPersonFormVisible(true);
                    }
                },
                {
                    label: 'Ylläpitotyökalut',
                    icon: 'fa-solid fa-list-check',
                    url: '/admin'
                }
            ]
        }] : []),
        {
            label: userName(),
            icon: 'fa-solid fa-circle-user',
            items: [
                {
                    label: 'Käyttäjät',
                    url: '/users'
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
            const response = await getApiContent(
                "search/" + query + (titlesOnly ? "?titles=1" : ""), user);
            setFilteredItems(response.data);
        }
        const searchItems = (event: any) => {
            if (submittedTerm.current === event.query) {
                // New (empty) suggestions end the AutoComplete's loading spinner.
                setFilteredItems([]);
                return;
            }
            setLastQuery(event.query);
            getResults(event.query);
        };

        const itemTemplate = (item: SearchItem) => (
            <div className="searchItem">
                <i className={`fa ${searchItemIcon(item.type)}`}></i>&nbsp;
                <span className="searchItemHeader">{item.header}</span>
                {item.author && (
                    <span className="searchItemAuthor">
                        :&nbsp;{item.author}
                    </span>
                )}
                {item.description && (
                    <div className="searchItemContents">
                        {searchItemText(item.description)}
                    </div>
                )}
            </div>
        );

        const selectItem = (item: SearchItem) => {
            const path = searchItemPath(item);
            if (path) window.open(import.meta.env.VITE_SITE_URL + path.slice(1), "_self");
            setSelectedItem(null);
        }

        // Enter on typed text (not on a highlighted suggestion, which the
        // AutoComplete opens itself and marks with preventDefault) opens the
        // full results page.
        const onSearchKeyDown = (e: React.KeyboardEvent) => {
            if (e.key !== 'Enter' || e.defaultPrevented) return;
            const term = typeof selectedItem === 'string' ? selectedItem.trim() : '';
            if (term.length < SEARCH_MIN_LENGTH) return;
            e.preventDefault();
            submittedTerm.current = term;
            setSelectedItem(null);
            setFilteredItems(null);
            navigate(searchResultsPath(term, titlesOnly));
        };

        return (
            <div className="relative w-full" onKeyDown={onSearchKeyDown}>
                <AutoComplete
                    className="w-full"
                    inputClassName="w-full"
                    placeholder="Etsi"
                    minLength={SEARCH_MIN_LENGTH}
                    onChange={(e) => {
                        if (typeof e.value === 'string') submittedTerm.current = null;
                        setSelectedItem(e.value);
                    }}
                    onSelect={(e) => selectItem(e.value)}
                    completeMethod={searchItems}
                    value={selectedItem}
                    suggestions={filteredItems}
                    field="header"
                    itemTemplate={itemTemplate}
                    delay={800}
                    scrollHeight="400px"
                    inputStyle={{ paddingRight: '5rem' }}
                />
                <span
                    className="absolute flex align-items-center gap-1 white-space-nowrap text-600"
                    style={{ right: '0.5rem', top: '50%', transform: 'translateY(-50%)' }}
                >
                    <Checkbox
                        inputId="searchTitlesOnly"
                        checked={titlesOnly}
                        className="search-titles-checkbox"
                        onChange={(e) => {
                            const val = !!e.checked;
                            setTitlesOnly(val);
                            localStorage.setItem('searchTitlesOnly', val ? '1' : '0');
                        }}
                    />
                    <label htmlFor="searchTitlesOnly" className="text-xs cursor-pointer">Vain nimet</label>
                </span>
            </div>
        );
    }
    return (
        <nav aria-label="Päävalikko">
            <Dialog visible={loginVisible} onHide={() => onHide()}
                breakpoints={{ '960px': '75vw', '640px': '100vw' }} style={{ width: '50vw' }}
            >
                <Suspense fallback={dialogFallback}><LoginView /></Suspense>
            </Dialog>
            <Dialog visible={registerVisible} onHide={() => setRegisterVisible(false)}
                breakpoints={{ '960px': '75vw', '640px': '100vw' }} style={{ width: '50vw' }}
            >
                <Suspense fallback={dialogFallback}><RegisterView /></Suspense>
            </Dialog>
            {workFormVisible &&
                <Dialog maximizable blockScroll
                    className="w-full lg:w-6"
                    header="Uusi teos" visible={true}
                    onHide={() => setWorkFormVisible(false)}
                >
                    <Suspense fallback={dialogFallback}><WorkForm workId={null} onSubmitCallback={workFormCallback} navigateOnSuccess={false} /></Suspense>
                </Dialog>
            }
            {personFormVisible &&
                <Dialog maximizable blockScroll
                    className="w-full lg:w-6"
                    header="Uusi henkilö" visible={true}
                    onHide={() => setPersonFormVisible(false)}
                >
                    <Suspense fallback={dialogFallback}><PersonForm data={null} onSubmitCallback={personFormCallback} navigateOnSuccess={false} /></Suspense>
                </Dialog>
            }

            <Menubar className="navbar-dark" model={user === null ? not_logged_items : logged_items} start={start} end={End} />
        </nav>
    );
}
