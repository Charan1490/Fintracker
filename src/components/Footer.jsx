import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-white w-full">
      <div className="w-full max-w-screen-xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-400" />
            <span className="ml-2 text-xl font-bold">FinTracker</span>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-8 md:space-x-16 lg:space-x-24 text-center sm:text-left">
            <div className="px-4 sm:px-0">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-2">Features</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">Dashboard</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">Transactions</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">Budget</a></li>
              </ul>
            </div>
            
            <div className="px-4 sm:px-0">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-2">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">Help Center</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">Privacy</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">Terms</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-700">
          <p className="text-center text-gray-400 text-sm">
            &copy; {currentYear} FinTracker. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}