import React from 'react';
//import 'primereact/resources/primereact.min.css'
import './App.css';
import MainMenu from './Mainmenu';
import { Outlet, useNavigate } from 'react-router-dom';

function App() {

  return (
    <div className="App container">
      <div className="p-mb-3">
        <MainMenu />
      </div>
      <div>
        <Outlet />
      </div>
    </div >
  );
}

export default App;
