import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { locale, addLocale } from 'primereact/api';
import 'primereact/resources/primereact.min.css'
import "primeflex/primeflex.css";
import "@fortawesome/fontawesome-free/css/all.css";

import './App.css';
import MainMenu from './components/mainmenu';
//import { useDocumentTitle } from './components/document-title';

function App() {
  addLocale('fi', {
    startsWith: 'Teksti alkaa',
    contains: 'Sisältää',
    notContains: 'Ei sisällä',
    endsWith: 'Teksti loppuu',
    equals: 'Yhtä kuin',
    notEquals: 'Eri kuin',
    noFilter: 'Ei suodatinta',
    lt: 'Pienempi kuin',
    lte: 'Pienempi tai yhtä kuin',
    gt: 'Suurempi kuin',
    gte: 'Suurempi tai yhtä kuin',
    dateIs: 'Päiväys on',
    dateBefore: 'Päiväys ennen',
    dateAfter: 'Päiväys jälkeen',
    custom: 'Mukautettu',
    clear: 'Tyhjennä',
    apply: 'Aseta',
    matchAll: 'Täsmää kaikki',
    matchAny: 'Täsmää jokin',
    addRule: 'Lisää sääntö',
    removeRule: 'Poista sääntö',
    accept: 'Kyllä',
    reject: 'Ei',
    choose: 'Valitse',
    upload: 'Lataa',
    cancel: 'Peruuta',
    dayNames: ['Sunnuntai', 'Maanantai', 'Tiistai', 'Keskiviikko', 'Torstai', 'Perjantai', 'Lauantai'],
    dayNamesShort: ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La'],
    dayNamesMin: ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La'],
    monthNames: ['Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu', 'Heinäkuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu'],
    monthNamesShort: ['Tam', 'Hel', 'Maa', 'Huh', 'Tou', 'Kes', 'Hei', 'Elo', 'Syy', 'Lok', 'Mar', 'Jou'],
    today: 'Tänään',
    weekHeader: 'Vko',
    firstDayofWeek: 1,
    dateFormat: 'dd/mm/yy',
    weak: 'Heikko',
    medium: 'Keskiverto',
    strong: 'Vahva',
    passwordPrompt: 'Syötä salasana',
    emptyFilterMessage: 'Ei tuloksia',
    emptyMessage: 'Ei tuloksia'
  });

  locale('fi');

  const queryClient = new QueryClient();
  const [title, setTitle] = useState("SF-Bibliografia");

  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="App container grid">
        <div className="grid col-12 justify-content-start">
          <MainMenu />
        </div>
        <div className="grid col-12 justify-content-center">
          <Outlet />
        </div>
      </div >
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
