import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, LineChart, ListFilter, BarChart } from "lucide-react";
import { useState, useMemo } from "react";

interface ApiResultsProps<T> {
  title: string;
  data: T[] | undefined | null;
  isLoading: boolean;
  error: Error | null | unknown;
  renderItem: (item: T) => React.ReactNode;
  filterKey?: keyof T | string;
  countLabel?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  errorMessage?: string;
  showChartView?: boolean;
  onRefresh?: () => void;
  onItemClick?: (item: T) => void;
}

export function ApiIntegrationResults<T>({
  title,
  data,
  isLoading,
  error,
  renderItem,
  filterKey = "name",
  countLabel = "Items",
  emptyMessage = "No data found",
  loadingMessage = "Loading data...",
  errorMessage = "Unable to load data",
  showChartView = false,
  onRefresh,
  onItemClick
}: ApiResultsProps<T>) {
  const [filter, setFilter] = useState("");
  const [view, setView] = useState<"list" | "chart">("list");

  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter(item => {
      if (!filter) return true;

      const itemValue = item[filterKey as keyof T];
      if (itemValue === undefined) return true;

      return String(itemValue).toLowerCase().includes(filter.toLowerCase());
    });
  }, [data, filter, filterKey]);

  const handleItemClick = (item: T) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  return (
    <div className="pt-4 border-t">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {filteredData.length} {countLabel}
          </Badge>
          {onRefresh && (
            <Button variant="ghost" size="icon" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${title.toLowerCase()}...`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-8"
            />
          </div>

          {showChartView && (
            <Tabs value={view} onValueChange={(v) => setView(v as "list" | "chart")} className="w-[180px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list" className="flex items-center gap-1">
                  <ListFilter className="h-4 w-4" />
                  List
                </TabsTrigger>
                <TabsTrigger value="chart" className="flex items-center gap-1">
                  <BarChart className="h-4 w-4" />
                  Chart
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">
            {loadingMessage}
          </div>
        ) : error ? (
          <div className="text-center py-4 text-destructive">
            {errorMessage}
          </div>
        ) : !filteredData.length ? (
          <div className="text-center py-4 text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {view === "list" ? (
                <>
                  {filteredData.map((item, index) => (
                    <div 
                      key={index} 
                      onClick={() => handleItemClick(item)}
                      className={onItemClick ? "cursor-pointer" : ""}
                    >
                      {renderItem(item)}
                    </div>
                  ))}
                </>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="h-[240px] flex items-center justify-center text-muted-foreground">
                      <LineChart className="w-6 h-6 mr-2" />
                      Chart visualization would appear here
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}