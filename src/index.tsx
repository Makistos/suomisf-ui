import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';

import 'primereact/resources/primereact.min.css'

import App from './App';
import reportWebVitals from './reportWebVitals';
import HomeAlt from './home-alt';

// Every route other than the shell (App) and the landing page (HomeAlt,
// kept eager so first paint has no loading flash) is code-split into its
// own chunk, loaded on demand. Before this the whole app — every stats
// chart, every admin form, every rarely-visited page — shipped in one
// 2.58 MB main bundle regardless of which page a visitor landed on.
const MagazinesPage = lazy(() => import('./features/magazine/routes/magazines-page').then(m => ({ default: m.MagazinesPage })));
const MagazinePage = lazy(() => import('./features/magazine/routes/magazine-page').then(m => ({ default: m.MagazinePage })));
const ArticleView = lazy(() => import('./features/article/routes/article-page').then(m => ({ default: m.ArticleView })));
const IssuePage = lazy(() => import('./features/issue/routes/issue-page').then(m => ({ default: m.IssuePage })));
const PeoplePage = lazy(() => import('./features/person').then(m => ({ default: m.PeoplePage })));
const PersonPage = lazy(() => import('./features/person').then(m => ({ default: m.PersonPage })));
const WorkPage = lazy(() => import('./features/work').then(m => ({ default: m.WorkPage })));
const LoginView = lazy(() => import('./features/user/components/login-view'));
const ForgotPasswordView = lazy(() => import('./features/user/components/forgot-password-view').then(m => ({ default: m.ForgotPasswordView })));
const ResetPasswordView = lazy(() => import('./features/user/components/reset-password-view').then(m => ({ default: m.ResetPasswordView })));
const BookseriesPage = lazy(() => import('./features/bookseries/routes/bookseries-page').then(m => ({ default: m.BookseriesPage })));
const PubseriesPage = lazy(() => import('./features/pubseries/routes/pubseries-page').then(m => ({ default: m.PubseriesPage })));
const PublisherPage = lazy(() => import('./features/publisher/routes/publisher-page').then(m => ({ default: m.PublisherPage })));
const PublisherListPage = lazy(() => import('./features/publisher/routes/publisher-list-page').then(m => ({ default: m.PublisherListPage })));
const BookseriesListPage = lazy(() => import('./features/bookseries/routes/bookseries-list-page').then(m => ({ default: m.BookseriesListPage })));
const PubseriesListPage = lazy(() => import('./features/pubseries/routes/pubseries-list-page').then(m => ({ default: m.PubseriesListPage })));
const ShortSearchPage = lazy(() => import('./features/short/routes/short-search-page').then(m => ({ default: m.ShortSearchPage })));
const WorkSearchPage = lazy(() => import('./features/work/routes/work-search').then(m => ({ default: m.WorkSearchPage })));
const SFTag = lazy(() => import('./features/tag/routes/sftag').then(m => ({ default: m.SFTag })));
const SFTags = lazy(() => import('./features/tag/routes/sftags-page').then(m => ({ default: m.SFTags })));
const Awards = lazy(() => import('./features/award/routes/awards-page').then(m => ({ default: m.Awards })));
const AwardPage = lazy(() => import('./features/award/routes/award-page').then(m => ({ default: m.AwardPage })));
const Changes = lazy(() => import('./features/changes/routes/changes-page').then(m => ({ default: m.Changes })));
const LatestAdditions = lazy(() => import('./features/latest/routes/latest-additions').then(m => ({ default: m.LatestAdditions })));
const FAQ = lazy(() => import('faq').then(m => ({ default: m.FAQ })));
const ProfilePage = lazy(() => import('@features/user/routes/profile-page'));
const ShortPage = lazy(() => import('@features/short/routes/short-page').then(m => ({ default: m.ShortPage })));
const WorksByType = lazy(() => import('@features/work/routes/works-by-type').then(m => ({ default: m.WorksByType })));
const StatsPage = lazy(() => import('@features/stats').then(m => ({ default: m.StatsPage })));
const SuggestionPage = lazy(() => import('@features/suggestion').then(m => ({ default: m.SuggestionPage })));

// console.log(process.env)

const container = document.getElementById('root')!;

const root = createRoot(container);

const routeFallback = (
  <main className="flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
    <ProgressSpinner style={{ width: '50px', height: '50px' }} />
  </main>
);

root.render(
  <BrowserRouter>
    <Suspense fallback={routeFallback}>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HomeAlt />} />
          <Route path="awards" element={<Awards />} />
          <Route path="awards/:itemId" element={<AwardPage id={null} />} />
          <Route path="bookindex" element={<WorkSearchPage />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="shortstoryindex" element={<ShortSearchPage />} />
          <Route path="people" element={<PeoplePage />} />
          <Route path="people/:itemId" element={<PersonPage id={null} />} />
          <Route path="magazines" element={<MagazinesPage />} />
          <Route path="magazines/:magazineId" element={<MagazinePage />} />
          <Route path="issues/:itemId" element={<IssuePage id={null} />} />
          <Route path="articles/:articleId" element={<ArticleView id={null} />} />
          <Route path="works/:itemId" element={<WorkPage />} />
          <Route path="editions/:itemId" element={<WorkPage />} />
          <Route path="bookseries" element={<BookseriesListPage />} />
          <Route path="bookseries/:itemId" element={<BookseriesPage id={null} />} />
          <Route path="pubseries" element={<PubseriesListPage />} />
          <Route path="pubseries/:itemId" element={<PubseriesPage id={null} />} />
          <Route path="publishers/:itemId" element={<PublisherPage id={null} />} />
          <Route path="publishers" element={<PublisherListPage />} />
          <Route path="shorts/:itemId" element={<ShortPage id={null} />} />
          <Route path="tags" element={<SFTags />} />
          <Route path="tags/:tagid" element={<SFTag id={null} />} />
          <Route path="/login" element={<LoginView />} />
          <Route path="/forgot-password" element={<ForgotPasswordView />} />
          <Route path="/reset-password" element={<ResetPasswordView />} />
          <Route path="/changes" element={<Changes />} />
          <Route path="/latest" element={<LatestAdditions />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/nonfiction" element={<WorksByType worktype={"4"} />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/suggestions" element={<SuggestionPage />} />
          <Route path="/home-alt" element={<HomeAlt />} />
          <Route path="/users/:itemId" element={<ProfilePage id={null} />} />
          <Route path="*"
            element={
              <main style={{ padding: "3rem" }}>
                Sivua ei löydy. Tarkista osoite tai palaa <a href="/">etusivulle</a>.
              </main>
            } />
        </Route>
      </Routes>
    </Suspense>
  </BrowserRouter>);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
