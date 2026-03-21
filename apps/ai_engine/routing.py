import math
import heapq
from typing import List, Dict, Tuple, Any

class RouteOptimizer:
    def __init__(self):
        # Adjacency list: {node: {neighbor: {attr: val}}}
        self.graph: Dict[str, Dict[str, Dict[str, Any]]] = {}
        self.nodes: Dict[str, tuple] = {} # {name: (lat, lng)}
        self._build_mock_graph()

    def _build_mock_graph(self):
        """Builds a sample graph for demonstration."""
        # Nodes: Cities/Junctions (lat, lng)
        self.nodes = {
            "Mumbai": (19.0760, 72.8777),
            "Pune": (18.5204, 73.8567),
            "Nasik": (19.9975, 73.7898),
            "Surat": (21.1702, 72.8311),
            "Thane": (19.2183, 72.9781)
        }
        
        # Init graph structure
        for node in self.nodes:
            self.graph[node] = {}

        # Edges: Roads with attributes
        edges = [
            ("Mumbai", "Thane", {"distance": 25, "road_quality": 8, "traffic": 9}),
            ("Thane", "Nasik", {"distance": 150, "road_quality": 7, "traffic": 5}),
            ("Thane", "Pune", {"distance": 140, "road_quality": 9, "traffic": 6}), # Expressway
            ("Mumbai", "Pune", {"distance": 150, "road_quality": 4, "traffic": 8}), # Old Ghat Road (Bad quality)
            ("Nasik", "Surat", {"distance": 200, "road_quality": 6, "traffic": 4})
        ]

        for u, v, data in edges:
            # Undirected graph
            self.graph[u][v] = data
            self.graph[v][u] = data

    def _cost_function(self, u, v, edge_attr):
        """
        Custom Cost Function for A*
        Optimize for: Time (Primary) + Fuel Efficiency (Secondary) + Road Safety (Tertiary)
        """
        distance = edge_attr.get("distance", 1)
        quality = edge_attr.get("road_quality", 5) # 1-10
        traffic = edge_attr.get("traffic", 5) # 1-10

        # Calculate Estimated Time (Distance / Avg Speed)
        base_speed = 60 # km/h
        speed_factor = (quality / 10) * (1 - (traffic / 20)) # simple modifier
        estimated_speed = base_speed * max(0.2, speed_factor)
        
        time_hours = distance / estimated_speed

        # Fuel Penalty (Hilly/Bad roads consume more)
        fuel_penalty = (10 - quality) * 0.5 

        # Final Weight = Time + 20% of Distance (Fuel) + Penalty
        weight = time_hours + (distance * 0.05) + fuel_penalty
        return weight

    def _heuristic(self, u, v):
        """Heuristic for A*: Straight line distance (Haversine) / Max Speed"""
        pos_u = self.nodes.get(u)
        pos_v = self.nodes.get(v)
        
        if not pos_u or not pos_v:
            return 0

        # Simple Euclidean approximation converted to km (approx 111km per degree)
        d = math.sqrt((pos_u[0]-pos_v[0])**2 + (pos_u[1]-pos_v[1])**2) * 111
        
        max_speed = 100 # km/h
        return d / max_speed

    def calculate_optimal_route(self, start_node: str, end_node: str) -> Dict[str, Any]:
        """
        Returns the best path using A* Algorithm manually implemented.
        """
        if start_node not in self.graph or end_node not in self.graph:
            return {"error": "Start or End node not found in graph"}

        # Priority Queue: (f_score, current_node)
        open_set = []
        heapq.heappush(open_set, (0, start_node))
        
        came_from = {}
        
        g_score = {node: float('inf') for node in self.graph}
        g_score[start_node] = 0
        
        f_score = {node: float('inf') for node in self.graph}
        f_score[start_node] = self._heuristic(start_node, end_node)

        while open_set:
            _, current = heapq.heappop(open_set)

            if current == end_node:
                return self._reconstruct_path(came_from, current)

            for neighbor, attr in self.graph[current].items():
                tentative_g_score = g_score[current] + self._cost_function(current, neighbor, attr)

                if tentative_g_score < g_score[neighbor]:
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g_score
                    f_score[neighbor] = tentative_g_score + self._heuristic(neighbor, end_node)
                    heapq.heappush(open_set, (f_score[neighbor], neighbor))

        return {"error": "No path found"}

    def _reconstruct_path(self, came_from: Dict[str, str], current: str) -> Dict[str, Any]:
        path = [current]
        while current in came_from:
            current = came_from[current]
            path.append(current)
        path.reverse()

        # Calculate totals
        total_dist = 0
        total_optimization_score = 0
        
        for i in range(len(path)-1):
            u, v = path[i], path[i+1]
            attr = self.graph[u][v]
            total_dist += attr.get('distance', 0)
            total_optimization_score += self._cost_function(u, v, attr)

        return {
            "route": path,
            "total_distance_km": total_dist,
            "optimization_score": round(total_optimization_score, 2),
            "steps": len(path)
        }

# Example Usage
if __name__ == "__main__":
    optimizer = RouteOptimizer()
    
    # Example: Mumbai to Pune
    # Should choose Thane -> Pune (Expressway) over Mumbai -> Pune (Old Road) due to quality
    route = optimizer.calculate_optimal_route("Mumbai", "Pune")
    print("Optimal Route:", route)
