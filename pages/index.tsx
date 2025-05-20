import React, { useState } from 'react';
import Head from 'next/head';
import TxnTable, { Transaction } from '../components/TxnTable';

const Home: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setLoading(true);
    setError(null);
    setDebugInfo(null);
    setTransactions([]);

    try {
      setDebugInfo(`Selected file: ${file.name} (${file.type}), size: ${file.size} bytes`);

      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        setLoading(false);
        return;
      }

      // Read file as base64
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (!event.target?.result) {
          setError('Failed to read file content');
          setLoading(false);
          return;
        }
        
        try {
          const base64Content = (event.target.result as string).split(',')[1];
          setDebugInfo(prev => `${prev}\nFile read successfully, sending to API...`);
          
          // Send to API
          const response = await fetch('/api/parse', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ file: base64Content }),
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || `API error: ${response.status}`);
          }
          
          setDebugInfo(prev => `${prev}\nAPI response received with ${data.transactions?.length || 0} transactions`);
          
          if (data.transactions && data.transactions.length > 0) {
            setTransactions(data.transactions);
          } else {
            setError('No transactions found in the document');
          }
        } catch (err) {
          console.error('API error:', err);
          setError(err instanceof Error ? err.message : 'Failed to parse PDF');
          setDebugInfo(prev => `${prev}\nAPI error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
          setLoading(false);
        }
      };
      
      reader.onerror = (e) => {
        console.error('FileReader error:', e);
        setError('Failed to read file');
        setDebugInfo(prev => `${prev}\nFileReader error: ${e?.target?.error?.message || 'Unknown error'}`);
        setLoading(false);
      };
      
      reader.readAsDataURL(file);
      
    } catch (err) {
      console.error('General error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setDebugInfo(prev => `${prev}\nGeneral error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    
    const headers = ['Date', 'Vendor', 'Description', 'Debit', 'Credit', 'Currency', 'RON', 'RRN/REF'];
    
    const rows = transactions.map(txn => [
      new Date(txn.date).toLocaleDateString('ro-RO'),
      txn.vendor || '',
      txn.description,
      txn.debit,
      txn.credit,
      txn.currency,
      txn.amount_ron || '',
      txn.rrn || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const date = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `tranzactii-bt-${date}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyToClipboard = () => {
    if (transactions.length === 0) return;
    
    const headers = ['Date', 'Vendor', 'Description', 'Debit', 'Credit', 'Currency', 'RON', 'RRN/REF'];
    
    const rows = transactions.map(txn => [
      new Date(txn.date).toLocaleDateString('ro-RO'),
      txn.vendor || '',
      txn.description,
      txn.debit,
      txn.credit,
      txn.currency,
      txn.amount_ron || '',
      txn.rrn || ''
    ]);
    
    const tableContent = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t'))
    ].join('\n');
    
    navigator.clipboard.writeText(tableContent)
      .then(() => alert('Table data copied to clipboard'))
      .catch(() => alert('Failed to copy to clipboard'));
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  // For testing purposes - load sample data
  const loadSampleData = async () => {
    setLoading(true);
    setError(null);
    setDebugInfo('Loading sample data...');
    
    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file: 'sample' }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }
      
      setDebugInfo(prev => `${prev}\nSample data loaded with ${data.transactions?.length || 0} transactions`);
      
      if (data.transactions && data.transactions.length > 0) {
        setTransactions(data.transactions);
      } else {
        setError('No sample transactions found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <Head>
        <title>Banca Transilvania Statement Parser</title>
        <meta name="description" content="Parse Banca Transilvania PDF statements" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Banca Transilvania Statement Parser
              </h1>
              
              <button
                onClick={toggleDarkMode}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
            <div className="mb-4">
              <label 
                htmlFor="file-upload" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Upload PDF Statement
              </label>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  id="file-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0 file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <button
                  onClick={loadSampleData}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Load Sample Data
                </button>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4">
                <p className="font-medium">Error:</p>
                <p>{error}</p>
              </div>
            )}
            
            {loading && (
              <div className="text-center py-4">
                <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-2 text-gray-700 dark:text-gray-300">Procesare PDF...</p>
              </div>
            )}
            
            {debugInfo && (
              <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                <details>
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                    Debug Information
                  </summary>
                  <pre className="mt-2 text-xs whitespace-pre-wrap text-gray-700 dark:text-gray-300">{debugInfo}</pre>
                </details>
              </div>
            )}
          </div>

          {transactions.length > 0 && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Tranzacții ({transactions.length})
                </h2>
                
                <div className="flex space-x-2">
                  <button
                    onClick={handleExportCSV}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={handleCopyToClipboard}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Copy Table
                  </button>
                </div>
              </div>
              
              <TxnTable 
                transactions={transactions} 
                onExportCSV={handleExportCSV} 
              />
            </div>
          )}
        </main>

        <footer className="bg-white dark:bg-gray-800 shadow mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Banca Transilvania Statement Parser - {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home; 