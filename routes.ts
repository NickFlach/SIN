import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import fetch from "node-fetch";
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { QuantumTeleportService } from './services/quantum-teleport';
import crypto from 'crypto'; // Added for random UUID generation
import { IdentityService } from './services/identity-service';
import { blockchainService } from './services/blockchain-service';

function broadcastUpdate(wss: WebSocketServer, type: string, data: any) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        const message = JSON.stringify({
          type,
          data: typeof data === 'object' ? data : { value: data }
        });
        client.send(message);
      } catch (error) {
        console.error('Error broadcasting update:', error);
      }
    }
  });
}

async function discoverEndpoints(url: string) {
  try {
    const response = await fetch(`${url}/api/endpoints`);
    if (response.ok) {
      return await response.json();
    }

    const testResponse = await fetch(url);
    if (testResponse.ok) {
      const data = await testResponse.json();
      return {
        baseUrl: url,
        available: true,
        sampleData: data,
        detectedEndpoints: [
          {
            path: '/',
            method: 'GET',
            sampleResponse: data
          }
        ]
      };
    }

    return {
      baseUrl: url,
      available: false,
      error: 'Could not connect to endpoint'
    };
  } catch (error) {
    console.error('Error discovering endpoints:', error);
    return {
      baseUrl: url,
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // ENHANCED Identity Service with better error handling
  app.post('/api/identity/identify', (req, res) => {
    try {
      console.log('Identity identification request received', {
        body: req.body,
        ip: req.ip,
        headers: req.headers
      });

      const { userAgent, location } = req.body;
      const headers = req.headers as Record<string, string>;

      if (!userAgent && !req.headers['user-agent']) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'User agent is required for identification',
          requiredFields: ['userAgent'] 
        });
      }

      // Generate fingerprint from user agent, IP, and headers
      const fingerprint = IdentityService.generateFingerprint(
        userAgent || req.headers['user-agent'] || '',
        req.ip || '',
        headers
      );

      // Hash the IP address for privacy
      const ipHash = IdentityService.hashIpAddress(req.ip || '');

      // Check if user already exists with this fingerprint
      const existingUser = IdentityService.getUserByFingerprint(fingerprint);

      if (existingUser) {
        console.log('Existing user found', { fingerprint, sessionId: existingUser.sessionId });
        // User already exists, return their session
        return res.json({
          status: 'existing',
          sessionId: existingUser.sessionId,
          selectedName: existingUser.selectedName
        });
      }

      // If location provided, hash it too
      let locationHash;
      if (location && location.latitude && location.longitude) {
        try {
          locationHash = IdentityService.hashLocation(location.latitude, location.longitude);
        } catch (error) {
          console.warn('Error hashing location data:', error);
          // Continue without location hash
        }
      }

      // Generate suggested names based on fingerprint and IP hash
      const suggestedNames = IdentityService.suggestNames(fingerprint, ipHash, locationHash);

      console.log('New user identification successful', { fingerprint });
      res.json({
        status: 'new',
        fingerprint,
        suggestedNames
      });
    } catch (error) {
      console.error('Error in identity identification:', error);
      res.status(500).json({ 
        status: 'error',
        message: 'Failed to process identification',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/identity/select-name', (req, res) => {
    try {
      console.log('Name selection request received', { body: req.body });

      const { fingerprint, selectedName } = req.body;

      if (!fingerprint || !selectedName) {
        return res.status(400).json({ 
          status: 'error',
          message: 'Missing required fields',
          requiredFields: ['fingerprint', 'selectedName'] 
        });
      }

      // Hash the IP address for privacy
      const ipHash = IdentityService.hashIpAddress(req.ip || '');

      // If location provided, hash it too
      let locationHash;
      if (req.body.location && req.body.location.latitude && req.body.location.longitude) {
        try {
          locationHash = IdentityService.hashLocation(
            req.body.location.latitude, 
            req.body.location.longitude
          );
        } catch (error) {
          console.warn('Error hashing location data:', error);
          // Continue without location hash
        }
      }

      // Create a new session
      try {
        const sessionId = IdentityService.createSession(fingerprint, ipHash, selectedName, locationHash);

        console.log('Session created successfully', { sessionId, selectedName });
        res.json({
          status: 'success',
          sessionId,
          selectedName
        });
      } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({
          status: 'error',
          message: 'Failed to create session',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } catch (error) {
      console.error('Error in identity name selection:', error);
      res.status(500).json({ 
        status: 'error',
        message: 'Failed to process name selection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/identity/validate', (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const userAgent = req.headers['user-agent'] || '';
      const ip = req.ip || '';
      const headers = req.headers as Record<string, string>;

      console.log('Session validation request received', { 
        sessionId: sessionId ? sessionId.substring(0, 8) + '...' : 'none',
        ip: ip ? ip.substring(0, 8) + '...' : 'none'
      });

      if (!sessionId) {
        return res.status(401).json({ 
          status: 'error',
          message: 'No session ID provided'
        });
      }

      // Generate fingerprint from current request
      let fingerprint;
      try {
        fingerprint = IdentityService.generateFingerprint(userAgent, ip, headers);
      } catch (error) {
        console.error('Error generating fingerprint:', error);
        return res.status(500).json({ 
          status: 'error',
          message: 'Failed to generate fingerprint'
        });
      }

      // Validate the session
      const isValid = IdentityService.validateSession(sessionId, fingerprint);

      if (!isValid) {
        console.log('Invalid session', { sessionId: sessionId.substring(0, 8) + '...' });
        return res.status(401).json({ 
          status: 'error',
          message: 'Invalid or expired session'
        });
      }

      // Get user info
      const user = IdentityService.getUserBySession(sessionId);

      if (!user) {
        console.log('User not found for valid session', { sessionId: sessionId.substring(0, 8) + '...' });
        return res.status(404).json({ 
          status: 'error',
          message: 'User not found'
        });
      }

      console.log('Session validated successfully', { 
        sessionId: sessionId.substring(0, 8) + '...',
        user: user.selectedName
      });

      res.json({
        status: 'valid',
        user
      });
    } catch (error) {
      console.error('Error in session validation:', error);
      res.status(500).json({ 
        status: 'error',
        message: 'Failed to validate session',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // REST Endpoints
  app.get('/api/nodes', async (req, res) => {
    try {
      const nodes = await storage.getNodes();
      res.json(nodes);
    } catch (error) {
      console.error('Error fetching nodes:', error);
      res.status(500).json({ error: 'Failed to fetch nodes' });
    }
  });

  app.get('/api/models', async (req, res) => {
    try {
      const models = await storage.getModels();
      res.json(models);
    } catch (error) {
      console.error('Error fetching models:', error);
      res.status(500).json({ error: 'Failed to fetch models' });
    }
  });

  app.get('/api/devices', async (req, res) => {
    try {
      const devices = await storage.getDevices();
      res.json(devices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      res.status(500).json({ error: 'Failed to fetch devices' });
    }
  });

  app.get('/api/proposals', async (req, res) => {
    try {
      const proposals = await storage.getProposals();
      res.json(proposals);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      res.status(500).json({ error: 'Failed to fetch proposals' });
    }
  });
  
  // Blockchain Governance Routes
  
  // Get blockchain status
  app.get('/api/blockchain/status', async (req, res) => {
    try {
      const isValid = blockchainService.isBlockchainValid();
      const proposalCount = blockchainService.getProposalCount();
      const voteCount = blockchainService.getVoteCount();
      
      res.json({
        status: isValid ? 'valid' : 'invalid',
        proposalCount,
        voteCount,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error checking blockchain status:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve blockchain status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get all transactions on the blockchain
  app.get('/api/blockchain/transactions', async (req, res) => {
    try {
      const transactions = blockchainService.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching blockchain transactions:', error);
      res.status(500).json({ 
        error: 'Failed to fetch blockchain transactions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get a specific transaction by ID
  app.get('/api/blockchain/transactions/:txId', async (req, res) => {
    try {
      const txId = req.params.txId;
      const transaction = blockchainService.getTransaction(txId);
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      res.json(transaction);
    } catch (error) {
      console.error('Error fetching blockchain transaction:', error);
      res.status(500).json({ 
        error: 'Failed to fetch blockchain transaction',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Submit a proposal to the blockchain
  app.post('/api/proposals', async (req, res) => {
    try {
      console.log('Received proposal data:', JSON.stringify(req.body));
      
      const {
        title,
        description,
        region,
        isGlobal = false,
        threshold,
        impact = 'medium',
      } = req.body;
      
      console.log('Parsed values:', { title, description, region, isGlobal, threshold, impact });
      
      // Create the proposal in the database
      const newProposal = await storage.createProposal({
        title,
        description,
        region,
        isGlobal: typeof isGlobal === 'boolean' ? isGlobal : (isGlobal === 'true'),
        threshold: typeof threshold === 'number' ? threshold : parseInt(threshold, 10),
        votes: 0,
        status: 'active',
        proposedBy: 'Anonymous User', // In a real app, this would be the authenticated user
        impact,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      });
      
      // Submit the proposal to the blockchain
      const { txId, address } = blockchainService.submitProposal(newProposal);
      
      // Update the proposal with blockchain information
      const updatedProposal = await storage.updateProposalBlockchainInfo(newProposal.id, txId, address);
      
      // Broadcast the new proposal to connected clients
      broadcastUpdate(wss, 'proposal_created', updatedProposal);
      
      res.status(201).json(updatedProposal);
    } catch (error) {
      console.error('Error creating proposal:', error);
      res.status(500).json({ 
        error: 'Failed to create proposal',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Vote on a proposal
  app.post('/api/proposals/:id/vote', async (req, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      
      // Get the current proposal
      const proposal = await storage.getProposal(proposalId);
      
      if (!proposal) {
        return res.status(404).json({ error: 'Proposal not found' });
      }
      
      if (proposal.status !== 'active') {
        return res.status(400).json({ error: 'Cannot vote on a proposal that is not active' });
      }
      
      // Submit the vote to the blockchain
      const { txId, address } = blockchainService.submitVote(
        proposal.id,
        'Anonymous User',
        'yes',
        proposal.region as string || 'global'
      );
      
      // Update the proposal votes
      const newVoteCount = proposal.votes + 1;
      let updatedProposal = await storage.updateProposalVotes(proposalId, newVoteCount);
      
      // Check if the proposal passed the threshold
      if (newVoteCount >= proposal.threshold && proposal.status === 'active') {
        updatedProposal = await storage.updateProposalStatus(proposalId, 'passed');
        
        // Record the proposal execution on the blockchain
        blockchainService.executeProposal(
          proposalId,
          'system',
          'executed',
          {
            automatedExecution: true,
            proposalTitle: updatedProposal.title
          }
        );
        
        // Broadcast the status change
        broadcastUpdate(wss, 'proposal_passed', updatedProposal);
      }
      
      // Broadcast the vote
      broadcastUpdate(wss, 'proposal_voted', updatedProposal);
      
      res.json(updatedProposal);
    } catch (error) {
      console.error('Error voting on proposal:', error);
      res.status(500).json({ 
        error: 'Failed to vote on proposal',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get all proposals
  app.get('/api/proposals', async (_req, res) => {
    try {
      const proposals = await storage.getProposals();
      res.json(proposals);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      res.status(500).json({ 
        error: 'Failed to fetch proposals',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get global proposals
  app.get('/api/proposals/global', async (_req, res) => {
    try {
      const proposals = await storage.getGlobalProposals();
      res.json(proposals);
    } catch (error) {
      console.error('Error fetching global proposals:', error);
      res.status(500).json({ 
        error: 'Failed to fetch global proposals',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get all blockchain transactions
  app.get('/api/blockchain/transactions', async (_req, res) => {
    try {
      const transactions = blockchainService.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching blockchain transactions:', error);
      res.status(500).json({ 
        error: 'Failed to fetch blockchain transactions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  

  
  // Execute a passed proposal on the blockchain
  app.post('/api/blockchain/execute/:proposalId', async (req, res) => {
    try {
      const proposalId = parseInt(req.params.proposalId);
      const { executor } = req.body;
      
      if (!executor) {
        return res.status(400).json({ 
          error: 'Executor is required',
          requiredFields: ['executor']
        });
      }
      
      // Check if proposal exists and is passed
      const proposal = await storage.getProposal(proposalId);
      if (!proposal) {
        return res.status(404).json({ error: 'Proposal not found' });
      }
      
      if (proposal.status !== 'passed') {
        return res.status(400).json({ 
          error: 'Only passed proposals can be executed',
          currentStatus: proposal.status
        });
      }
      
      // Execute the proposal on the blockchain with additional metadata
      const blockchainResult = blockchainService.executeProposal(
        proposalId.toString(), 
        executor,
        'executed',
        { 
          proposalTitle: proposal.title,
          currentStatus: proposal.status
        }
      );
      
      res.status(200).json({
        success: true,
        txId: blockchainResult.txId,
        address: blockchainResult.address,
        proposalId,
        executor,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error executing proposal on blockchain:', error);
      res.status(500).json({ 
        error: 'Failed to execute proposal on blockchain',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/applications', async (req, res) => {
    try {
      const applications = await storage.getApplications();
      res.json(applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ error: 'Failed to fetch applications' });
    }
  });

  app.post('/api/applications', async (req, res) => {
    try {
      const newApp = {
        ...req.body,
        lastUpdated: new Date(),
      };

      const createdApp = await storage.createApplication(newApp);
      res.status(201).json(createdApp);
    } catch (error) {
      console.error('Error creating application:', error);
      res.status(500).json({ 
        message: 'Failed to create application',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/applications/:id/integrations', async (req, res) => {
    try {
      const integrations = await storage.getIntegrations(parseInt(req.params.id));
      res.json(integrations);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      res.status(500).json({ error: 'Failed to fetch integrations' });
    }
  });

  app.post('/api/applications/:id/integrations', async (req, res) => {
    try {
      const appId = parseInt(req.params.id);
      const newIntegration = {
        ...req.body,
        appId,
        status: 'active',
        metrics: {
          latency: 0,
          successRate: 100,
          requestCount: 0
        }
      };

      const createdIntegration = await storage.createIntegration(newIntegration);
      res.status(201).json(createdIntegration);
    } catch (error) {
      console.error('Error creating integration:', error);
      res.status(500).json({ 
        message: 'Failed to create integration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/applications/:id/developer-keys', async (req, res) => {
    try {
      const keys = await storage.getDeveloperKeys(parseInt(req.params.id));
      res.json(keys);
    } catch (error) {
      console.error('Error fetching developer keys:', error);
      res.status(500).json({ error: 'Failed to fetch developer keys' });
    }
  });

  app.get('/api/music-portal/recent-songs', async (req, res) => {
    try {
      console.log('Fetching recent songs from ninja-portal.com...');
      // In a real implementation, this would call an external API
      // For our demo, we'll return mock data
      const songs = [
        {
          id: 1,
          title: "Quantum Harmony",
          artist: "Neural Beats",
          ipfsHash: "Qm1234567890abcdef",
          uploadedBy: "ninja_user_42",
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
          votes: 152
        },
        {
          id: 2,
          title: "NULL_ISLAND Groove",
          artist: "Cryptic Soundwaves",
          ipfsHash: "Qm0987654321fedcba",
          uploadedBy: "shadow_producer",
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
          votes: 89
        },
        {
          id: 3,
          title: "Zero Knowledge",
          artist: "The Quantum Pirates",
          ipfsHash: "Qm2468013579abcdef",
          uploadedBy: "quantum_pirate_captain",
          createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
          votes: 203
        },
        {
          id: 4,
          title: "East-West Fusion",
          artist: "Region Hoppers",
          ipfsHash: "Qm1357924680fedcba",
          uploadedBy: "teleport_dj",
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
          votes: 127
        },
        {
          id: 5,
          title: "Decentralized Dreams",
          artist: "Blockchain Beats",
          ipfsHash: "Qm5647382910abcdef",
          uploadedBy: "crypto_composer",
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
          votes: 76
        }
      ];

      res.json(songs);
    } catch (error) {
      console.error('Error fetching recent songs:', error);
      res.status(500).json({ 
        message: 'Failed to fetch recent songs',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/discover-endpoints', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      const discovery = await discoverEndpoints(url);
      res.json(discovery);
    } catch (error) {
      console.error('Error in endpoint discovery:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to discover endpoints'
      });
    }
  });

  // Documentation endpoints
  app.get('/api/documentation/:docName', async (req, res) => {
    try {
      const docName = req.params.docName;
      let filename: string;

      switch (docName) {
        case 'whitepaper':
          filename = 'SINet_Whitepaper.md';
          break;
        case 'api':
          filename = 'API_Documentation.md';
          break;
        case 'roadmap':
          filename = 'Development_Roadmap.md';
          break;
        case 'music-portal':
          filename = 'Music_Portal_Integration.md';
          break;
        case 'quantum-teleport':
          filename = 'Quantum_Teleportation_Documentation.md'; // Added for quantum teleportation docs
          break;
        default:
          return res.status(404).json({ error: 'Documentation not found' });
      }

      const filePath = path.join(process.cwd(), 'docs', filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Documentation file not found' });
      }

      const content = fs.readFileSync(filePath, 'utf8');
      res.json({ title: filename.replace('.md', '').replace(/_/g, ' '), content });
    } catch (error) {
      console.error('Error fetching documentation:', error);
      res.status(500).json({ 
        message: 'Failed to fetch documentation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // UPDATED ENDPOINT: Model downloads using archiver for proper ZIP files
  app.get('/api/models/:id/download', async (req, res) => {
    try {
      const modelId = parseInt(req.params.id);
      const model = await storage.getModelById(modelId);

      if (!model) {
        return res.status(404).json({ error: 'Model not found' });
      }

      const modelsDir = path.join(process.cwd(), 'temp_models');
      if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir, { recursive: true });
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=${model.name.toLowerCase().replace(/\s/g, '_')}_model.zip`);

      const archive = archiver('zip', {
        zlib: { level: 9 } 
      });

      archive.pipe(res);

      const modelInfo = `Model: ${model.name}
Type: ${model.trainingData.modelType || 'Transformer'}
Task: ${model.trainingData.task || 'AI Task'}
Accuracy: ${model.accuracy}%
Dataset Size: ${model.trainingData.datasetSize.toLocaleString()}
Epochs: ${model.trainingData.epochsCompleted}
Loss Rate: ${model.trainingData.lossRate.toFixed(6)}
Region: ${model.region || 'Global'}
Description: ${model.description || 'No description available'}

This is a model file generated by SINet Dashboard.
For real model files, please visit:
${model.trainingData.sourcePlatform === 'huggingface' 
  ? `https://huggingface.co/${model.trainingData.sourceRepo}` 
  : model.trainingData.sourcePlatform === 'github' 
    ? `https://github.com/${model.trainingData.sourceRepo}`
    : '#'}
`;

      archive.append(modelInfo, { name: 'model_info.txt' });

      const modelScript = `# Example script for using ${model.name}
import torch
from transformers import AutoModel, AutoTokenizer

# Load model
model_name = "${model.name.toLowerCase().replace(/\s/g, '_')}"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)

# Example usage
text = "Example input for ${model.trainingData.task || 'AI task'}"
inputs = tokenizer(text, return_tensors="pt")
outputs = model(**inputs)

# Process outputs
print(f"Input: {text}")
print(f"Model output shape: {outputs.last_hidden_state.shape}")
print("Processing complete!")
`;

      archive.append(modelScript, { name: 'usage_example.py' });

      const config = JSON.stringify({
        model_name: model.name,
        model_type: model.trainingData.modelType || 'Transformer',
        task: model.trainingData.task || 'AI Task',
        accuracy: model.accuracy,
        region: model.region || 'Global',
        parameters: Math.floor(Math.random() * 10) * 1000000000, 
        layers: Math.floor(Math.random() * 20) + 10,
        attention_heads: Math.floor(Math.random() * 16) + 8,
        created_at: new Date().toISOString()
      }, null, 2);

      archive.append(config, { name: 'config.json' });

      const readme = `# ${model.name} Model

## Overview
This is an AI model package for ${model.trainingData.task || 'AI tasks'}.

## Region Information
This model is assigned to the ${model.region ? model.region.toUpperCase() : 'GLOBAL'} region in our East-West-NULL_ISLAND architecture.

## Usage
See the included \`usage_example.py\` file for a basic implementation example.

## Configuration
Model configuration details can be found in \`config.json\`.

## For more information
${model.trainingData.sourcePlatform === 'huggingface' 
  ? `Visit HuggingFace: https://huggingface.co/${model.trainingData.sourceRepo}` 
  : model.trainingData.sourcePlatform === 'github' 
    ? `Visit GitHub: https://github.com/${model.trainingData.sourceRepo}`
    : 'Visit our documentation for more details.'}
`;

      archive.append(readme, { name: 'README.md' });

      const dummyModelContent = Buffer.alloc(1024, 0);
      archive.append(dummyModelContent, { name: 'model.bin' });

      const vocabContent = `[PAD]
[UNK]
[CLS]
[SEP]
[MASK]
the
a
to
of
and
in
is
it
that
for
you
was
with
on
as
are
this
be
by
not
have
from
at
an
but
all
they
we
their
my
your
what
has
will
would
can
if
one
about`;

      archive.append(vocabContent, { name: 'vocab.txt' });

      const htmlPreview = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${model.name} Model Preview</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #2563eb; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; margin-right: 8px; }
    .badge.east { background-color: #3b82f6; color: white; }
    .badge.west { background-color: #8b5cf6; color: white; }
    .badge.null-island { background-color: #ef4444; color: white; }
    .badge.global { background-color: #6b7280; color: white; }
    .stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin: 20px 0; }
    .stat-card { background-color: #f9fafb; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-value { font-size: 24px; font-weight: 700; margin: 8px 0; }
    .stat-label { font-size: 14px; color: #6b7280; }
    pre { background-color: #f1f5f9; padding: 16px; border-radius: 8px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>${model.name}</h1>
  <p>${model.description || 'Advanced AI model for ' + model.trainingData.task}</p>

  <div>
    <span class="badge ${model.region || 'global'}">${model.region ? model.region.toUpperCase() : 'GLOBAL'}</span>
    <span class="badge ${model.status === 'complete' ? 'east' : 'west'}">${model.status.toUpperCase()}</span>
    ${model.isExperimental ? '<span class="badge null-island">EXPERIMENTAL</span>' : ''}
  </div>

  <div class="stats">
    <div class="stat-card">
      <div class="stat-label">Accuracy</div>
      <div class="stat-value">${model.accuracy}%</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Dataset Size</div>
      <div class="stat-value">${model.trainingData.datasetSize.toLocaleString()}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Task</div>
      <div class="stat-value">${model.trainingData.task || 'AI'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Loss Rate</div>
      <div class="stat-value">${model.trainingData.lossRate.toFixed(4)}</div>
    </div>
  </div>

  <h2>Usage Example</h2>
  <pre>
# Python example
import torch
from transformers import AutoModel, AutoTokenizer

# Load model
model_name = "${model.name.toLowerCase().replace(/\s/g, '_')}"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)

# Example usage
text = "Example input for ${model.trainingData.task || 'AI task'}"
inputs = tokenizer(text, return_tensors="pt")
outputs = model(**inputs)

# Process outputs
print(f"Model output shape: {outputs.last_hidden_state.shape}")
  </pre>

  <p>This is a preview of the ${model.name} model. For full documentation, please refer to the accompanying files.</p>
</body>
</html>`;

      archive.append(htmlPreview, { name: 'preview.html' });

      archive.finalize();

    } catch (error) {
      console.error('Error downloading model:', error);
      res.status(500).json({ 
        message: 'Failed to download model',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Documentation endpoint for quantum teleportation
  app.get('/api/documentation/quantum-teleport', async (req, res) => {
    try {
      const documentation = {
        title: 'Quantum Teleportation Using Zero Knowledge Proofs',
        content: "# Quantum Teleportation Using Zero Knowledge Proofs\n\n## Overview\n\nThe SINet NULL_ISLAND region implements an experimental simulation of quantum teleportation using zero knowledge proofs (ZKPs). This document explains how this fascinating technology works conceptually.\n\n## What is Quantum Teleportation?\n\nIn quantum physics, teleportation is a process by which quantum information (such as the state of an atom or photon) can be transmitted from one location to another, with the help of classical communication and previously shared quantum entanglement between the sending and receiving locations.\n\n## What are Zero Knowledge Proofs?\n\nA zero knowledge proof is a method by which one party (the prover) can prove to another party (the verifier) that they know a value x, without conveying any information apart from the fact that they know the value x.\n\n## How Our Simulation Works\n\nOur system simulates quantum teleportation using the following steps:\n\n1. **Entanglement Generation**: We create a simulated \"entangled pair\" of particles using cryptographic techniques.\n\n2. **Bell State Measurement**: When teleportation is requested, we perform a simulated measurement on the source \"particle\" and one half of the entangled pair.\n\n3. **Zero Knowledge Verification**: We use a commitment-challenge-response protocol to prove that the data has been \"teleported\" without revealing the actual data:\n   - The source region creates a commitment to the data\n   - The target region issues a challenge\n   - The source region responds to the challenge\n   - The target region verifies the proof\n\n4. **Quantum State Reconstruction**: If verification succeeds, the target region can reconstruct the original data.\n\n## Technical Implementation\n\nOur implementation uses cryptographic primitives to simulate the quantum processes:\n\n- **Entangled Pairs**: Generated using shared random seeds and HMAC functions\n- **ZKP System**: Uses cryptographic hash functions to create commitments and responses\n- **Verification**: Checks mathematical relationships between commitments and responses\n\n## Use Cases in SINet\n\n- **Cross-Regional Data Transfer**: Secure transfer of model data between East-West-NULL_ISLAND regions\n- **Experimental Models**: Testing new approaches to distributed AI computation\n- **Stealth Communication**: For NULL_ISLAND exclusive operations\n\n## Security Considerations\n\nWhile our simulation provides educational value and demonstrates the concepts, it does not provide the same security guarantees as true quantum teleportation with actual quantum hardware.\n\n## API Endpoints\n\n- POST /api/quantum-teleport/start: Initiate a teleportation process\n- GET /api/quantum-teleport/status/:id: Check the status of a teleportation\n- GET /api/quantum-teleport/history: View all teleportation requests\n\n## Partners\n\nOur NULL_ISLAND region works with partners like Quantum Pirates and Zero Knowledge Labs to advance this technology."
      };

      res.json(documentation);
    } catch (error) {
      console.error('Error fetching quantum teleportation documentation:', error);
      res.status(500).json({ 
        message: 'Failed to fetch quantum teleportation documentation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // NEW ENDPOINTS: Quantum Teleportation Service
  app.post('/api/quantum-teleport/start', async (req, res) => {
    try {
      const { sourceRegion, targetRegion, resourceType, resourceId } = req.body;

      if (!sourceRegion || !targetRegion || !resourceType || !resourceId) {
        return res.status(400).json({ 
          error: 'Missing required fields', 
          requiredFields: ['sourceRegion', 'targetRegion', 'resourceType', 'resourceId'] 
        });
      }

      const teleportRequest = await QuantumTeleportService.startTeleportation(
        sourceRegion,
        targetRegion,
        resourceType,
        parseInt(resourceId)
      );

      res.status(201).json({
        message: 'Quantum teleportation process initiated',
        teleportId: teleportRequest.id,
        status: teleportRequest.status,
        details: `Teleporting ${resourceType} #${resourceId} from ${sourceRegion} to ${targetRegion}`
      });

    } catch (error) {
      console.error('Error starting quantum teleportation:', error);
      res.status(500).json({ 
        message: 'Failed to initiate quantum teleportation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/quantum-teleport/status/:id', async (req, res) => {
    try {
      const teleportId = req.params.id;
      const status = QuantumTeleportService.getTeleportStatus(teleportId);

      if (!status) {
        return res.status(404).json({ error: 'Teleport request not found' });
      }

      res.json({
        teleportId: status.id,
        status: status.status,
        sourceRegion: status.sourceRegion,
        targetRegion: status.targetRegion,
        resourceType: status.resourceType,
        resourceId: status.resourceId,
        startTime: status.startTime,
        completionTime: status.completionTime,
        error: status.error,
        zkProof: status.zkProof ? {
          verified: status.zkProof.verified,
          commitmentHash: status.zkProof.commitment.substring(0, 16) + '...'
        } : undefined
      });

    } catch (error) {
      console.error('Error checking quantum teleportation status:', error);
      res.status(500).json({ 
        message: 'Failed to check quantum teleportation status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/quantum-teleport/history', async (req, res) => {
    try {
      const allRequests = QuantumTeleportService.getAllTeleportRequests();
      const history = allRequests.map(req => ({
        teleportId: req.id,
        status: req.status,
        sourceRegion: req.sourceRegion,
        targetRegion: req.targetRegion,
        resourceType: req.resourceType,
        resourceId: req.resourceId,
        startTime: req.startTime,
        completionTime: req.completionTime,
        successful: req.status === 'completed'
      }));

      res.json(history);

    } catch (error) {
      console.error('Error fetching quantum teleportation history:', error);
      res.status(500).json({ 
        message: 'Failed to fetch quantum teleportation history',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // NEW ENDPOINT: Cross-Application Integration
  app.post('/api/cross-app-integration', async (req, res) => {
    try {
      const { targetApp, dataType, dataId, integrationMethod } = req.body;

      if (!targetApp || !dataType || !dataId) {
        return res.status(400).json({ 
          error: 'Missing required fields', 
          requiredFields: ['targetApp', 'dataType', 'dataId'] 
        });
      }

      const method = integrationMethod || 'standard';

      console.log(`Cross-application integration request: ${dataType} #${dataId} to ${targetApp} using ${method} method`);

      let integrationResult;

      if (method === 'quantum') {
        const sourceRegion = 'west'; 
        const targetRegion = 'null_island'; 

        const teleportRequest = await QuantumTeleportService.startTeleportation(
          sourceRegion,
          targetRegion,
          dataType,
          parseInt(dataId)
        );

        integrationResult = {
          method: 'quantum',
          teleportId: teleportRequest.id,
          status: teleportRequest.status,
          details: `Data teleportation initiated from ${sourceRegion} to ${targetRegion}`
        };
      } else {
        integrationResult = {
          method: 'standard',
          status: 'completed',
          targetEndpoint: `https://${targetApp}.replit.app/api/import/${dataType}`,
          details: 'Integration completed successfully'
        };
      }

      res.status(200).json({
        message: 'Cross-application integration processed',
        targetApp,
        dataType,
        dataId,
        integrationMethod: method,
        result: integrationResult,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in cross-application integration:', error);
      res.status(500).json({ 
        message: 'Failed to process cross-application integration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // NEW ENDPOINT: Whitepaper Integration
  app.post('/api/whitepaper-integration', async (req, res) => {
    try {
      const { title, authors, abstract, sections, references, appId } = req.body;

      if (!title || !authors || !abstract || !sections) {
        return res.status(400).json({ 
          error: 'Missing required fields', 
          requiredFields: ['title', 'authors', 'abstract', 'sections'] 
        });
      }

      // Generate a whitepaper ID (in a real system, this would be stored in a database)
      const whitepaperUUID = crypto.randomUUID();

      // Process the whitepaper integration
      console.log(`Whitepaper integration: "${title}" by ${authors.join(', ')}`);

      // In a real system, we would store the whitepaper and process it
      // For this demo, we'll just return a success response
      res.status(201).json({
        message: 'Whitepaper integration processed',
        whitepaperUUID,
        title,
        authors,
        status: 'accepted',
        publicationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days from now
        reviewStatus: 'pending',
        associatedApp: appId ? { id: appId } : undefined,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in whitepaper integration:', error);
      res.status(500).json({ 
        message: 'Failed to process whitepaper integration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Mock endpoint for streaming music - returns a redirect to a demo MP3
  app.get('/api/music-portal/stream/:id', (req, res) => {
    try {
      console.log(`Mock streaming song ${req.params.id}`);
      const demoMp3Url = 'https://cdn.freesound.org/previews/723/723493_15301361-lq.mp3';
      res.redirect(demoMp3Url);
    } catch (error) {
      console.error('Error streaming song:', error);
      res.status(500).json({ 
        message: 'Failed to stream song',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Mock endpoint for album artwork
  app.get('/api/music-portal/artwork/:id', (req, res) => {
    try {
      console.log(`Mock fetching artwork for song ${req.params.id}`);
      res.redirect('https://via.placeholder.com/300/3730a3/ffffff?text=Music+Artwork');
    } catch (error) {
      console.error('Error fetching artwork:', error);
      res.status(500).json({ 
        message: 'Failed to fetch artwork',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Application Registry endpoint
  app.get('/api/application-registry', async (req, res) => {
    try {
      const registeredApps = [
        {
          id: 'sinet-dashboard',
          name: 'SINet Dashboard',
          description: 'Main dashboard for SINet distributed AI compute resources',
          url: 'https://sinet-dashboard.replit.app',
          apis: [
            { path: '/api/models', method: 'GET', description: 'Get all AI models' },
            { path: '/api/nodes', method: 'GET', description: 'Get all compute nodes' },
            { path: '/api/quantum-teleport/start', method: 'POST', description: 'Start quantum teleportation' }
          ],
          regions: ['east', 'west', 'null-island']
        },
        {
          id: 'sinet-docs',
          name: 'SINet Documentation',
          description: 'Documentation portal for SINet technologies',
          url: 'https://sinet-docs.replit.app',
          apis: [
            { path: '/api/docs', method: 'GET', description: 'Get documentation' },
            { path: '/api/whitepapers', method: 'GET', description: 'Get whitepapers' }
          ],
          regions: ['global']
        },
        {
          id: 'null-island-experiments',
          name: 'NULL_ISLAND Experiments',
          description: 'Experimental technologies for the NULL_ISLAND region',
          url: 'https://null-island-experiments.replit.app',
          apis: [
            { path: '/api/experiments', method: 'GET', description: 'Get experiments' },
            { path: '/api/quantum-sim', method: 'POST', description: 'Run quantum simulation' }
          ],
          regions: ['null-island']
        }
      ];

      res.status(200).json({
        registeredApps,
        count: registeredApps.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching application registry:', error);
      res.status(500).json({ 
        message: 'Failed to fetch application registry',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Set up the WebSocket connection
  wss.on('connection', function connection(ws) {
    console.log('WebSocket client connected');

    // Send initial status update
    ws.send(JSON.stringify({
      type: 'connection_status',
      data: { connected: true, timestamp: new Date().toISOString() }
    }));

    // Handle messages from clients
    ws.on('message', function incoming(message) {
      try {
        // Ensure we're parsing string data
        if (typeof message === 'string') {
          const parsedMessage = JSON.parse(message);
          console.log('Received WebSocket message:', parsedMessage);

          // Handle message based on type
          if (parsedMessage.type === 'ping') {
            ws.send(JSON.stringify({
              type: 'pong',
              data: { timestamp: new Date().toISOString() }
            }));
          }
        } else {
          console.warn('Received non-string WebSocket message, converting to string first');
          const strMessage = message.toString();
          // Try to parse if it's a Buffer
          try {
            const parsedMessage = JSON.parse(strMessage);
            console.log('Converted and parsed WebSocket message:', parsedMessage);
          } catch (parseError) {
            console.error('Could not parse converted message:', parseError);
          }
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });

    ws.on('close', function close() {
      console.log('WebSocket client disconnected');
    });
  });

  // Broadcast system status updates periodically
  setInterval(() => {
    if (wss.clients.size > 0) {
      broadcastUpdate(wss, 'system_status', {
        nodes: Math.floor(Math.random() * 50) + 100,
        activeSessions: Math.floor(Math.random() * 300) + 500,
        averageLatency: Math.floor(Math.random() * 60) + 40,
        timestamp: new Date().toISOString()
      });
    }
  }, 30000); // Every 30 seconds

  return httpServer;
}