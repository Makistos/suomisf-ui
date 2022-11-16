import ReactDOM from 'react-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import "primereact/resources/themes/mdc-light-indigo/theme.css";
import 'primereact/resources/primereact.min.css'

import App from './App';
import reportWebVitals from './reportWebVitals';
import Magazines from './features/Magazine/Magazines';
import Magazine from './features/Magazine/Magazine';
import { ArticleView } from './features/Article/Article';
import { Issue } from './features/Issue/Issue';
import { PeoplePage, PersonPage } from './features/person';
import { WorkPage } from './features/work';
import Login from './features/User/Login';
import { Bookseries } from './components/Bookseries';
import { Pubseries } from './components/Pubseries';
import { PublisherPage } from './features/publisher/routes/publisher-page';
import { PublisherListPage } from './features/publisher/routes/publisher-list-page';
import { BookseriesListing } from './BookseriesListing';
import { PubseriesListing } from './PubseriesListing';
import { ShortSearch } from './features/Short/ShortsSearch';
import { BookSearch } from './BookSearch';
import { SFTag } from './components/Tag/SFTag';
import { SFTags } from './components/Tag/SFTags';
import { Awards } from './features/Award/Awards'

const rootElement = document.getElementById("root");

ReactDOM.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route path="awards" element={<Awards />} />
        <Route path="bookindex" element={<BookSearch />} />
        <Route path="shortstoryindex" element={<ShortSearch />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="people/:personId" element={<PersonPage />} />
        <Route path="magazines" element={<Magazines />} />
        <Route path="magazines/:magazineId" element={<Magazine />} />
        <Route path="issues/:issueId" element={<Issue id={null} />} />
        <Route path="articles/:articleId" element={<ArticleView id={null} />} />
        <Route path="works/:workId" element={<WorkPage />} />
        <Route path="bookseries" element={<BookseriesListing />} />
        <Route path="bookseries/:bookseriesId" element={<Bookseries />} />
        <Route path="pubseries" element={<PubseriesListing />} />
        <Route path="pubseries/:bookseriesId" element={<Pubseries />} />
        <Route path="publishers/:publisherId" element={<PublisherPage />} />
        <Route path="publishers" element={<PublisherListPage />} />
        <Route path="tags" element={<SFTags />} />
        <Route path="tags/:tagid" element={<SFTag />} />
        <Route path="/login" element={<Login />} />
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
