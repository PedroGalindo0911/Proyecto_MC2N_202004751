import React from 'react';
import GraphEditor from './components/GraphEditor';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Circuito Euleriano</h1>
      <GraphEditor />
    </div>
  );
}