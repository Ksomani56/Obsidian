'use client';

import { useEffect, useState } from 'react';

export default function TestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/test')
      .then(res => res.json())
      .then(data => {
        setTestResult(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <div className="p-4">Testing API connection...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">API Test Results</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(testResult, null, 2)}
      </pre>
    </div>
  );
}
