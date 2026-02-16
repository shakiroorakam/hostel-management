import { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import MarkViolation from './pages/MarkViolation';
import Records from './pages/Records';
import StudentDetail from './pages/StudentDetail';
import ManageStudents from './pages/ManageStudents';
import Dashboard from './pages/Dashboard';

function Toast({ message, type }) {
  if (!message) return null;
  return (
    <div className="toast-container">
      <div className={`toast toast-${type}`}>{message}</div>
    </div>
  );
}

function App() {
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  }, []);

  return (
    <Router>
      <div className="app">
        <Toast message={toast.message} type={toast.type} />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mark" element={<MarkViolation showToast={showToast} />} />
          <Route path="/records" element={<Records showToast={showToast} />} />
          <Route path="/records/:studentId" element={<StudentDetail showToast={showToast} />} />
          <Route path="/students" element={<ManageStudents showToast={showToast} />} />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
