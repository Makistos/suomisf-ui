import { useState, useEffect, StrictMode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      // Without this, refetchOnWindowFocus refires for data that was just
      // fetched a moment ago (e.g. alt-tab and back) since staleTime
      // otherwise defaults to 0. A minute is enough to absorb that without
      // meaningfully delaying genuinely stale data from refreshing.
      staleTime: 60 * 1000,
      // A 4xx (missing record, bad id) won't succeed on retry; retrying it
      // only delayed the not-found message by several seconds. Server and
      // network errors still get the default three retries.
      retry: (failureCount, error) => {
        const status = isAxiosError(error) ? error.response?.status : undefined;
        if (status !== undefined && status >= 400 && status < 500) return false;
        return failureCount < 3;
      },
    }
  }
});

import PrimeReact, { locale, addLocale } from 'primereact/api';
import 'primereact/resources/primereact.min.css'
import "primeflex/primeflex.css";
import "@fortawesome/fontawesome-free/css/all.css";

import './App.css';

import MainMenu from './components/mainmenu';
//import { useDocumentTitle } from './components/document-title';

// Screen reader labels of PrimeReact's own controls (paginator, dialog
// close, row expanders, ...). Without these the English ones are used.
// A separate constant: PrimeReact's type lacks some keys it reads.
const finnishAria = {
  cancelEdit: 'Peruuta muokkaus',
  close: 'Sulje',
  collapseRow: 'Rivi suljettu',
  editRow: 'Muokkaa riviä',
  expandRow: 'Rivi avattu',
  // DataTable's row group togglers and selection boxes ask for these,
  // which PrimeReact's own locales lack (no name at all, in any language).
  expandLabel: 'Avaa ryhmä',
  collapseLabel: 'Sulje ryhmä',
  selectLabel: 'Valitse rivi',
  unselectLabel: 'Poista rivin valinta',
  falseLabel: 'Epätosi',
  filterConstraint: 'Suodatusehto',
  filterOperator: 'Suodatusoperaattori',
  firstPageLabel: 'Ensimmäinen sivu',
  gridView: 'Ruudukkonäkymä',
  hideFilterMenu: 'Piilota suodatusvalikko',
  jumpToPageDropdownLabel: 'Siirry sivulle',
  jumpToPageInputLabel: 'Siirry sivulle',
  lastPageLabel: 'Viimeinen sivu',
  listView: 'Luettelonäkymä',
  moveAllToSource: 'Siirrä kaikki lähteeseen',
  moveAllToTarget: 'Siirrä kaikki kohteeseen',
  moveBottom: 'Siirrä viimeiseksi',
  moveDown: 'Siirrä alas',
  moveToSource: 'Siirrä lähteeseen',
  moveToTarget: 'Siirrä kohteeseen',
  moveTop: 'Siirrä ensimmäiseksi',
  moveUp: 'Siirrä ylös',
  navigation: 'Navigointi',
  next: 'Seuraava',
  nextPageLabel: 'Seuraava sivu',
  nullLabel: 'Ei valittu',
  pageLabel: 'Sivu {page}',
  otpLabel: 'Anna kertakäyttösalasanan merkki {0}',
  passwordHide: 'Piilota salasana',
  passwordShow: 'Näytä salasana',
  previous: 'Edellinen',
  previousPageLabel: 'Edellinen sivu',
  rotateLeft: 'Käännä vasemmalle',
  rotateRight: 'Käännä oikealle',
  rowsPerPageLabel: 'Rivejä sivulla',
  saveEdit: 'Tallenna muokkaus',
  scrollTop: 'Vieritä ylös',
  selectAll: 'Kaikki valittu',
  selectRow: 'Rivi valittu',
  showFilterMenu: 'Näytä suodatusvalikko',
  slide: 'Dia',
  slideNumber: '{slideNumber}',
  star: '1 tähti',
  stars: '{star} tähteä',
  trueLabel: 'Tosi',
  unselectAll: 'Valinnat poistettu',
  unselectRow: 'Rivin valinta poistettu',
  zoomImage: 'Suurenna kuva',
  zoomIn: 'Lähennä',
  zoomOut: 'Loitonna',
};

// Screen reader fixes for PrimeReact components, set once for all uses.
PrimeReact.pt = {
  // Loading indicators have no text (44 places use ProgressSpinner).
  progressspinner: { root: { 'aria-label': 'Ladataan' } },
  progressbar: { root: { 'aria-label': 'Ladataan' } },
  // An icon-only button with a tooltip is named by its tooltip.
  button: {
    root: (options) => {
      const props = options?.props;
      return !props || props.label || props['aria-label'] || typeof props.tooltip !== 'string'
        ? {} : { 'aria-label': props.tooltip };
    },
  },
  // The maximise button of dialogs has no label of its own.
  dialog: { maximizableButton: { 'aria-label': 'Suurenna tai palauta' } },
  speeddial: {
    // The only SpeedDial use is the admin actions button.
    button: { root: { 'aria-label': 'Ylläpitotoiminnot' } },
    // PrimeReact makes both the list item and its link a menuitem, and
    // points the item at an element that doesn't exist.
    menuitem: { role: 'none', 'aria-controls': undefined },
  },
};

function App() {
  const location = useLocation();

  useEffect(() => {
    document.body.classList.remove('p-overflow-hidden');
    // Remove only orphaned masks. A mask React still owns (e.g. a
    // ConfirmDialog mid-close when its accept handler navigates) will be
    // removed by React itself; deleting it here made React's own
    // removeChild throw and take down the whole app. React drops its
    // __reactFiber$ key from a node once it has unmounted it.
    document.querySelectorAll('.p-dialog-mask, .p-speeddial-mask').forEach(el => {
      if (!Object.keys(el).some(key => key.startsWith('__reactFiber$'))) el.remove();
    });
  }, [location.pathname]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}p`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: location.pathname }),
      keepalive: true,
      credentials: 'omit',
    });
  }, [location.pathname]);

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
    //firstDayofWeek: 1,
    dateFormat: 'dd/mm/yy',
    weak: 'Heikko',
    medium: 'Keskiverto',
    strong: 'Vahva',
    passwordPrompt: 'Syötä salasana',
    emptyFilterMessage: 'Ei tuloksia',
    emptyMessage: 'Ei tuloksia',
    // Close buttons of dialogs, toasts, overlays etc. read this; no
    // PrimeReact locale has it, so they had no name.
    close: 'Sulje',
    aria: finnishAria,
  });

  locale('fi');

  const [title] = useState("SF-Bibliografia");

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
          <StrictMode>
            <Outlet />
          </StrictMode>
        </div>
      </div >
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
