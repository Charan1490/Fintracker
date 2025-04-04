import GeminiApiKeyForm from '../components/GeminiApiKeyForm';

export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-8">
        {/* Theme Settings */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Theme Preferences</h2>
          {/* Existing theme settings */}
        </div>
        
        {/* Gemini API Key Settings */}
        <GeminiApiKeyForm
          onSuccess={() => {
            // Optional callback when API key is saved successfully
            // For example, show a notification
          }}
        />
        
        {/* Currency Settings */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Currency Settings</h2>
          {/* Existing currency settings */}
        </div>
        
        {/* Other settings sections */}
        {/* ... */}
      </div>
    </div>
  );
} 