import ReactDOM from 'react-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import "primereact/resources/themes/mdc-light-indigo/theme.css";
import 'primereact/resources/primereact.min.css'

import App from './App';
import reportWebVitals from './reportWebVitals';
import Magazines from './feature/Magazine/Magazines';
import Magazine from './feature/Magazine/Magazine';
import { ArticleView } from './feature/Article/Article';
import { Issue } from './feature/Issue/Issue';
import { People } from './feature/Person/People';
import { Person } from './feature/Person/Person';
import { WorkPage } from './feature/work/routes/work-page';
import Login from './feature/User/Login';
import { Bookseries } from './components/Bookseries';
import { Pubseries } from './components/Pubseries';
import { Publisher } from './feature/Publisher/Publisher';
import { PublisherList } from './feature/Publisher/PublisherList';
import { BookseriesListing } from './BookseriesListing';
import { PubseriesListing } from './PubseriesListing';
import { ShortSearch } from './feature/Short/ShortsSearch';
import { BookSearch } from './BookSearch';
import { SFTag } from './components/Tag/SFTag';
import { SFTags } from './components/Tag/SFTags';
import { Awards } from './feature/Award/Awards'

const rootElement = document.getElementById("root");

ReactDOM.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route path="awards" element={<Awards />} />
        <Route path="bookindex" element={<BookSearch />} />
        <Route path="shortstoryindex" element={<ShortSearch />} />
        <Route path="people" element={<People />} />
        <Route path="people/:personId" element={<Person />} />
        <Route path="magazines" element={<Magazines />} />
        <Route path="magazines/:magazineId" element={<Magazine />} />
        <Route path="issues/:issueId" element={<Issue id={null} />} />
        <Route path="articles/:articleId" element={<ArticleView id={null} />} />
        <Route path="works/:workId" element={<WorkPage />} />
        <Route path="bookseries" element={<BookseriesListing />} />
        <Route path="bookseries/:bookseriesId" element={<Bookseries />} />
        <Route path="pubseries" element={<PubseriesListing />} />
        <Route path="pubseries/:bookseriesId" element={<Pubseries />} />
        <Route path="publishers/:publisherId" element={<Publisher />} />
        <Route path="publishers" element={<PublisherList />} />
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
