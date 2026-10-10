import GetTicketPage from './pages/GetTicketPage';
import {LoginPage} from './pages/LoginPage';
import CashierPage from './pages/CashierPage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from "react";

function App() {

  const [cashier, setCashier] = useState(null)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GetTicketPage />} />
        <Route path="/login" element={<LoginPage onLogin={setCashier}/>}/>
        <Route path="/cashier/:cashierId" element={<CashierPage cashierId= {cashier?.cId}/>}/>
        <Route path="*" element="Invalid path"/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;