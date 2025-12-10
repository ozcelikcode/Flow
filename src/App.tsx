import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TransactionProvider, useTransactions } from './context/TransactionContext';
import { SettingsProvider } from './context/SettingsContext';
import { CategoryProvider } from './context/CategoryContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';
import TransactionModal from './components/dashboard/TransactionModal';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/Transactions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Categories from './pages/Categories';
import Upcoming from './pages/Upcoming';
import History from './pages/History';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function AppContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addTransaction } = useTransactions();

  return (
    <Layout onAddTransactionClick={() => setIsModalOpen(true)}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/upcoming" element={<Upcoming />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(tx) => {
          addTransaction(tx);
          setIsModalOpen(false);
        }}
      />
    </Layout>
  );
}

function ProtectedApp() {
  return (
    <ProtectedRoute>
      <TransactionProvider>
        <AppContent />
      </TransactionProvider>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <CategoryProvider>
          <ToastProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/*" element={<ProtectedApp />} />
              </Routes>
            </Router>
          </ToastProvider>
        </CategoryProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
