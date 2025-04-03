import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import BudgetForm from '../components/BudgetForm';
import BudgetProgress from '../components/BudgetProgress';
import { getCategoryData } from '../utils/transactions';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function Budget() {
  const [budgets, setBudgets] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch budgets
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribeBudgets = onSnapshot(
      collection(db, 'budgets', auth.currentUser.uid, 'userBudgets'),
      (snapshot) => {
        const data = snapshot.docs.reduce((acc, doc) => {
          acc[doc.id] = doc.data().amount;
          return acc;
        }, {});
        setBudgets(data);
        setLoading(false);
      },
      (err) => {
        console.error('Budget load error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribeBudgets();
  }, []);

  // Fetch transactions for spending calculations
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribeTransactions = onSnapshot(
      collection(db, 'transactions', auth.currentUser.uid, 'userTransactions'),
      (snapshot) => {
        setTransactions(snapshot.docs.map(d => ({ ...d.data() })));
      }
    );

    return () => unsubscribeTransactions();
  }, []);

  const categorySpending = getCategoryData(transactions).reduce((acc, item) => {
    acc[item.name] = item.value;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-12">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Budget Management</h1>
        <p className="mt-2 text-gray-600">Set spending limits and track your progress towards financial goals</p>
      </header>
      
      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.keys(categorySpending).length > 0 ? (
          Object.keys(categorySpending).map((category) => (
            <div key={category} className="bg-white p-6 rounded-lg shadow-md border border-gray-100 transform transition-transform duration-300 hover:shadow-lg">
              <div className="flex items-center mb-4">
                <ChartBarIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">{category}</h2>
              </div>
              
              <BudgetProgress
                category={category}
                spent={categorySpending[category] || 0}
                budget={budgets[category] || 0}
              />
              
              <div className="mt-6">
                <BudgetForm
                  category={category}
                  currentBudget={budgets[category]}
                  onSuccess={() => setLoading(false)}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white p-8 rounded-lg shadow-md border border-gray-100 text-center">
            <ChartBarIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No spending categories found</h3>
            <p className="text-gray-600 mb-6">Start adding transactions to see your budget categories.</p>
            <a 
              href="/transactions" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Add Transactions
            </a>
          </div>
        )}
      </div>
      
      {/* Budget Tips Section */}
      {Object.keys(categorySpending).length > 0 && (
        <div className="mt-12 bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Budget Tips</h3>
          <ul className="list-disc pl-5 space-y-2 text-blue-800">
            <li>Aim to keep essential expenses (housing, food, utilities) under 50% of your income</li>
            <li>The 50/30/20 rule suggests: 50% needs, 30% wants, 20% savings</li>
            <li>Review and adjust your budgets monthly as your spending patterns change</li>
          </ul>
        </div>
      )}
    </div>
  );
}