import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AddEditStudent from './pages/AddEditStudent';
import Toast from './components/Toast';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard addToast={addToast} />} />
          <Route path="/add" element={<AddEditStudent addToast={addToast} />} />
          <Route path="/edit/:id" element={<AddEditStudent addToast={addToast} />} />
        </Routes>
      </main>
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
