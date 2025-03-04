import { storage } from '../storage';
import { type SCADADevice } from '@shared/schema';
import { type Facility, FACILITIES as FACILITY_LIST } from '@shared/schema';

// Major SCADA vendors and their typical equipment
const VENDORS = {
  "Rockwell Automation": {
    categories: ["PLC", "HMI", "DCS"] as const,
    models: {
      PLC: ["ControlLogix 1756", "CompactLogix 5380", "Micro800"],
      HMI: ["PanelView 7+", "PanelView 800", "PanelView Plus 7"],
      DCS: ["PlantPAx", "ProcessLogix"]
    },
    protocols: ["EtherNet/IP", "ControlNet", "DeviceNet"],
  },
  "Siemens": {
    categories: ["PLC", "HMI", "DCS"] as const,
    models: {
      PLC: ["S7-1500", "S7-1200", "S7-300"],
      HMI: ["SIMATIC HMI", "Comfort Panels", "Mobile Panels"],
      DCS: ["SIMATIC PCS 7", "SIMATIC PCS neo"]
    },
    protocols: ["PROFINET", "PROFIBUS", "S7 Protocol"],
  },
  "Emerson": {
    categories: ["DCS", "PLC", "RTU"] as const,
    models: {
      DCS: ["DeltaV", "Ovation", "RS3"],
      PLC: ["RX3i", "RX7i"],
      RTU: ["ControlWave", "ROC800"]
    },
    protocols: ["HART", "Foundation Fieldbus", "Modbus"],
  },
  "Yokogawa": {
    categories: ["DCS", "PLC", "RTU"] as const,
    models: {
      DCS: ["CENTUM VP", "CENTUM CS", "ProSafe-RS"],
      PLC: ["FA-M3V", "FA-M3"],
      RTU: ["STARDOM", "FCN-RTU"]
    },
    protocols: ["Vnet/IP", "FL-net", "Modbus"],
  },
  "Schneider Electric": {
    categories: ["PLC", "HMI", "RTU"] as const,
    models: {
      PLC: ["Modicon M580", "Modicon M340", "Modicon Quantum"],
      HMI: ["Magelis", "Harmony"],
      RTU: ["SCADAPack", "Easergy"]
    },
    protocols: ["Modbus TCP", "EtherNet/IP", "IEC 60870-5-104"],
  }
} as const;

// Use imported facilities list
const FACILITIES = FACILITY_LIST;

function getRandomLocation() {
  const facility = FACILITIES[Math.floor(Math.random() * FACILITIES.length)];

  // Add some random offset within ~50km for visual distribution
  // Scale factor: 0.5 degrees is approximately 55km at the equator
  const latOffset = (Math.random() - 0.5) * 0.5;
  const lngOffset = (Math.random() - 0.5) * 0.5;

  const location = {
    lat: facility.lat + latOffset,
    lng: facility.lng + lngOffset,
    facility: facility.name,
    country: facility.country
  };

  // Debug log
  console.log(`Generated location for ${facility.name}: `, location);

  return location;
}

function generateMetrics(category: string) {
  return {
    cpuLoad: Math.floor(Math.random() * 100),
    memoryUsage: Math.floor(Math.random() * 100),
    networkLatency: Math.floor(Math.random() * 200),
    uptimeHours: Math.floor(Math.random() * 8760), // Up to 1 year
    lastBackup: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Within last week
    connectedDevices: Math.floor(Math.random() * 50),
    errorRate: Math.random() * 5,
    batteryLevel: category === "RTU" ? Math.floor(Math.random() * 100) : undefined
  };
}

function generateConfiguration(vendor: string, protocols: string[]) {
  return {
    supportedProtocols: protocols,
    redundancyMode: Math.random() > 0.5 ? "active-standby" : "none",
    securityLevel: ["basic", "standard", "advanced"][Math.floor(Math.random() * 3)],
    certificateExpiry: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
  };
}

async function createInitialDevices() {
  console.log('Creating initial SCADA devices...');

  for (const [vendor, info] of Object.entries(VENDORS)) {
    for (const category of info.categories) {
      const models = info.models[category];
      for (const model of models) {
        try {
          const deviceName = `${vendor}-${model}`;
          const existingDevice = await storage.getDeviceByName(deviceName);

          if (existingDevice) {
            console.log(`Device ${deviceName} already exists`);
            continue;
          }

          const status = Math.random() > 0.8 ? "warning" :
                        Math.random() > 0.1 ? "online" : "offline";

          await storage.createDevice({
            name: deviceName,
            vendor,
            category,
            model,
            protocol: info.protocols[Math.floor(Math.random() * info.protocols.length)],
            status,
            firmware: `${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
            location: getRandomLocation(),
            metrics: generateMetrics(category),
            configuration: generateConfiguration(vendor, info.protocols),
            isDemo: true
          });

          console.log(`Created device: ${deviceName}`);
        } catch (error) {
          console.error(`Error creating device ${vendor}-${model}:`, error);
        }
      }
    }
  }
}

async function updateDeviceMetrics() {
  console.log('Updating SCADA device metrics...');
  const devices = await storage.getDevices();

  for (const device of devices) {
    try {
      // Randomly update status occasionally
      const newStatus = Math.random() > 0.95 ? "warning" :
                       Math.random() > 0.98 ? "offline" : "online";

      // Generate new metrics
      const newMetrics = generateMetrics(device.category);

      // Update the device
      await storage.updateDevice(device.id, {
        status: newStatus,
        metrics: newMetrics
      });

      console.log(`Updated device metrics: ${device.name}`);
    } catch (error) {
      console.error(`Error updating device ${device.name}:`, error);
    }
  }
}

// Initialize devices and start regular updates
setTimeout(async () => {
  console.log('Initializing SCADA aggregator service...');
  await createInitialDevices();
}, 5000); // Wait 5 seconds after server start

// Update metrics every minute
const UPDATE_INTERVAL = 60 * 1000; // 1 minute
setInterval(() => {
  updateDeviceMetrics().catch(console.error);
}, UPDATE_INTERVAL);