# --- same Graph + dijkstra classes as before ---
from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional, Any
import heapq

Node = Any
Weight = float

@dataclass
class RouteResult:
    path: List[Node]
    distance_km: float
    emissions_kg: Optional[float] = None

class Graph:
    def __init__(self) -> None:
        self.adj: Dict[Node, List[Tuple[Node, Weight]]] = {}

    def add_edge(self, u: Node, v: Node, km: float, bidirectional: bool = True) -> None:
        self.adj.setdefault(u, []).append((v, km))
        if bidirectional:
            self.adj.setdefault(v, []).append((u, km))
        else:
            self.adj.setdefault(v, [])

    def neighbors(self, u: Node) -> List[Tuple[Node, Weight]]:
        return self.adj.get(u, [])

def dijkstra(graph: Graph, source: Node, target: Node,
             *, emission_rate_kg_per_km: Optional[float] = None) -> RouteResult:
    if source not in graph.adj or target not in graph.adj:
        raise ValueError("Source or target not present in graph.")

    pq: List[Tuple[float, Node]] = [(0.0, source)]
    dist: Dict[Node, float] = {source: 0.0}
    prev: Dict[Node, Node] = {}

    while pq:
        d_u, u = heapq.heappop(pq)
        if u == target:
            break
        if d_u > dist.get(u, float("inf")):
            continue
        for v, w in graph.neighbors(u):
            alt = d_u + w
            if alt < dist.get(v, float("inf")):
                dist[v] = alt
                prev[v] = u
                heapq.heappush(pq, (alt, v))

    if target not in dist:
        raise ValueError(f"No route found from {source} to {target}.")

    # reconstruct path
    path: List[Node] = []
    cur = target
    while cur != source:
        path.append(cur)
        cur = prev[cur]
    path.append(source)
    path.reverse()

    distance_km = dist[target]
    emissions_kg = distance_km * emission_rate_kg_per_km if emission_rate_kg_per_km else None
    return RouteResult(path=path, distance_km=distance_km, emissions_kg=emissions_kg)


# --- Build a mini USYD campus graph ---
g = Graph()

# Approx walking distances (km)
g.add_edge("Fisher Library", "New Law Building", 0.2)
g.add_edge("Fisher Library", "Wentworth Building", 0.3)
g.add_edge("Fisher Library", "Quadrangle", 0.15)
g.add_edge("New Law Building", "Abercrombie Building", 0.5)
g.add_edge("Abercrombie Building", "Merewether Building", 0.25)
g.add_edge("Merewether Building", "Wentworth Building", 0.35)
g.add_edge("Quadrangle", "Great Hall", 0.1)
g.add_edge("Great Hall", "Manning House", 0.25)
g.add_edge("Manning House", "Wentworth Building", 0.2)
g.add_edge("Wentworth Building", "Charles Perkins Centre", 0.6)

# Example: shortest path from Fisher Library → Charles Perkins Centre
result = dijkstra(g, "Fisher Library", "Charles Perkins Centre",
                  emission_rate_kg_per_km=0.18)  # 0.18 kg/km (small petrol car)

print("Shortest path:", " → ".join(result.path))
print(f"Distance: {result.distance_km:.2f} km")
print(f"Estimated emissions: {result.emissions_kg:.2f} kg CO₂")
