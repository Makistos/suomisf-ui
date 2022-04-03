import React from 'react';
//import "primereact/resources/themes/bootstrap4-light-blue/theme.css";
//import 'primereact/resources/primereact.min.css'
import { Menubar } from 'primereact/menubar';
import { InputText } from 'primereact/inputtext';
import { getCurrenUser } from './services/auth-service';
import { logout } from './services/auth-service';

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
const end = <InputText placeholder="Etsi" type="text" />;

export default function MainMenu({ }) {
    let user = getCurrenUser();
    let items = common_items;

    if (user === null) {
        items.push(not_logged_items[0]);
        return (
            <Menubar className="navbar-dark" model={items} start={start} end={end} />
        );
    }
    switch (user.role) {
        case "user":
        case "admin":
        case "demo_admin":
            {
                items.push(logged_items[0]);
                break;
            }
    }
    return (
        <Menubar className="navbar-dark" model={items} start={start} end={end} />
    );
}
