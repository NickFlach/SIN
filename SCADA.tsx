import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWebSocket } from "@/lib/useWebSocket";
import { type SCADADevice } from "@shared/schema";
import { Activity } from "lucide-react";
import DeviceHeatmap from "@/components/DeviceHeatmap";
import { useState, useMemo } from "react";

export default function SCADA() {
  const [vendorFilter, setVendorFilter] = useState<string>("all");

  const { data: devices = [] } = useQuery<SCADADevice[]>({ 
    queryKey: ["/api/devices"]
  });

  const { lastMessage } = useWebSocket();

  const vendors = useMemo(() => {
    const uniqueVendors = new Set(devices.map(d => d.vendor));
    return Array.from(uniqueVendors);
  }, [devices]);

  const filteredDevices = useMemo(() => {
    return devices.filter(device => 
      vendorFilter === "all" || device.vendor === vendorFilter
    );
  }, [devices, vendorFilter]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">SCADA Monitoring</h1>
        <div className="flex items-center gap-4">
          <Select value={vendorFilter} onValueChange={setVendorFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              {vendors.map(vendor => (
                <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            {filteredDevices.length} Devices
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global Device Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <DeviceHeatmap devices={filteredDevices} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDevices.map(device => (
          <Card key={device.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{device.name}</span>
                <Badge 
                  variant={
                    device.status === "online" ? "default" : 
                    device.status === "warning" ? "secondary" : 
                    "destructive"
                  }
                >
                  {device.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vendor</span>
                  <span>{device.vendor}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Category</span>
                  <span>{device.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Model</span>
                  <span>{device.model}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Protocol</span>
                  <span>{device.protocol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Firmware</span>
                  <span>{device.firmware}</span>
                </div>

                <div className="pt-2 mt-2 border-t">
                  <div className="text-sm font-medium mb-2">Metrics</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CPU Load</span>
                      <span>{device.metrics.cpuLoad}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Memory Usage</span>
                      <span>{device.metrics.memoryUsage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Network Latency</span>
                      <span>{device.metrics.networkLatency}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Connected Devices</span>
                      <span>{device.metrics.connectedDevices}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t">
                  <div className="text-sm text-muted-foreground">
                    Last Backup: {new Date(device.metrics.lastBackup).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Facility: {device.location.facility}, {device.location.country}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Uptime: {Math.floor(device.metrics.uptimeHours / 24)} days, {device.metrics.uptimeHours % 24}h
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}