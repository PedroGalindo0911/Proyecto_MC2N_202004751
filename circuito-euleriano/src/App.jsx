import React, { useState, useRef, useEffect } from "react";

const GraphApp = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [fromNode, setFromNode] = useState(null);
  const [pathSteps, setPathSteps] = useState([]);
  const [message, setMessage] = useState("");
  const svgRef = useRef(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSvgClick = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newNode = {
      id: Date.now(),
      label: `${nodes.length + 1}`,
      x,
      y,
    };
    setNodes((prev) => [...prev, newNode]);
  };

  const handleMouseDown = (e, id) => {
    e.stopPropagation();
    const move = (e) => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === id
            ? {
                ...node,
                x: e.clientX - svgRef.current.getBoundingClientRect().left,
                y: e.clientY - svgRef.current.getBoundingClientRect().top,
              }
            : node
        )
      );
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const handleDoubleClick = (e, id) => {
    e.stopPropagation();
    const newLabel = prompt("Nuevo nombre del nodo:");
    if (newLabel !== null && newLabel.trim()) {
      setNodes((prev) =>
        prev.map((node) => (node.id === id ? { ...node, label: newLabel } : node))
      );
    }
  };

  const handleContextMenu = (e, id) => {
    e.preventDefault();
    setNodes((prev) => prev.filter((node) => node.id !== id));
    setEdges((prev) => prev.filter((edge) => edge.from !== id && edge.to !== id));
  };

  const handleNodeClick = (e, id) => {
    e.stopPropagation();
    if (!isConnecting) {
      setFromNode(id);
      setIsConnecting(true);
    } else {
      if (fromNode !== id) {
        setEdges((prev) => [...prev, { from: fromNode, to: id }]);
      }
      setFromNode(null);
      setIsConnecting(false);
    }
  };

  const findPath = () => {
    const adj = new Map();
    const edgeCount = new Map();
  
    // Construimos lista de adyacencia bidireccional
    for (const { from, to } of edges) {
      if (!adj.has(from)) adj.set(from, []);
      if (!adj.has(to)) adj.set(to, []);
      adj.get(from).push(to);
      adj.get(to).push(from);
  
      const key = from < to ? `${from}-${to}` : `${to}-${from}`;
      edgeCount.set(key, (edgeCount.get(key) || 0) + 1);
    }
  
    // Verificamos si todos los grados son pares
    for (const [node, neighbors] of adj) {
      if (neighbors.length % 2 !== 0) {
        setMessage("No hay circuito euleriano: un nodo tiene grado impar.");
        setPathSteps([]);
        return;
      }
    }
  
    // Hierholzer’s algorithm
    const path = [];
    const stack = [nodes[0]?.id];
    const localAdj = new Map([...adj].map(([k, v]) => [k, [...v]]));
  
    while (stack.length > 0) {
      const v = stack[stack.length - 1];
      const neighbors = localAdj.get(v);
      if (neighbors && neighbors.length > 0) {
        const u = neighbors.pop();
        const pairKey = v < u ? `${v}-${u}` : `${u}-${v}`;
        if (edgeCount.get(pairKey) > 0) {
          edgeCount.set(pairKey, edgeCount.get(pairKey) - 1);
          // remove u -> v also
          localAdj.set(u, localAdj.get(u).filter(n => n !== v));
          stack.push(u);
        }
      } else {
        path.push(stack.pop());
      }
    }
  
    if (path.length - 1 !== edges.length) {
      setMessage("No hay circuito euleriano: el grafo no es conexo.");
      setPathSteps([]);
      return;
    }
  
    // Convertimos el camino en pasos de aristas
    const steps = [];
    for (let i = 0; i < path.length - 1; i++) {
      steps.push({ from: path[i], to: path[i + 1] });
    }
  
    setPathSteps(steps);
    setMessage("¡Circuito euleriano encontrado!");
  };
  
  const getNodeById = (id) => nodes.find((node) => node.id === id);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Circuito Euleriano</h1>
      {message && <div style={styles.message}>{message}</div>}
      <svg ref={svgRef} width="100%" height="600px" style={styles.svg} onClick={handleSvgClick}>
        {/* Edges */}
        {edges.map((edge, index) => {
          const fromNode = getNodeById(edge.from);
          const toNode = getNodeById(edge.to);
          const isInPath = pathSteps.findIndex(
            (step) => step.from === edge.from && step.to === edge.to
          );
          const dx = toNode.x - fromNode.x;
          const dy = toNode.y - fromNode.y;
          const mx = fromNode.x + dx / 2;
          const my = fromNode.y + dy / 2;
          return (
            <g key={index}>
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={isInPath !== -1 ? "red" : "#444"}
                strokeWidth={2}
              />
              {isInPath !== -1 && (
                <g>
                  <circle cx={mx} cy={my} r="10" fill="white" stroke="red" strokeWidth="2" />
                  <text x={mx} y={my + 4} fontSize="10" textAnchor="middle" fill="red">
                    {isInPath + 1}
                  </text>
                </g>
              )}
            </g>
          );
        })}
        {/* Nodes */}
        {nodes.map((node) => (
          <g
            key={node.id}
            transform={`translate(${node.x},${node.y})`}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            onDoubleClick={(e) => handleDoubleClick(e, node.id)}
            onContextMenu={(e) => handleContextMenu(e, node.id)}
            onClick={(e) => handleNodeClick(e, node.id)}
            style={{ cursor: "pointer" }}
          >
            <circle r="20" fill="#6c63ff" stroke="#333" strokeWidth="2" />
            <text
              x="0"
              y="5"
              fontSize="12"
              fill="#fff"
              textAnchor="middle"
              fontWeight="bold"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
      <button onClick={findPath} style={styles.button}>
        Buscar Recorrido
      </button>
    </div>
  );
};

// 🎨 Estilos
const styles = {
  container: {
    background: "linear-gradient(to bottom, #f0f4ff, #e2ecf9)",
    padding: "20px",
    minHeight: "100vh",
    textAlign: "center",
  },
  svg: {
    border: "2px solid #ccc",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
  },
  button: {
    marginTop: "20px",
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#6c63ff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  message: {
    backgroundColor: "#dff0d8",
    color: "#3c763d",
    padding: "10px",
    borderRadius: "6px",
    marginBottom: "10px",
    animation: "fadeIn 0.5s ease-in-out",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "10px",
  },
};

export default GraphApp;
