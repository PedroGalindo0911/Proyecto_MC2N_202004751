import React, { useCallback, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';

function hasEulerianCircuit(nodes, edges) {
  const degrees = {};

  for (const node of nodes) {
    degrees[node.id] = 0;
  }

  for (const edge of edges) {
    degrees[edge.source]++;
    degrees[edge.target]++;
  }

  return Object.values(degrees).every(degree => degree % 2 === 0);
}

function findEulerianCircuit(edges, nodes) {
  const graph = {};

  for (const edge of edges) {
    if (!graph[edge.source]) graph[edge.source] = [];
    if (!graph[edge.target]) graph[edge.target] = [];
    graph[edge.source].push(edge.target);
    graph[edge.target].push(edge.source);
  }

  const stack = [];
  const circuit = [];
  const current = edges[0]?.source;
  if (!current) return [];

  stack.push(current);
  while (stack.length) {
    const u = stack[stack.length - 1];
    if (graph[u]?.length) {
      const v = graph[u].pop();
      graph[v] = graph[v].filter(n => n !== u);
      stack.push(v);
    } else {
      circuit.push(stack.pop());
    }
  }

  if (!nodes || nodes.length === 0) return [];

  const nodeLabels = {};
  nodes.forEach(node => {
    nodeLabels[node.id] = node.data.label;
  });

  return circuit.reverse().map(id => nodeLabels[id]);
}

export default function GraphEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [eulerianInfo, setEulerianInfo] = useState(null);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const addNode = () => {
    const id = uuidv4();
    setNodes((nds) => [
      ...nds,
      {
        id,
        data: { label: `Nodo ${nds.length}` },
        position: { x: Math.random() * 400, y: Math.random() * 400 },
        style: { width: 100, height: 100, borderRadius: '50%', backgroundColor: '#007bff', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' },
      },
    ]);
  };

  const analyzeGraph = () => {
    if (edges.length === 0 || nodes.length === 0) {
      setEulerianInfo('El grafo está vacío.');
      return;
    }
    if (!hasEulerianCircuit(nodes, edges)) {
      setEulerianInfo('El grafo NO cumple con el teorema de circuito euleriano.');
    } else {
      const circuit = findEulerianCircuit(edges, nodes);
      if (circuit.length === 0) {
        setEulerianInfo('No se pudo encontrar un circuito.');
      } else {
        setEulerianInfo('Circuito Euleriano: ' + circuit.join(' → '));
      }
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={addNode}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Agregar nodo
        </button>
        <button
          onClick={analyzeGraph}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Analizar grafo
        </button>
      </div>

      <div className="h-[600px] bg-white rounded shadow-md p-2">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background />
          <MiniMap />
          <Controls />
        </ReactFlow>
      </div>

      {eulerianInfo && (
        <div className="mt-4 p-4 bg-gray-200 rounded shadow">
          <p>{eulerianInfo}</p>
        </div>
      )}
    </div>
  );
}
