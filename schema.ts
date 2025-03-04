import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export type Facility = {
  name: string;
  country: string;
  lat: number;
  lng: number;
};

// Define East-West regions for our decentralized approach
export const REGIONS = {
  EAST: "east",
  WEST: "west",
  NULL_ISLAND: "null_island", // Added new region option
} as const;

export type Region = typeof REGIONS[keyof typeof REGIONS];

// Update facilities to include region assignment
export const FACILITIES = [
  // WEST REGION - Americas and Western Europe
  { name: "Central Processing Plant", country: "United States", lat: 40.7128, lng: -74.0060, region: REGIONS.WEST }, // New York
  { name: "Gulf Coast Operations", country: "United States", lat: 29.7604, lng: -95.3698, region: REGIONS.WEST }, // Houston
  { name: "European Control Center", country: "France", lat: 48.8566, lng: 2.3522, region: REGIONS.WEST }, // Paris
  { name: "Nordic Processing Center", country: "Sweden", lat: 59.3293, lng: 18.0686, region: REGIONS.WEST }, // Stockholm
  { name: "Mountain Research Station", country: "Switzerland", lat: 46.6863, lng: 7.8632, region: REGIONS.WEST }, // Grindelwald
  { name: "Coastal Monitoring Station", country: "Chile", lat: -53.1638, lng: -70.9171, region: REGIONS.WEST }, // Punta Arenas
  { name: "Island Control Station", country: "Iceland", lat: 65.6835, lng: -18.0878, region: REGIONS.WEST }, // Akureyri
  { name: "Rainforest Research Post", country: "Brazil", lat: -3.7436, lng: -73.2516, region: REGIONS.WEST }, // Iquitos
  { name: "Tundra Operations Base", country: "Canada", lat: 68.3607, lng: -133.7230, region: REGIONS.WEST }, // Inuvik
  { name: "Mediterranean Outpost", country: "Greece", lat: 36.4072, lng: 25.4567, region: REGIONS.WEST }, // Santorini
  { name: "Andean Research Center", country: "Peru", lat: -13.1631, lng: -72.5450, region: REGIONS.WEST }, // Machu Picchu

  // EAST REGION - Asia, Eastern Europe, Africa, and Oceania
  { name: "Eastern Production Facility", country: "Germany", lat: 52.5200, lng: 13.4050, region: REGIONS.EAST }, // Berlin
  { name: "Asia Manufacturing Hub", country: "Japan", lat: 35.6762, lng: 139.6503, region: REGIONS.EAST }, // Tokyo
  { name: "Pacific Rim Facility", country: "Singapore", lat: 1.3521, lng: 103.8198, region: REGIONS.EAST }, // Singapore
  { name: "Desert Operations Hub", country: "Australia", lat: -23.6980, lng: 133.8807, region: REGIONS.EAST }, // Alice Springs
  { name: "Arctic Research Facility", country: "Norway", lat: 78.2232, lng: 15.6267, region: REGIONS.EAST }, // Longyearbyen
  { name: "Rural Processing Center", country: "India", lat: 34.1526, lng: 77.5771, region: REGIONS.EAST }, // Leh
  { name: "Grasslands Monitoring Hub", country: "Kenya", lat: 0.5142, lng: 35.2728, region: REGIONS.EAST }, // Eldoret
  { name: "Alpine Data Center", country: "New Zealand", lat: -45.0312, lng: 168.6626, region: REGIONS.EAST }, // Queenstown
  { name: "Sahara Monitoring Station", country: "Morocco", lat: 31.5085, lng: -5.1294, region: REGIONS.EAST }, // Merzouga
  { name: "Steppe Processing Unit", country: "Mongolia", lat: 47.9200, lng: 106.9177, region: REGIONS.EAST },  // Ulaanbaatar

  // NULL ISLAND - Special zone for global resources
  { name: "International Management Hub", country: "International Waters", lat: 0, lng: 0, region: REGIONS.NULL_ISLAND }, // Null Island
  { name: "Global Coordination Center", country: "International", lat: 0, lng: 0, region: REGIONS.NULL_ISLAND }
] as const;

export const nodes = pgTable("nodes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull(), // online, offline, training
  type: text("type").notNull(), // compute, storage, validator
  performance: integer("performance").notNull(), // 0-100
  population: integer("population").notNull().default(0),
  region: text("region").notNull().default(REGIONS.WEST), // Added region field for East-West division
  location: jsonb("location").$type<{
    lat: number;
    lng: number;
    city: string;
    country: string;
    timezone: string;
    continent: string;
  }>().default({
    lat: 0,
    lng: 0,
    city: "Demo City",
    country: "Demo Country",
    timezone: "UTC",
    continent: "Unknown"
  }).notNull(),
  metrics: jsonb("metrics").$type<{
    networkLatency: number;
    uptimePercent: number;
    requestsPerMinute: number;
    errorRate: number;
    bandwidthUsage: number;
  }>().default({
    networkLatency: 0,
    uptimePercent: 100,
    requestsPerMinute: 0,
    errorRate: 0,
    bandwidthUsage: 0
  }).notNull(),
  isDemo: boolean("is_demo").default(true).notNull(),
});

export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull(), // training, complete, failed
  progress: integer("progress").notNull(), // 0-100
  accuracy: integer("accuracy").notNull(), // 0-100
  nodeId: integer("node_id").notNull(),
  region: text("region"), // Added region field to track which region the model is being trained in
  trainingData: jsonb("training_data").$type<{
    datasetSize: number;
    epochsCompleted: number;
    lossRate: number;
    modelType?: string;
    task?: string;
    sourceRepo?: string;
    sourcePlatform?: 'huggingface' | 'github';
    lastUpdated?: string;
  }>().default({
    datasetSize: 1000,
    epochsCompleted: 0,
    lossRate: 0
  }).notNull(),
  isDemo: boolean("is_demo").default(false).notNull(),
  isExperimental: boolean("is_experimental").default(false),
  description: text("description"),
});

export const scadaDevices = pgTable("scada_devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  vendor: text("vendor").notNull(), // Rockwell, Siemens, etc.
  category: text("category").notNull(), // PLC, DCS, HMI, RTU
  model: text("model").notNull(),
  protocol: text("protocol").notNull(), // Modbus, Profinet, EtherNet/IP
  status: text("status").notNull(), // online, offline, warning
  firmware: text("firmware").default("1.0.0").notNull(),
  region: text("region"), // Added region field for East-West division
  location: jsonb("location").$type<{
    lat: number;
    lng: number;
    facility: string;
    country: string;
  }>().default({ lat: 0, lng: 0, facility: "Demo Facility", country: "Demo Country" }).notNull(),
  metrics: jsonb("metrics").$type<{
    cpuLoad: number;
    memoryUsage: number;
    networkLatency: number;
    uptimeHours: number;
    lastBackup: string;
    connectedDevices: number;
    errorRate: number;
    batteryLevel?: number;
  }>().default({
    cpuLoad: 0,
    memoryUsage: 0,
    networkLatency: 0,
    uptimeHours: 0,
    lastBackup: new Date().toISOString(),
    connectedDevices: 0,
    errorRate: 0
  }).notNull(),
  configuration: jsonb("configuration").$type<{
    supportedProtocols: string[];
    redundancyMode: string;
    securityLevel: string;
    certificateExpiry?: string;
  }>().default({
    supportedProtocols: [],
    redundancyMode: "none",
    securityLevel: "standard"
  }).notNull(),
  isDemo: boolean("is_demo").default(true).notNull(),
});

export const governanceProposals = pgTable("governance_proposals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status").notNull(), // active, passed, failed
  votes: integer("votes").notNull(),
  threshold: integer("threshold").notNull(),
  description: text("description").default("Demo proposal description").notNull(),
  proposedBy: text("proposed_by").default("Demo Proposer").notNull(),
  region: text("region"), // Added region field to support region-specific governance
  isGlobal: boolean("is_global").default(false), // Flag for proposals that affect the entire network
  isDemo: boolean("is_demo").default(true).notNull(),
  blockchainTxId: text("blockchain_tx_id"), // Transaction ID on the blockchain
  blockchainAddress: text("blockchain_address"), // Blockchain address for verification
  impact: text("impact").default("medium"), // low, medium, high
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // When the proposal voting period ends
  category: text("category").default("general").notNull(), // infrastructure, policy, technical, security, etc.
  tags: text("tags").array(), // Array of tags for searchability and categorization
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull(), // active, maintenance, offline
  version: text("version").notNull(),
  type: text("type").notNull(), // core, plugin, extension
  region: text("region"), // Added region field for East-West division
  location: jsonb("location").$type<{
    lat: number;
    lng: number;
    region: string;
  }>().default({ lat: 0, lng: 0, region: "Null Island" }).notNull(),
  metrics: jsonb("metrics").$type<{
    cpu: number;
    memory: number;
    requestsPerSecond: number;
    maxRequests: number;
    uptime: number;
  }>().default({
    cpu: 0,
    memory: 0,
    requestsPerSecond: 0,
    maxRequests: 10000,
    uptime: 0
  }).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  isDemo: boolean("is_demo").default(true).notNull(),
});

export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  appId: integer("app_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // api, webhook, streaming
  status: text("status").notNull(), // active, inactive, error
  region: text("region"), // Added region field for cross-region integration tracking
  config: jsonb("config").$type<{
    url: string;
    method: string;
    baseUrl: string;
  }>().notNull(),
  metrics: jsonb("metrics").$type<{
    latency: number;
    successRate: number;
    requestCount: number;
  }>().default({
    latency: 0,
    successRate: 100,
    requestCount: 0
  }).notNull(),
  sampleData: jsonb("sample_data"),
  isDemo: boolean("is_demo").default(true).notNull(),
});

export const developerKeys = pgTable("developer_keys", {
  id: serial("id").primaryKey(),
  appId: integer("app_id").notNull(),
  apiKey: text("api_key").notNull(),
  permissions: jsonb("permissions").notNull(),
  rateLimit: integer("rate_limit").notNull(),
  region: text("region"), // Added region field for access control
  allowCrossRegion: boolean("allow_cross_region").default(false), // Permission for cross-region access
  lastAccessed: timestamp("last_accessed"),
  isDemo: boolean("is_demo").default(true).notNull(),
});

// For tracking cross-region data transfers and synchronization
export const regionSyncs = pgTable("region_syncs", {
  id: serial("id").primaryKey(),
  sourceRegion: text("source_region").notNull(),
  targetRegion: text("target_region").notNull(),
  resourceType: text("resource_type").notNull(), // nodes, models, apps, etc.
  resourceId: integer("resource_id").notNull(),
  syncStatus: text("sync_status").notNull(), // pending, completed, failed
  syncTime: timestamp("sync_time").defaultNow().notNull(),
  retryCount: integer("retry_count").default(0).notNull(),
  errorMessage: text("error_message"),
});

// Export types
export type Node = typeof nodes.$inferSelect;
export type AIModel = typeof aiModels.$inferSelect;
export type SCADADevice = typeof scadaDevices.$inferSelect;
export type GovernanceProposal = typeof governanceProposals.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Integration = typeof integrations.$inferSelect;
export type DeveloperKey = typeof developerKeys.$inferSelect;
export type RegionSync = typeof regionSyncs.$inferSelect;

// Export insert types
export type InsertNode = typeof nodes.$inferInsert;
export type InsertAIModel = typeof aiModels.$inferInsert;
export type InsertSCADADevice = typeof scadaDevices.$inferInsert;
export type InsertGovernanceProposal = typeof governanceProposals.$inferInsert;
export type InsertApplication = typeof applications.$inferInsert;
export type InsertIntegration = typeof integrations.$inferInsert;
export type InsertDeveloperKey = typeof developerKeys.$inferInsert;
export type InsertRegionSync = typeof regionSyncs.$inferInsert;