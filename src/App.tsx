import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TransactionProvider, useTransactions } from './context/TransactionContext';
import Layout from './components/layout/Layout';
import AddTransactionModal from './components/dashboard/AddTransactionModal';
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/Transactions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function AppContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addTransaction } = useTransactions();

  return (
    <Layout onAddTransactionClick={() => setIsModalOpen(true)}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={(tx) => {
          addTransaction(tx);
          setIsModalOpen(false); // Close after add is safer or keep open? standard is close.
        }}
      />
    </Layout>
  );
}

export default function App() {
  return (
    <TransactionProvider>
      <Router>
        <AppContent />
      </Router>
    </TransactionProvider>
  );
}
