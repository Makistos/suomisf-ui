import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import "primereact/resources/themes/mdc-light-indigo/theme.css";
import 'primereact/resources/primereact.min.css'

import App from './App';
import reportWebVitals from './reportWebVitals';
import MagazinesPage from './features/magazine/routes/magazines-page';
import MagazinePage from './features/magazine/routes/magazine-page';
import { ArticleView } from './features/article/routes/article-page';
import { IssuePage } from './features/issue/routes/issue-page';
import { PeoplePage, PersonPage } from './features/person';
import { WorkPage } from './features/work';
import LoginView from './features/user/components/login-view';
import { BookseriesPage } from './features/bookseries/routes/bookseries-page';
import { PubseriesPage } from './features/pubseries/routes/pubseries-page';
import { PublisherPage } from './features/publisher/routes/publisher-page';
import { PublisherListPage } from './features/publisher/routes/publisher-list-page';
import { BookseriesListPage } from './features/bookseries/routes/bookseries-list-page';
import { PubseriesListPage } from './features/pubseries/routes/pubseries-list-page';
import { ShortSearchPage } from './features/short/routes/short-search-page';
import { WorkSearchPage } from './features/work/routes/work-search';
import { SFTag } from './features/tag/components/sftag';
import { SFTags } from './features/tag/routes/sftags-page';
import { Awards } from './features/award/routes/awards-page'

const rootElement = document.getElementById("root");

ReactDOM.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route path="awards" element={<Awards />} />
        <Route path="bookindex" element={<WorkSearchPage />} />
        <Route path="shortstoryindex" element={<ShortSearchPage />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="people/:personId" element={<PersonPage id={null} />} />
        <Route path="magazines" element={<MagazinesPage />} />
        <Route path="magazines/:magazineId" element={<MagazinePage />} />
        <Route path="issues/:issueId" element={<IssuePage id={null} />} />
        <Route path="articles/:articleId" element={<ArticleView id={null} />} />
        <Route path="works/:workId" element={<WorkPage id={null} />} />
        <Route path="bookseries" element={<BookseriesListPage />} />
        <Route path="bookseries/:itemId" element={<BookseriesPage id={null} />} />
        <Route path="pubseries" element={<PubseriesListPage />} />
        <Route path="pubseries/:itemId" element={<PubseriesPage id={null} />} />
        <Route path="publishers/:itemId" element={<PublisherPage id={null} />} />
        <Route path="publishers" element={<PublisherListPage />} />
        <Route path="tags" element={<SFTags />} />
        <Route path="tags/:tagid" element={<SFTag />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="*"
          element={
            <main style={{ padding: "3rem" }}>
              Työn alla...
            </main>
          } />
      </Route>
    </Routes>
  </BrowserRouter>,
  rootElement);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
