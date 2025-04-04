import React, { useState, useEffect } from 'react';
import { setGeminiApiKey } from '../utils/ai';

const GeminiApiKeyForm = ({ onSuccess }) => {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Check if API key exists in local storage
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setGeminiApiKey(savedKey);
      setIsSaved(true);
    }
  }, []);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('Please enter a valid API key');
      return;
    }
    
    try {
      const success = setGeminiApiKey(apiKey);
      
      if (success) {
        // Save to local storage
        localStorage.setItem('gemini_api_key', apiKey);
        setIsSaved(true);
        setError('');
        
        if (onSuccess) {
          onSuccess(apiKey);
        }
      } else {
        setError('Failed to set API key. Please check the format.');
      }
    } catch (err) {
      setError('An error occurred while setting the API key.');
      console.error(err);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Gemini AI Integration
      </h2>
      
      <p className="text-gray-600 mb-4">
        Enter your Gemini API key to enable advanced AI features like intelligent transaction categorization, 
        personalized financial insights, and budget recommendations.
      </p>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-100">
        <h3 className="font-medium text-blue-800 mb-2 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          What you'll get with Gemini AI
        </h3>
        <ul className="text-sm text-blue-700 space-y-1 pl-6 list-disc">
          <li>Automatic merchant detection from transaction descriptions</li>
          <li>Smart transaction categorization</li>
          <li>Personalized spending insights</li>
          <li>AI-powered budget recommendations</li>
          <li>Future expense predictions</li>
        </ul>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
            Gemini API Key
          </label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your Gemini API key"
          />
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        {isSaved && !error && (
          <div className="mb-4 p-2 bg-green-100 text-green-700 rounded-md text-sm">
            API key saved successfully. AI features are now enabled!
          </div>
        )}
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          {isSaved ? 'Update API Key' : 'Save API Key'}
        </button>
      </form>
      
      <div className="mt-4 text-xs text-gray-500">
        <p className="font-medium mb-1">How to get a Gemini API key:</p>
        <ol className="list-decimal pl-5 mt-1 space-y-1">
          <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio API Keys</a></li>
          <li>Create a Google account or sign in if you haven't already</li>
          <li>Click "Create API key" if you don't already have one</li>
          <li>Copy your API key</li>
          <li>Paste it here and click "Save API Key"</li>
          <li>Your API key is stored locally and is never sent to our servers</li>
        </ol>
      </div>
    </div>
  );
};

export default GeminiApiKeyForm; 