import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useWebSocket } from "@/lib/useWebSocket";
import { type Node } from "@shared/schema";
import { Network, Search, MapPin, Activity, Globe2, Users, Map } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { FixedSizeGrid as Grid, GridChildComponentProps } from 'react-window';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
  type Geography as GeographyType
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";

const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const NodeCard = ({ node }: { node: Node }) => (
  <Card className="m-2">
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <span>{node.name}</span>
        <Badge
          variant={node.status === "online" ? "default" :
            node.status === "training" ? "secondary" : "destructive"}
        >
          {node.status}
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Type</span>
          <span>{node.type}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Location</span>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{node.location.city}, {node.location.country}</span>
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Population</span>
          <span>{formatNumber(node.population)}</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Performance</span>
            <span className="flex items-center gap-1">
              <Activity className="w-4 h-4" />
              {node.performance}%
            </span>
          </div>
          <Progress value={node.performance} className="h-1" />
        </div>
        <div className="pt-2 border-t text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-muted-foreground">Network Latency</div>
              <div>{node.metrics.networkLatency}ms</div>
            </div>
            <div>
              <div className="text-muted-foreground">Uptime</div>
              <div>{node.metrics.uptimePercent}%</div>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const MapView = ({ nodes, filteredNodes }: { nodes: Node[], filteredNodes: Node[] }) => {
  const maxPopulation = Math.max(...nodes.map(n => n.population));
  const populationScale = scaleLinear()
    .domain([0, maxPopulation])
    .range([2, 20]);

  return (
    <div className="w-full h-[400px] bg-secondary/5 rounded-lg overflow-hidden">
      <ComposableMap projection="geoMercator">
        <ZoomableGroup>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo: GeographyType) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#374151"
                  stroke="#1f2937"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>
          {filteredNodes.map((node) => (
            <Marker
              key={node.id}
              coordinates={[node.location.lng, node.location.lat]}
            >
              <circle
                r={populationScale(node.population)}
                fill={node.status === "online" ? "#10B981" :
                  node.status === "training" ? "#6366F1" : "#EF4444"}
                opacity={0.7}
                stroke="#fff"
                strokeWidth={1}
              />
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
};

export default function NodeMap() {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<string>("all");
  const [continent, setContinent] = useState<string>("all");
  const [view, setView] = useState<"grid" | "map">("map");
  const containerRef = useRef<HTMLDivElement>(null);
  const CARD_WIDTH = 400;
  const CARD_HEIGHT = 300;

  const { data: nodes = [] } = useQuery<Node[]>({
    queryKey: ["/api/nodes"]
  });

  const { lastMessage } = useWebSocket();

  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      const matchesSearch =
        node.name.toLowerCase().includes(search.toLowerCase()) ||
        node.location.city.toLowerCase().includes(search.toLowerCase()) ||
        node.location.country.toLowerCase().includes(search.toLowerCase());

      const matchesRegion = region === "all" || node.location.country === region;
      const matchesContinent = continent === "all" || node.location.continent === continent;

      return matchesSearch && matchesRegion && matchesContinent;
    });
  }, [nodes, search, region, continent]);

  const regions = useMemo(() => {
    const uniqueRegions = new Set(nodes.map(node => node.location.country));
    return Array.from(uniqueRegions).sort();
  }, [nodes]);

  const continents = useMemo(() => {
    const uniqueContinents = new Set(nodes.map(node => node.location.continent));
    return Array.from(uniqueContinents).sort();
  }, [nodes]);

  const stats = useMemo(() => {
    return {
      totalPopulation: nodes.reduce((sum, node) => sum + node.population, 0),
      avgPerformance: nodes.reduce((sum, node) => sum + node.performance, 0) / nodes.length,
      totalCountries: new Set(nodes.map(node => node.location.country)).size,
      activeNodes: nodes.filter(node => node.status === "online").length,
    };
  }, [nodes]);

  const GridCell = ({ columnIndex, rowIndex, style }: GridChildComponentProps) => {
    const nodeIndex = rowIndex * columnsCount + columnIndex;
    const node = filteredNodes[nodeIndex];

    if (!node) return null;

    return (
      <div style={style}>
        <NodeCard node={node} />
      </div>
    );
  };

  // Get container dimensions
  const containerWidth = containerRef.current?.offsetWidth || 1200;
  const containerHeight = containerRef.current?.offsetHeight || 800;
  const columnsCount = Math.floor(containerWidth / CARD_WIDTH);
  const rowCount = Math.ceil(filteredNodes.length / columnsCount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Global Node Network</h1>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-2">
            <Network className="w-4 h-4" />
            {nodes.length} Total Nodes
          </Badge>
          <Badge variant="outline" className="gap-2">
            <Globe2 className="w-4 h-4" />
            {stats.totalCountries} Countries
          </Badge>
          <Badge variant="outline" className="gap-2">
            <Users className="w-4 h-4" />
            {formatNumber(stats.totalPopulation)} Population
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeNodes}</div>
            <Progress
              value={(stats.activeNodes / nodes.length) * 100}
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search nodes by name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={continent} onValueChange={setContinent}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by continent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Continents</SelectItem>
            {continents.map(cont => (
              <SelectItem key={cont} value={cont}>
                {cont}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {regions.map(region => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={view}
          onValueChange={(value: "map" | "grid") => setView(value)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="View" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="map">
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4" />
                Map View
              </div>
            </SelectItem>
            <SelectItem value="grid">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4" />
                Grid View
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Showing {filteredNodes.length} of {nodes.length} nodes
          </p>
        </div>

        {view === "map" ? (
          <MapView nodes={nodes} filteredNodes={filteredNodes} />
        ) : (
          <div ref={containerRef} className="h-[calc(100vh-380px)]">
            <Grid
              columnCount={columnsCount}
              columnWidth={CARD_WIDTH}
              height={containerHeight}
              rowCount={rowCount}
              rowHeight={CARD_HEIGHT}
              width={containerWidth}
            >
              {GridCell}
            </Grid>
          </div>
        )}
      </div>
    </div>
  );
}