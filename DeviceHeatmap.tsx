import { memo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker
} from "react-simple-maps";
import { type SCADADevice } from "@shared/schema";

// World map data
const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

function DeviceHeatmap({ devices }: { devices: SCADADevice[] }) {
  console.log("DeviceHeatmap devices:", devices);

  return (
    <div className="w-full h-[400px] bg-card rounded-lg">
      <ComposableMap
        projectionConfig={{
          scale: 147,
          center: [0, 0]
        }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="var(--border)"
                stroke="var(--border)"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none", fill: "var(--primary)" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {devices.map((device) => (
          <Marker
            key={device.id}
            coordinates={[device.location.lng, device.location.lat]}
          >
            <circle
              r={4}
              fill="var(--primary)"
              stroke="var(--background)"
              strokeWidth={2}
              opacity={0.8}
            />
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
}

export default memo(DeviceHeatmap);