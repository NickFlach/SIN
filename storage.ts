import {
  type Node,
  type InsertNode,
  type AIModel,
  type InsertAIModel,
  type SCADADevice,
  type InsertSCADADevice,
  type GovernanceProposal,
  type InsertGovernanceProposal,
  type Application,
  type InsertApplication,
  type Integration,
  type InsertIntegration,
  type DeveloperKey,
  nodes,
  aiModels,
  scadaDevices,
  governanceProposals,
  applications,
  integrations,
  developerKeys,
  type RegionSync,
  type InsertRegionSync,
  regionSyncs,
  type Region,
  REGIONS
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, isNull } from "drizzle-orm";

export interface IStorage {
  // Applications
  getApplications(): Promise<Application[]>;
  getApplication(id: number): Promise<Application | undefined>;
  createApplication(app: InsertApplication): Promise<Application>;
  updateApplicationMetrics(id: number, metrics: any): Promise<Application>;
  getApplicationsByRegion(region: Region): Promise<Application[]>; // New region-specific method

  // Integrations
  getIntegrations(appId: number): Promise<Integration[]>;
  getIntegration(id: number): Promise<Integration | undefined>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegrationStatus(id: number, status: string): Promise<Integration>;
  getIntegrationsByRegion(region: Region): Promise<Integration[]>; // New region-specific method

  // Developer Keys
  getDeveloperKeys(appId: number): Promise<DeveloperKey[]>;
  getDeveloperKey(id: number): Promise<DeveloperKey | undefined>;
  updateDeveloperKeyAccess(id: number): Promise<DeveloperKey>;

  // Nodes
  getNodes(): Promise<Node[]>;
  getNode(id: number): Promise<Node | undefined>;
  updateNodeStatus(id: number, status: string): Promise<Node>;
  getNodesByRegion(region: Region): Promise<Node[]>; // New region-specific method

  // AI Models
  getModels(): Promise<AIModel[]>;
  getModel(id: number): Promise<AIModel | undefined>;
  getModelById(id: number): Promise<AIModel | undefined>;
  updateModelProgress(id: number, progress: number): Promise<AIModel>;
  getModelByName(name: string): Promise<AIModel | undefined>;
  createModel(model: InsertAIModel): Promise<AIModel>;
  updateModel(id: number, model: Partial<AIModel>): Promise<AIModel>;
  getModelsByRegion(region: Region): Promise<AIModel[]>; // New region-specific method

  // SCADA
  getDevices(): Promise<SCADADevice[]>;
  getDevice(id: number): Promise<SCADADevice | undefined>;
  updateDeviceReadings(id: number, readings: any): Promise<SCADADevice>;
  getDeviceByName(name: string): Promise<SCADADevice | undefined>;
  createDevice(device: InsertSCADADevice): Promise<SCADADevice>;
  updateDevice(id: number, updates: Partial<SCADADevice>): Promise<SCADADevice>;
  getDevicesByRegion(region: Region): Promise<SCADADevice[]>; // New region-specific method

  // Governance
  getProposals(): Promise<GovernanceProposal[]>;
  getProposal(id: number): Promise<GovernanceProposal | undefined>;
  updateProposalVotes(id: number, votes: number): Promise<GovernanceProposal>;
  updateProposalStatus(id: number, status: string): Promise<GovernanceProposal>;
  getProposalsByRegion(region: Region): Promise<GovernanceProposal[]>; // New region-specific method
  getGlobalProposals(): Promise<GovernanceProposal[]>; // Get proposals that affect the entire network
  updateProposalBlockchainInfo(id: number, txId: string, address: string): Promise<GovernanceProposal>; // Add blockchain transaction info
  createProposal(proposal: InsertGovernanceProposal): Promise<GovernanceProposal>; // Create a new proposal

  // Region Syncs
  createRegionSync(sync: InsertRegionSync): Promise<RegionSync>;
  getRegionSyncs(): Promise<RegionSync[]>;
  updateRegionSyncStatus(id: number, status: string, errorMessage?: string): Promise<RegionSync>;
  getPendingSyncs(): Promise<RegionSync[]>;
}

export class DatabaseStorage implements IStorage {
  // Application Methods
  async getApplications(): Promise<Application[]> {
    return await db.select().from(applications);
  }

  async getApplication(id: number): Promise<Application | undefined> {
    const [app] = await db.select().from(applications).where(eq(applications.id, id));
    return app;
  }

  async createApplication(app: InsertApplication): Promise<Application> {
    const [created] = await db
      .insert(applications)
      .values(app)
      .returning();
    return created;
  }

  async updateApplicationMetrics(id: number, metrics: any): Promise<Application> {
    const [updated] = await db
      .update(applications)
      .set({
        metrics,
        lastUpdated: new Date(),
      })
      .where(eq(applications.id, id))
      .returning();
    return updated;
  }

  async getApplicationsByRegion(region: Region): Promise<Application[]> {
    return await db
      .select()
      .from(applications)
      .where(eq(applications.region, region));
  }

  // Integration Methods
  async getIntegrations(appId: number): Promise<Integration[]> {
    return await db
      .select()
      .from(integrations)
      .where(eq(integrations.appId, appId));
  }

  async getIntegration(id: number): Promise<Integration | undefined> {
    const [integration] = await db
      .select()
      .from(integrations)
      .where(eq(integrations.id, id));
    return integration;
  }

  async createIntegration(integration: InsertIntegration): Promise<Integration> {
    const [created] = await db
      .insert(integrations)
      .values(integration)
      .returning();
    return created;
  }

  async updateIntegrationStatus(id: number, status: string): Promise<Integration> {
    const [updated] = await db
      .update(integrations)
      .set({ status })
      .where(eq(integrations.id, id))
      .returning();
    return updated;
  }

  async getIntegrationsByRegion(region: Region): Promise<Integration[]> {
    return await db
      .select()
      .from(integrations)
      .where(eq(integrations.region, region));
  }

  // Developer Key Methods
  async getDeveloperKeys(appId: number): Promise<DeveloperKey[]> {
    return await db
      .select()
      .from(developerKeys)
      .where(eq(developerKeys.appId, appId));
  }

  async getDeveloperKey(id: number): Promise<DeveloperKey | undefined> {
    const [key] = await db
      .select()
      .from(developerKeys)
      .where(eq(developerKeys.id, id));
    return key;
  }

  async updateDeveloperKeyAccess(id: number): Promise<DeveloperKey> {
    const [updated] = await db
      .update(developerKeys)
      .set({ lastAccessed: new Date() })
      .where(eq(developerKeys.id, id))
      .returning();
    return updated;
  }

  // Node Methods
  async getNodes(): Promise<Node[]> {
    return await db.select().from(nodes);
  }

  async getNode(id: number): Promise<Node | undefined> {
    const [node] = await db.select().from(nodes).where(eq(nodes.id, id));
    return node;
  }

  async updateNodeStatus(id: number, status: string): Promise<Node> {
    const [updated] = await db
      .update(nodes)
      .set({ status })
      .where(eq(nodes.id, id))
      .returning();
    return updated;
  }

  async getNodesByRegion(region: Region): Promise<Node[]> {
    return await db
      .select()
      .from(nodes)
      .where(eq(nodes.region, region));
  }

  // AI Model Methods
  async getModels(): Promise<AIModel[]> {
    return await db.select().from(aiModels);
  }

  async getModel(id: number): Promise<AIModel | undefined> {
    const [model] = await db.select().from(aiModels).where(eq(aiModels.id, id));
    return model;
  }

  // Add the new getModelById method (same implementation as getModel)
  async getModelById(id: number): Promise<AIModel | undefined> {
    return this.getModel(id);
  }

  async updateModelProgress(id: number, progress: number): Promise<AIModel> {
    const [updated] = await db
      .update(aiModels)
      .set({ progress })
      .where(eq(aiModels.id, id))
      .returning();
    return updated;
  }

  async getModelByName(name: string): Promise<AIModel | undefined> {
    const [model] = await db
      .select()
      .from(aiModels)
      .where(eq(aiModels.name, name));
    return model;
  }

  async createModel(model: InsertAIModel): Promise<AIModel> {
    const [created] = await db
      .insert(aiModels)
      .values(model)
      .returning();
    return created;
  }

  async updateModel(id: number, model: Partial<AIModel>): Promise<AIModel> {
    const [updated] = await db
      .update(aiModels)
      .set(model)
      .where(eq(aiModels.id, id))
      .returning();
    return updated;
  }

  async getModelsByRegion(region: Region): Promise<AIModel[]> {
    return await db
      .select()
      .from(aiModels)
      .where(
        or(
          eq(aiModels.region, region),
          isNull(aiModels.region)
        )
      );
  }

  // SCADA Methods
  async getDevices(): Promise<SCADADevice[]> {
    return await db.select().from(scadaDevices);
  }

  async getDevice(id: number): Promise<SCADADevice | undefined> {
    const [device] = await db.select().from(scadaDevices).where(eq(scadaDevices.id, id));
    return device;
  }

  async updateDeviceReadings(id: number, readings: any): Promise<SCADADevice> {
    const [updated] = await db
      .update(scadaDevices)
      .set({ metrics: readings })
      .where(eq(scadaDevices.id, id))
      .returning();
    return updated;
  }

  async getDeviceByName(name: string): Promise<SCADADevice | undefined> {
    const [device] = await db
      .select()
      .from(scadaDevices)
      .where(eq(scadaDevices.name, name));
    return device;
  }

  async createDevice(device: InsertSCADADevice): Promise<SCADADevice> {
    const [created] = await db
      .insert(scadaDevices)
      .values(device)
      .returning();
    return created;
  }

  async updateDevice(id: number, updates: Partial<SCADADevice>): Promise<SCADADevice> {
    const [updated] = await db
      .update(scadaDevices)
      .set(updates)
      .where(eq(scadaDevices.id, id))
      .returning();
    return updated;
  }

  async getDevicesByRegion(region: Region): Promise<SCADADevice[]> {
    return await db
      .select()
      .from(scadaDevices)
      .where(
        or(
          eq(scadaDevices.region, region),
          isNull(scadaDevices.region)
        )
      );
  }

  // Governance Methods
  async getProposals(): Promise<GovernanceProposal[]> {
    return await db.select().from(governanceProposals);
  }

  async getProposal(id: number): Promise<GovernanceProposal | undefined> {
    const [proposal] = await db.select().from(governanceProposals).where(eq(governanceProposals.id, id));
    return proposal;
  }

  async updateProposalVotes(id: number, votes: number): Promise<GovernanceProposal> {
    const [updated] = await db
      .update(governanceProposals)
      .set({ votes })
      .where(eq(governanceProposals.id, id))
      .returning();
    return updated;
  }
  
  async updateProposalStatus(id: number, status: string): Promise<GovernanceProposal> {
    const [updated] = await db
      .update(governanceProposals)
      .set({ status })
      .where(eq(governanceProposals.id, id))
      .returning();
    return updated;
  }

  async getProposalsByRegion(region: Region): Promise<GovernanceProposal[]> {
    return await db
      .select()
      .from(governanceProposals)
      .where(
        and(
          eq(governanceProposals.region, region),
          eq(governanceProposals.isGlobal, false)
        )
      );
  }

  async getGlobalProposals(): Promise<GovernanceProposal[]> {
    return await db
      .select()
      .from(governanceProposals)
      .where(eq(governanceProposals.isGlobal, true));
  }
  
  async updateProposalBlockchainInfo(id: number, txId: string, address: string): Promise<GovernanceProposal> {
    const [updated] = await db
      .update(governanceProposals)
      .set({ 
        blockchainTxId: txId,
        blockchainAddress: address
      })
      .where(eq(governanceProposals.id, id))
      .returning();
    return updated;
  }
  
  async createProposal(proposal: InsertGovernanceProposal): Promise<GovernanceProposal> {
    const [created] = await db
      .insert(governanceProposals)
      .values({
        ...proposal,
        createdAt: new Date(),
        expiresAt: proposal.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default: 7 days from now
      })
      .returning();
    return created;
  }

  // Region Sync Methods
  async createRegionSync(sync: InsertRegionSync): Promise<RegionSync> {
    const [created] = await db
      .insert(regionSyncs)
      .values(sync)
      .returning();
    return created;
  }

  async getRegionSyncs(): Promise<RegionSync[]> {
    return await db.select().from(regionSyncs);
  }

  async updateRegionSyncStatus(id: number, status: string, errorMessage?: string): Promise<RegionSync> {
    // First get the current retryCount
    const [currentSync] = await db
      .select({ retryCount: regionSyncs.retryCount })
      .from(regionSyncs)
      .where(eq(regionSyncs.id, id));

    // Then update with the new values
    const [updated] = await db
      .update(regionSyncs)
      .set({ 
        syncStatus: status,
        ...(errorMessage && { errorMessage }),
        ...(status === 'failed' && { retryCount: (currentSync?.retryCount || 0) + 1 }),
      })
      .where(eq(regionSyncs.id, id))
      .returning();
    return updated;
  }

  async getPendingSyncs(): Promise<RegionSync[]> {
    return await db
      .select()
      .from(regionSyncs)
      .where(eq(regionSyncs.syncStatus, 'pending'));
  }
}

export const storage = new DatabaseStorage();