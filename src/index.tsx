import React from 'react';
import ReactDOM from 'react-dom';
// import "primereact/resources/themes/bootstrap4-light-blue/theme.css";
// import 'primereact/resources/primereact.min.css'
// import 'primeicons/primeicons.css';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Magazines from './Magazines';
import Magazine from './Magazine';
import { ArticleView } from './components/Article';
import { Issue } from './Issue';
import { People } from './People';
import { Person } from './components/Person';
import Login from './components/Login';

const rootElement = document.getElementById("root");

ReactDOM.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route path="people" element={<People />} />
        <Route path="people/:personId" element={<Person />} />
        <Route path="magazines" element={<Magazines />} />
        <Route path="magazines/:magazineId" element={<Magazine />} />
        <Route path="issues/:issueId" element={<Issue id={null} />} />
        <Route path="articles/:articleId" element={<ArticleView id={null} />} />
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
