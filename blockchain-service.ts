/**
 * Blockchain Service for SINet Governance
 * 
 * This service handles the integration with a blockchain for storing and
 * verifying governance proposals and votes in a secure, transparent, and
 * immutable way.
 */

import crypto from 'crypto';
import { GovernanceProposal } from '@shared/schema';

// Simulated blockchain structure representing a basic block
interface Block {
  index: number;
  timestamp: number;
  data: any;
  previousHash: string;
  hash: string;
  nonce: number;
}

// Structure representing a blockchain transaction
interface BlockchainTransaction {
  id: string;
  type: 'proposal' | 'vote' | 'execution';
  data: any;
  signature: string;
  timestamp: number;
  address: string;
}

// In-memory blockchain for demo purposes
// In a production environment, this would connect to a real blockchain network
class BlockchainNode {
  private chain: Block[];
  private difficulty: number;
  private pendingTransactions: BlockchainTransaction[];
  private miningReward: number;
  private genesisTimestamp: number;
  
  constructor() {
    this.chain = [];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 100; // For demo purposes
    this.genesisTimestamp = Date.now();
    
    // Create the genesis block
    this.createGenesisBlock();
  }
  
  private createGenesisBlock(): void {
    this.chain.push({
      index: 0,
      timestamp: this.genesisTimestamp,
      data: {
        transactions: [],
        note: "SINet Genesis Block - Zero Knowledge Identity Network"
      },
      previousHash: "0",
      hash: "0",
      nonce: 0
    });
    
    // Update the hash of genesis block
    this.chain[0].hash = this.calculateHash(this.chain[0]);
  }
  
  /**
   * Calculate hash of a block using SHA-256
   */
  private calculateHash(block: Block): string {
    const data = block.index + block.timestamp + JSON.stringify(block.data) + block.previousHash + block.nonce;
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  /**
   * Add a new block to the chain after proof of work
   */
  private addBlock(newBlock: Block): Block {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.hash = this.calculateHash(newBlock);
    
    // Proof of work
    this.mineBlock(newBlock);
    
    this.chain.push(newBlock);
    return newBlock;
  }
  
  /**
   * Implements a simple proof of work algorithm
   */
  private mineBlock(block: Block): void {
    while (block.hash.substring(0, this.difficulty) !== Array(this.difficulty + 1).join("0")) {
      block.nonce++;
      block.hash = this.calculateHash(block);
    }
    
    console.log(`Block mined: ${block.hash}`);
  }
  
  /**
   * Get the latest block in the chain
   */
  private getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }
  
  /**
   * Create a new transaction and add it to the pending transactions
   */
  public createTransaction(type: 'proposal' | 'vote' | 'execution', data: any, privateKey: string = "demo-key"): BlockchainTransaction {
    const transaction: BlockchainTransaction = {
      id: crypto.randomBytes(16).toString('hex'),
      type,
      data,
      signature: this.signTransaction(data, privateKey),
      timestamp: Date.now(),
      address: this.generateAddressFromKey(privateKey)
    };
    
    this.pendingTransactions.push(transaction);
    return transaction;
  }
  
  /**
   * Simulate signing a transaction with a private key
   */
  private signTransaction(data: any, privateKey: string): string {
    // In a real implementation, this would use actual cryptographic signing
    return crypto.createHmac('sha256', privateKey)
      .update(JSON.stringify(data))
      .digest('hex');
  }
  
  /**
   * Generate a blockchain address from a private key
   */
  private generateAddressFromKey(privateKey: string): string {
    // In a real implementation, this would derive a public address from the private key
    return crypto.createHash('sha256')
      .update(privateKey + "-public")
      .digest('hex')
      .substring(0, 40);
  }
  
  /**
   * Process pending transactions by mining a new block
   */
  public processPendingTransactions(minerAddress: string = "sinet-governance-miner"): Block {
    // Create mining reward transaction
    const rewardTx: BlockchainTransaction = {
      id: crypto.randomBytes(16).toString('hex'),
      type: 'execution',
      data: { reward: this.miningReward },
      signature: "system",
      timestamp: Date.now(),
      address: minerAddress
    };
    
    // Add reward to the list of pending transactions
    this.pendingTransactions.push(rewardTx);
    
    // Create a new block with all pending transactions
    const block: Block = {
      index: this.chain.length,
      timestamp: Date.now(),
      data: {
        transactions: [...this.pendingTransactions]
      },
      previousHash: this.getLatestBlock().hash,
      hash: "",
      nonce: 0
    };
    
    // Reset pending transactions and mine the block
    this.pendingTransactions = [];
    return this.addBlock(block);
  }
  
  /**
   * Verify the integrity of the blockchain
   */
  public isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      
      // Verify current block's hash
      if (currentBlock.hash !== this.calculateHash(currentBlock)) {
        return false;
      }
      
      // Verify previous block hash reference
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get a transaction by ID
   */
  public getTransaction(txId: string): BlockchainTransaction | null {
    for (const block of this.chain) {
      if (block.data && block.data.transactions) {
        for (const tx of block.data.transactions) {
          if (tx.id === txId) {
            return tx;
          }
        }
      }
    }
    return null;
  }
  
  /**
   * Get the full blockchain
   */
  public getChain(): Block[] {
    return this.chain;
  }
  
  /**
   * Get pending transactions
   */
  public getPendingTransactions(): BlockchainTransaction[] {
    return this.pendingTransactions;
  }
  
  /**
   * Get transactions by address
   */
  public getTransactionsByAddress(address: string): BlockchainTransaction[] {
    const transactions: BlockchainTransaction[] = [];
    
    for (const block of this.chain) {
      if (block.data && block.data.transactions) {
        for (const tx of block.data.transactions) {
          if (tx.address === address) {
            transactions.push(tx);
          }
        }
      }
    }
    
    return transactions;
  }
}

// Export the blockchain service
export class BlockchainService {
  private static instance: BlockchainService;
  private blockchain: BlockchainNode;
  private initialized: boolean = false;
  private miningInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.blockchain = new BlockchainNode();
  }
  
  /**
   * Initialize the blockchain service
   */
  public initialize(): void {
    if (this.initialized) {
      return;
    }
    
    console.log('Initializing SINet Governance Blockchain...');
    
    // Set up mining interval to process transactions every 60 seconds
    this.miningInterval = setInterval(() => {
      if (this.blockchain.getPendingTransactions().length > 0) {
        console.log('Mining block with pending transactions...');
        const newBlock = this.blockchain.processPendingTransactions();
        console.log(`New block added to the chain with ${newBlock.data.transactions.length} transactions`);
      }
    }, 60000);
    
    this.initialized = true;
    console.log('SINet Governance Blockchain initialized successfully');
  }
  
  /**
   * Get the singleton instance of the blockchain service
   */
  public static getInstance(): BlockchainService {
    if (!BlockchainService.instance) {
      BlockchainService.instance = new BlockchainService();
    }
    return BlockchainService.instance;
  }
  
  /**
   * Submit a governance proposal to the blockchain
   * @param proposal GovernanceProposal object or proposal ID
   */
  public submitProposal(proposal: GovernanceProposal | string | number): { txId: string, address: string } {
    // Create and submit a proposal transaction based on the type of input
    let transactionData: any;
    
    if (typeof proposal === 'object' && 'id' in proposal) {
      // It's a GovernanceProposal object
      transactionData = {
        proposalId: proposal.id.toString(),
        title: proposal.title,
        description: proposal.description,
        proposedBy: proposal.proposedBy,
        region: proposal.region,
        isGlobal: proposal.isGlobal,
        category: proposal.category,
        tags: proposal.tags,
        expiresAt: proposal.expiresAt,
        timestamp: new Date().toISOString()
      };
    } else {
      // It's a string or number ID
      transactionData = {
        proposalId: proposal.toString(),
        timestamp: new Date().toISOString()
      };
    }
    
    const transaction = this.blockchain.createTransaction('proposal', transactionData);
    
    return {
      txId: transaction.id,
      address: transaction.address
    };
  }
  
  /**
   * Submit a vote for a governance proposal
   */
  public submitVote(
    proposalId: string | number,
    voter: string,
    vote: 'yes' | 'no' | 'abstain' = 'yes',
    region: string = 'global'
  ): { txId: string, address: string } {
    // Create and submit a vote transaction
    const transaction = this.blockchain.createTransaction('vote', {
      proposalId: proposalId.toString(),
      voter,
      vote,
      region,
      timestamp: new Date().toISOString()
    });
    
    return {
      txId: transaction.id,
      address: transaction.address
    };
  }
  
  /**
   * Execute a passed governance proposal by recording the execution on the blockchain
   */
  public executeProposal(
    proposalId: string | number,
    executor: string,
    status: string = 'executed',
    metadata: Record<string, any> = {}
  ): { txId: string, address: string } {
    // Create and submit an execution transaction
    const transaction = this.blockchain.createTransaction('execution', {
      proposalId: proposalId.toString(),
      executor,
      timestamp: new Date().toISOString(),
      status,
      ...metadata
    });
    
    return {
      txId: transaction.id,
      address: transaction.address
    };
  }
  
  /**
   * Verify a transaction exists on the blockchain
   */
  public verifyTransaction(txId: string): boolean {
    return this.blockchain.getTransaction(txId) !== null;
  }
  
  /**
   * Get transaction details
   */
  public getTransaction(txId: string): BlockchainTransaction | null {
    return this.blockchain.getTransaction(txId);
  }
  
  /**
   * Get all blockchain transactions
   */
  public getAllTransactions(): BlockchainTransaction[] {
    const transactions: BlockchainTransaction[] = [];
    
    for (const block of this.blockchain.getChain()) {
      if (block.data && block.data.transactions) {
        transactions.push(...block.data.transactions);
      }
    }
    
    return transactions;
  }
  
  /**
   * Get the total number of proposals on the blockchain
   */
  public getProposalCount(): number {
    return this.getAllTransactions().filter(tx => tx.type === 'proposal').length;
  }
  
  /**
   * Get the total number of votes on the blockchain
   */
  public getVoteCount(): number {
    return this.getAllTransactions().filter(tx => tx.type === 'vote').length;
  }
  
  /**
   * Check if the blockchain is valid
   */
  public isBlockchainValid(): boolean {
    return this.blockchain.isChainValid();
  }
  
  /**
   * Stop the blockchain service
   */
  public stop(): void {
    if (this.miningInterval) {
      clearInterval(this.miningInterval);
      this.miningInterval = null;
    }
  }
}

// Blockchain service singleton instance
export const blockchainService = BlockchainService.getInstance();