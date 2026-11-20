/**
 * AlgoVision — Graph Algorithms & Execution Trace Generator
 * Supports: BFS, DFS, Dijkstra, Bellman-Ford, Kruskal's MST.
 * Generates an immutable, step-by-step ordered execution trace.
 */

export const GRAPH_ALGORITHM_INFO = {
  bfs: {
    id: 'bfs',
    name: 'Breadth-First Search (BFS)',
    category: 'Graph Traversal',
    requiresSource: true,
    requiresDestination: false,
    supportsDirected: true,
    supportsNegativeWeights: true,
    description: 'Explores vertices level-by-level starting from the source vertex using a FIFO queue. Ideal for finding unweighted shortest paths and connected components.',
    complexities: {
      time: 'O(V + E)',
      space: 'O(V)'
    },
    cppCode: [
      'void BFS(int startNode, const vector<vector<int>>& adj, int V) {',
      '    vector<bool> visited(V, false);',
      '    queue<int> q;',
      '    visited[startNode] = true;',
      '    q.push(startNode);',
      '    while (!q.empty()) {',
      '        int u = q.front(); q.pop();',
      '        for (int v : adj[u]) {',
      '            if (!visited[v]) {',
      '                visited[v] = true;',
      '                q.push(v);',
      '            }',
      '        }',
      '    }',
      '}'
    ]
  },
  dfs: {
    id: 'dfs',
    name: 'Depth-First Search (DFS)',
    category: 'Graph Traversal',
    requiresSource: true,
    requiresDestination: false,
    supportsDirected: true,
    supportsNegativeWeights: true,
    description: 'Explores as deep as possible along each branch before backtracking using a call stack/recursion. Useful for cycle detection, topological sorting, and component discovery.',
    complexities: {
      time: 'O(V + E)',
      space: 'O(V)'
    },
    cppCode: [
      'void DFSUtil(int u, const vector<vector<int>>& adj, vector<bool>& visited) {',
      '    visited[u] = true;',
      '    for (int v : adj[u]) {',
      '        if (!visited[v]) {',
      '            DFSUtil(v, adj, visited);',
      '        }',
      '    }',
      '}',
      'void DFS(int startNode, const vector<vector<int>>& adj, int V) {',
      '    vector<bool> visited(V, false);',
      '    DFSUtil(startNode, adj, visited);',
      '}'
    ]
  },
  dijkstra: {
    id: 'dijkstra',
    name: "Dijkstra's Algorithm",
    category: 'Single-Source Shortest Path',
    requiresSource: true,
    requiresDestination: true,
    supportsDirected: true,
    supportsNegativeWeights: false,
    description: 'Greedy algorithm that computes single-source shortest paths on weighted graphs with non-negative edge weights using a priority queue and edge relaxations.',
    complexities: {
      time: 'O((V + E) log V)',
      space: 'O(V)'
    },
    cppCode: [
      'void dijkstra(int src, const vector<vector<pair<int,int>>>& adj, int V) {',
      '    vector<int> dist(V, INF);',
      '    vector<int> parent(V, -1);',
      '    priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> pq;',
      '    dist[src] = 0; pq.push({0, src});',
      '    while (!pq.empty()) {',
      '        auto [d, u] = pq.top(); pq.pop();',
      '        if (d > dist[u]) continue;',
      '        for (auto [v, w] : adj[u]) {',
      '            if (dist[u] + w < dist[v]) {',
      '                dist[v] = dist[u] + w;',
      '                parent[v] = u;',
      '                pq.push({dist[v], v});',
      '            }',
      '        }',
      '    }',
      '}'
    ]
  },
  bellman: {
    id: 'bellman',
    name: 'Bellman-Ford Algorithm',
    category: 'Single-Source Shortest Path',
    requiresSource: true,
    requiresDestination: true,
    supportsDirected: true,
    supportsNegativeWeights: true,
    description: 'Computes single-source shortest paths on graphs supporting negative edge weights by relaxing all edges V-1 times. Detects and reports negative weight cycles on the V-th pass.',
    complexities: {
      time: 'O(V · E)',
      space: 'O(V)'
    },
    cppCode: [
      'bool bellmanFord(int src, const vector<Edge>& edges, int V) {',
      '    vector<int> dist(V, INF), parent(V, -1);',
      '    dist[src] = 0;',
      '    for (int i = 1; i <= V - 1; i++) {',
      '        for (const auto& e : edges) {',
      '            if (dist[e.u] != INF && dist[e.u] + e.w < dist[e.v]) {',
      '                dist[e.v] = dist[e.u] + e.w; parent[e.v] = e.u;',
      '            }',
      '        }',
      '    }',
      '    for (const auto& e : edges) {',
      '        if (dist[e.u] != INF && dist[e.u] + e.w < dist[e.v])',
      '            return false; // Negative cycle detected',
      '    }',
      '    return true;',
      '}'
    ]
  },
  kruskal: {
    id: 'kruskal',
    name: "Kruskal's Algorithm",
    category: 'Minimum Spanning Tree (MST)',
    requiresSource: false,
    requiresDestination: false,
    supportsDirected: false,
    supportsNegativeWeights: true,
    description: 'Greedy algorithm that sorts all edges by weight and grows a Minimum Spanning Tree (or Forest) by continually choosing the cheapest valid edge using Disjoint Set Union (DSU) to avoid cycles.',
    complexities: {
      time: 'O(E log E)',
      space: 'O(V + E)'
    },
    cppCode: [
      'int kruskalMST(vector<Edge>& edges, int V) {',
      '    sort(edges.begin(), edges.end(), [](auto& a, auto& b){ return a.w < b.w; });',
      '    DSU dsu(V);',
      '    int totalWeight = 0, count = 0;',
      '    for (const auto& e : edges) {',
      '        if (dsu.find(e.u) != dsu.find(e.v)) {',
      '            dsu.unite(e.u, e.v);',
      '            totalWeight += e.w;',
      '            if (++count == V - 1) break;',
      '        }',
      '    }',
      '    return totalWeight;',
      '}'
    ]
  }
};

/**
 * Creates an immutable trace step object for graph algorithms.
 */
function createGraphStep({
  nodes,
  edges,
  visitedNodes = [],
  traversalOrder = [],
  currentNode = null,
  currentEdge = null, // [u, v]
  queueOrStack = [],
  structureType = 'Queue', // 'Queue' | 'Stack' | 'PriorityQueue' | 'EdgeList'
  distances = {}, // { nodeId: distance }
  parents = {}, // { nodeId: parentId }
  highlightedPath = [], // [edge1, edge2] or [node1, node2...]
  acceptedEdges = [], // for Kruskal
  rejectedEdges = [], // for Kruskal
  iteration = null,
  mstWeight = 0,
  hasNegativeCycle = false,
  isDisconnected = false,
  resultSummary = '',
  explanation = '',
  line = 1,
  type = 'normal'
}) {
  return {
    nodes: nodes.map(n => ({ ...n })),
    edges: edges.map(e => ({ ...e })),
    visitedNodes: [...visitedNodes],
    traversalOrder: [...traversalOrder],
    currentNode,
    currentEdge: currentEdge ? { ...currentEdge } : null,
    queueOrStack: [...queueOrStack],
    structureType,
    distances: { ...distances },
    parents: { ...parents },
    highlightedPath: [...highlightedPath],
    acceptedEdges: [...acceptedEdges],
    rejectedEdges: [...rejectedEdges],
    iteration,
    mstWeight,
    hasNegativeCycle,
    isDisconnected,
    resultSummary,
    explanation,
    line,
    type
  };
}

/**
 * Helper to build adjacency list from nodes and edges.
 */
function buildAdjacencyList(nodes, edges, isDirected) {
  const adj = {};
  nodes.forEach(n => {
    adj[n.id] = [];
  });

  edges.forEach(e => {
    if (!adj[e.source]) adj[e.source] = [];
    adj[e.source].push({ to: e.target, weight: e.weight, id: e.id });

    if (!isDirected) {
      if (!adj[e.target]) adj[e.target] = [];
      adj[e.target].push({ to: e.source, weight: e.weight, id: e.id });
    }
  });

  // Sort neighbors by ID for deterministic traversal
  nodes.forEach(n => {
    adj[n.id].sort((a, b) => a.to - b.to);
  });

  return adj;
}

/**
 * 1. Breadth-First Search (BFS) Trace Generator
 */
export function generateBFSTrace(nodes, edges, isDirected, startNodeId) {
  const trace = [];
  if (!nodes || nodes.length === 0) return trace;

  const adj = buildAdjacencyList(nodes, edges, isDirected);
  const visited = new Set();
  const traversalOrder = [];
  const queue = [];

  trace.push(createGraphStep({
    nodes,
    edges,
    structureType: 'Queue',
    queueOrStack: [],
    explanation: `Starting Breadth-First Search from Node ${startNodeId}.`,
    line: 1,
    type: 'start'
  }));

  visited.add(startNodeId);
  traversalOrder.push(startNodeId);
  queue.push(startNodeId);

  trace.push(createGraphStep({
    nodes,
    edges,
    visitedNodes: Array.from(visited),
    traversalOrder,
    currentNode: startNodeId,
    queueOrStack: [...queue],
    structureType: 'Queue',
    explanation: `Pushed start node ${startNodeId} to queue and marked visited.`,
    line: 5,
    type: 'visit'
  }));

  while (queue.length > 0) {
    const u = queue.shift();

    trace.push(createGraphStep({
      nodes,
      edges,
      visitedNodes: Array.from(visited),
      traversalOrder,
      currentNode: u,
      queueOrStack: [...queue],
      structureType: 'Queue',
      explanation: `Dequeued Node ${u}. Checking all outgoing neighbors.`,
      line: 7,
      type: 'expand'
    }));

    const neighbors = adj[u] || [];
    for (const neighbor of neighbors) {
      const v = neighbor.to;
      const edge = { source: u, target: v, id: neighbor.id, weight: neighbor.weight };

      trace.push(createGraphStep({
        nodes,
        edges,
        visitedNodes: Array.from(visited),
        traversalOrder,
        currentNode: u,
        currentEdge: edge,
        queueOrStack: [...queue],
        structureType: 'Queue',
        explanation: `Exploring edge (${u} → ${v}).`,
        line: 8,
        type: 'explore'
      }));

      if (!visited.has(v)) {
        visited.add(v);
        traversalOrder.push(v);
        queue.push(v);

        trace.push(createGraphStep({
          nodes,
          edges,
          visitedNodes: Array.from(visited),
          traversalOrder,
          currentNode: v,
          currentEdge: edge,
          queueOrStack: [...queue],
          structureType: 'Queue',
          explanation: `Node ${v} is unvisited. Enqueueing ${v} and marking visited.`,
          line: 10,
          type: 'visit'
        }));
      } else {
        trace.push(createGraphStep({
          nodes,
          edges,
          visitedNodes: Array.from(visited),
          traversalOrder,
          currentNode: u,
          currentEdge: edge,
          queueOrStack: [...queue],
          structureType: 'Queue',
          explanation: `Node ${v} was already visited. Skipping.`,
          line: 8,
          type: 'skip'
        }));
      }
    }
  }

  // Check disconnected components
  const isDisconnected = visited.size < nodes.length;
  const summary = isDisconnected
    ? `BFS completed from Node ${startNodeId}. Graph has disconnected components (${visited.size}/${nodes.length} nodes reached).`
    : `BFS completed! All ${nodes.length} nodes reached in traversal order: [${traversalOrder.join(' → ')}].`;

  trace.push(createGraphStep({
    nodes,
    edges,
    visitedNodes: Array.from(visited),
    traversalOrder,
    queueOrStack: [],
    structureType: 'Queue',
    isDisconnected,
    resultSummary: summary,
    explanation: summary,
    line: 14,
    type: 'complete'
  }));

  return trace;
}

/**
 * 2. Depth-First Search (DFS) Trace Generator
 */
export function generateDFSTrace(nodes, edges, isDirected, startNodeId) {
  const trace = [];
  if (!nodes || nodes.length === 0) return trace;

  const adj = buildAdjacencyList(nodes, edges, isDirected);
  const visited = new Set();
  const traversalOrder = [];
  const stack = [];

  trace.push(createGraphStep({
    nodes,
    edges,
    structureType: 'Call Stack',
    queueOrStack: [],
    explanation: `Starting Depth-First Search from Node ${startNodeId}.`,
    line: 10,
    type: 'start'
  }));

  function dfsRecursive(u) {
    visited.add(u);
    traversalOrder.push(u);
    stack.push(u);

    trace.push(createGraphStep({
      nodes,
      edges,
      visitedNodes: Array.from(visited),
      traversalOrder,
      currentNode: u,
      queueOrStack: [...stack],
      structureType: 'Call Stack',
      explanation: `Calling DFS on Node ${u}. Added to recursion stack.`,
      line: 2,
      type: 'visit'
    }));

    const neighbors = adj[u] || [];
    for (const neighbor of neighbors) {
      const v = neighbor.to;
      const edge = { source: u, target: v, id: neighbor.id, weight: neighbor.weight };

      trace.push(createGraphStep({
        nodes,
        edges,
        visitedNodes: Array.from(visited),
        traversalOrder,
        currentNode: u,
        currentEdge: edge,
        queueOrStack: [...stack],
        structureType: 'Call Stack',
        explanation: `Checking edge (${u} → ${v}).`,
        line: 3,
        type: 'explore'
      }));

      if (!visited.has(v)) {
        dfsRecursive(v);
        // Backtracked to u
        trace.push(createGraphStep({
          nodes,
          edges,
          visitedNodes: Array.from(visited),
          traversalOrder,
          currentNode: u,
          queueOrStack: [...stack],
          structureType: 'Call Stack',
          explanation: `Backtracked to Node ${u}.`,
          line: 5,
          type: 'backtrack'
        }));
      } else {
        trace.push(createGraphStep({
          nodes,
          edges,
          visitedNodes: Array.from(visited),
          traversalOrder,
          currentNode: u,
          currentEdge: edge,
          queueOrStack: [...stack],
          structureType: 'Call Stack',
          explanation: `Neighbor ${v} is already visited. Skipping.`,
          line: 4,
          type: 'skip'
        }));
      }
    }

    stack.pop();
  }

  dfsRecursive(startNodeId);

  const isDisconnected = visited.size < nodes.length;
  const summary = isDisconnected
    ? `DFS completed from Node ${startNodeId}. Disconnected component detected (${visited.size}/${nodes.length} nodes reached).`
    : `DFS completed! Traversal order: [${traversalOrder.join(' → ')}].`;

  trace.push(createGraphStep({
    nodes,
    edges,
    visitedNodes: Array.from(visited),
    traversalOrder,
    queueOrStack: [],
    structureType: 'Call Stack',
    isDisconnected,
    resultSummary: summary,
    explanation: summary,
    line: 12,
    type: 'complete'
  }));

  return trace;
}

/**
 * 3. Dijkstra's Shortest Path Trace Generator
 */
export function generateDijkstraTrace(nodes, edges, isDirected, startNodeId, destNodeId) {
  const trace = [];
  if (!nodes || nodes.length === 0) return trace;

  // Validation: Check for negative edge weights
  const hasNegativeWeight = edges.some(e => Number(e.weight) < 0);
  if (hasNegativeWeight) {
    trace.push(createGraphStep({
      nodes,
      edges,
      explanation: "Dijkstra's Algorithm cannot run with negative edge weights! Please use Bellman-Ford.",
      line: 1,
      type: 'error'
    }));
    return trace;
  }

  const adj = buildAdjacencyList(nodes, edges, isDirected);
  const distances = {};
  const parents = {};
  const visited = new Set();
  const pq = []; // [{ node, dist }]

  nodes.forEach(n => {
    distances[n.id] = Infinity;
    parents[n.id] = null;
  });
  distances[startNodeId] = 0;
  pq.push({ node: startNodeId, dist: 0 });

  trace.push(createGraphStep({
    nodes,
    edges,
    distances,
    parents,
    queueOrStack: pq.map(i => `${i.node}(${i.dist})`),
    structureType: 'Min-Priority Queue',
    explanation: `Initialized distances. dist[${startNodeId}] = 0, all others = ∞.`,
    line: 5,
    type: 'start'
  }));

  while (pq.length > 0) {
    // Sort pq for min-priority behavior
    pq.sort((a, b) => a.dist - b.dist);
    const { node: u, dist: d } = pq.shift();

    if (visited.has(u)) continue;
    visited.add(u);

    trace.push(createGraphStep({
      nodes,
      edges,
      visitedNodes: Array.from(visited),
      currentNode: u,
      distances,
      parents,
      queueOrStack: pq.map(i => `${i.node}(${i.dist})`),
      structureType: 'Min-Priority Queue',
      explanation: `Selected minimum distance node ${u} with dist = ${d}. Marking settled.`,
      line: 7,
      type: 'visit'
    }));

    if (destNodeId !== null && u === destNodeId) {
      // Reached destination early
      break;
    }

    const neighbors = adj[u] || [];
    for (const neighbor of neighbors) {
      const v = neighbor.to;
      const weight = Number(neighbor.weight);
      const edge = { source: u, target: v, id: neighbor.id, weight };

      if (visited.has(v)) continue;

      trace.push(createGraphStep({
        nodes,
        edges,
        visitedNodes: Array.from(visited),
        currentNode: u,
        currentEdge: edge,
        distances,
        parents,
        queueOrStack: pq.map(i => `${i.node}(${i.dist})`),
        structureType: 'Min-Priority Queue',
        explanation: `Checking edge (${u} → ${v}) of weight ${weight}. Potential new dist: ${distances[u]} + ${weight} = ${distances[u] + weight}.`,
        line: 9,
        type: 'explore'
      }));

      if (distances[u] + weight < distances[v]) {
        const oldDist = distances[v] === Infinity ? '∞' : distances[v];
        distances[v] = distances[u] + weight;
        parents[v] = u;
        pq.push({ node: v, dist: distances[v] });

        trace.push(createGraphStep({
          nodes,
          edges,
          visitedNodes: Array.from(visited),
          currentNode: u,
          currentEdge: edge,
          distances,
          parents,
          queueOrStack: pq.map(i => `${i.node}(${i.dist})`),
          structureType: 'Min-Priority Queue',
          explanation: `Relaxed edge! Updated dist[${v}] from ${oldDist} to ${distances[v]} via parent ${u}.`,
          line: 11,
          type: 'relax'
        }));
      }
    }
  }

  // Reconstruct path if destNodeId is provided
  let path = [];
  let summary = '';
  if (destNodeId !== null) {
    if (distances[destNodeId] === Infinity) {
      summary = `No path exists from Node ${startNodeId} to Node ${destNodeId}.`;
    } else {
      let curr = destNodeId;
      while (curr !== null) {
        path.unshift(curr);
        curr = parents[curr];
      }
      summary = `Shortest Path (${startNodeId} → ${destNodeId}): ${path.join(' → ')} with total cost = ${distances[destNodeId]}.`;
    }
  } else {
    summary = `Dijkstra completed! Shortest distances from Node ${startNodeId} to all reachable nodes computed.`;
  }

  trace.push(createGraphStep({
    nodes,
    edges,
    visitedNodes: Array.from(visited),
    distances,
    parents,
    highlightedPath: path,
    resultSummary: summary,
    explanation: summary,
    line: 16,
    type: 'complete'
  }));

  return trace;
}

/**
 * 4. Bellman-Ford Shortest Path Trace Generator
 */
export function generateBellmanFordTrace(nodes, edges, isDirected, startNodeId, destNodeId) {
  const trace = [];
  if (!nodes || nodes.length === 0) return trace;

  const V = nodes.length;
  const distances = {};
  const parents = {};

  nodes.forEach(n => {
    distances[n.id] = Infinity;
    parents[n.id] = null;
  });
  distances[startNodeId] = 0;

  // Flatten edges list for directed/undirected
  const allEdges = [];
  edges.forEach(e => {
    allEdges.push({ source: e.source, target: e.target, weight: Number(e.weight), id: e.id });
    if (!isDirected) {
      allEdges.push({ source: e.target, target: e.source, weight: Number(e.weight), id: e.id });
    }
  });

  trace.push(createGraphStep({
    nodes,
    edges,
    distances,
    parents,
    structureType: 'Edge List',
    queueOrStack: allEdges.map(e => `(${e.source}→${e.target}, ${e.weight})`),
    explanation: `Initialized Bellman-Ford. dist[${startNodeId}] = 0. Will execute ${V - 1} relaxation passes over ${allEdges.length} directed edge instances.`,
    line: 3,
    type: 'start'
  }));

  // V - 1 relaxation iterations
  for (let i = 1; i <= V - 1; i++) {
    let anyRelaxation = false;

    trace.push(createGraphStep({
      nodes,
      edges,
      distances,
      parents,
      iteration: i,
      structureType: 'Edge List',
      explanation: `Starting Pass ${i} of ${V - 1}.`,
      line: 4,
      type: 'pass'
    }));

    for (const edge of allEdges) {
      const u = edge.source;
      const v = edge.target;
      const w = edge.weight;

      if (distances[u] !== Infinity && distances[u] + w < distances[v]) {
        const oldDist = distances[v] === Infinity ? '∞' : distances[v];
        distances[v] = distances[u] + w;
        parents[v] = u;
        anyRelaxation = true;

        trace.push(createGraphStep({
          nodes,
          edges,
          distances,
          parents,
          iteration: i,
          currentNode: v,
          currentEdge: edge,
          structureType: 'Edge List',
          explanation: `Pass ${i}: Relaxed edge (${u} → ${v}). Updated dist[${v}] from ${oldDist} to ${distances[v]}.`,
          line: 7,
          type: 'relax'
        }));
      }
    }

    if (!anyRelaxation) {
      trace.push(createGraphStep({
        nodes,
        edges,
        distances,
        parents,
        iteration: i,
        structureType: 'Edge List',
        explanation: `Pass ${i}: No distances changed. Early termination reached!`,
        line: 9,
        type: 'pass'
      }));
      break;
    }
  }

  // Pass V: Negative cycle detection
  let hasNegativeCycle = false;
  for (const edge of allEdges) {
    const u = edge.source;
    const v = edge.target;
    const w = edge.weight;

    if (distances[u] !== Infinity && distances[u] + w < distances[v]) {
      hasNegativeCycle = true;
      trace.push(createGraphStep({
        nodes,
        edges,
        distances,
        parents,
        currentEdge: edge,
        hasNegativeCycle: true,
        structureType: 'Edge List',
        explanation: `Negative weight cycle detected! Edge (${u} → ${v}) of weight ${w} can still be relaxed.`,
        line: 12,
        type: 'error'
      }));
      break;
    }
  }

  // Result path reconstruction
  let path = [];
  let summary = '';

  if (hasNegativeCycle) {
    summary = 'Negative weight cycle detected! Shortest paths are undefined.';
  } else if (destNodeId !== null) {
    if (distances[destNodeId] === Infinity) {
      summary = `No path exists from Node ${startNodeId} to Node ${destNodeId}.`;
    } else {
      let curr = destNodeId;
      while (curr !== null) {
        path.unshift(curr);
        curr = parents[curr];
      }
      summary = `Shortest Path (${startNodeId} → ${destNodeId}): ${path.join(' → ')} with total cost = ${distances[destNodeId]}.`;
    }
  } else {
    summary = `Bellman-Ford completed! Computed all shortest paths without negative cycles.`;
  }

  trace.push(createGraphStep({
    nodes,
    edges,
    distances,
    parents,
    highlightedPath: path,
    hasNegativeCycle,
    resultSummary: summary,
    explanation: summary,
    line: 14,
    type: hasNegativeCycle ? 'error' : 'complete'
  }));

  return trace;
}

/**
 * 5. Kruskal's Minimum Spanning Tree (MST) Trace Generator
 */
export function generateKruskalTrace(nodes, edges) {
  const trace = [];
  if (!nodes || nodes.length === 0) return trace;

  // Disjoint Set Union (DSU) helper
  const parent = {};
  const rank = {};

  nodes.forEach(n => {
    parent[n.id] = n.id;
    rank[n.id] = 0;
  });

  function find(i) {
    if (parent[i] === i) return i;
    parent[i] = find(parent[i]);
    return parent[i];
  }

  function union(i, j) {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      if (rank[rootI] < rank[rootJ]) {
        parent[rootI] = rootJ;
      } else if (rank[rootI] > rank[rootJ]) {
        parent[rootJ] = rootI;
      } else {
        parent[rootJ] = rootI;
        rank[rootI]++;
      }
      return true;
    }
    return false;
  }

  // Sort edges by weight
  const sortedEdges = [...edges].sort((a, b) => Number(a.weight) - Number(b.weight));
  const accepted = [];
  const rejected = [];
  let totalWeight = 0;

  trace.push(createGraphStep({
    nodes,
    edges,
    structureType: 'Sorted Edges',
    queueOrStack: sortedEdges.map(e => `(${e.source}-${e.target}: ${e.weight})`),
    explanation: `Sorted all ${edges.length} edges by ascending weight. Initialized Disjoint Set Union (DSU).`,
    line: 2,
    type: 'start'
  }));

  for (const edge of sortedEdges) {
    const u = edge.source;
    const v = edge.target;
    const w = Number(edge.weight);

    trace.push(createGraphStep({
      nodes,
      edges,
      currentEdge: edge,
      acceptedEdges: accepted.map(e => e.id),
      rejectedEdges: rejected.map(e => e.id),
      mstWeight: totalWeight,
      structureType: 'Sorted Edges',
      explanation: `Evaluating edge (${u} - ${v}) with weight ${w}. Checking find(${u}) and find(${v}).`,
      line: 5,
      type: 'explore'
    }));

    if (find(u) !== find(v)) {
      union(u, v);
      accepted.push(edge);
      totalWeight += w;

      trace.push(createGraphStep({
        nodes,
        edges,
        currentEdge: edge,
        acceptedEdges: accepted.map(e => e.id),
        rejectedEdges: rejected.map(e => e.id),
        mstWeight: totalWeight,
        structureType: 'Sorted Edges',
        explanation: `Nodes ${u} and ${v} belong to different sets. Accepted edge (${u} - ${v}) into MST. Total weight now = ${totalWeight}.`,
        line: 6,
        type: 'accept'
      }));

      if (accepted.length === nodes.length - 1) {
        trace.push(createGraphStep({
          nodes,
          edges,
          acceptedEdges: accepted.map(e => e.id),
          rejectedEdges: rejected.map(e => e.id),
          mstWeight: totalWeight,
          structureType: 'Sorted Edges',
          explanation: `Spanning tree reached ${nodes.length - 1} edges. Algorithm terminates.`,
          line: 9,
          type: 'complete'
        }));
        break;
      }
    } else {
      rejected.push(edge);
      trace.push(createGraphStep({
        nodes,
        edges,
        currentEdge: edge,
        acceptedEdges: accepted.map(e => e.id),
        rejectedEdges: rejected.map(e => e.id),
        mstWeight: totalWeight,
        structureType: 'Sorted Edges',
        explanation: `Nodes ${u} and ${v} are already in the same connected component. Rejected edge (${u} - ${v}) to prevent a cycle.`,
        line: 5,
        type: 'reject'
      }));
    }
  }

  // Disconnected graph verification
  const isForest = accepted.length < nodes.length - 1;
  const summary = isForest
    ? `Minimum Spanning Forest formed with ${accepted.length} edges across disconnected components. Total Weight = ${totalWeight}.`
    : `Minimum Spanning Tree found! Connected all ${nodes.length} nodes with ${accepted.length} edges. Total Weight = ${totalWeight}.`;

  trace.push(createGraphStep({
    nodes,
    edges,
    acceptedEdges: accepted.map(e => e.id),
    rejectedEdges: rejected.map(e => e.id),
    mstWeight: totalWeight,
    isDisconnected: isForest,
    resultSummary: summary,
    explanation: summary,
    line: 12,
    type: 'complete'
  }));

  return trace;
}
