/**
 * Consensus Engine - DAG-based consensus for distributed agent coordination
 * Implements QuDAG (Quantum-Directed Acyclic Graph) consensus mechanism
 */

import {
  ConsensusMessage,
  ConsensusState,
  DAGNode,
  NetworkMessage,
  P2PNetworkError,
  ConsensusError
} from '../types/network';

/**
 * Consensus algorithm types
 */
export enum ConsensusAlgorithm {
  RAFT = 'raft',
  PBFT = 'pbft',
  QUDAG = 'qudag',
  AVALANCHE = 'avalanche',
  TENDERMINT = 'tendermint'
}

/**
 * Consensus configuration
 */
export interface ConsensusConfig {
  algorithm: ConsensusAlgorithm;
  nodeId: string;
  byzantineFaultTolerance: number; // Max percentage of Byzantine nodes
  consensusTimeout: number; // Timeout for consensus rounds
  blockTime: number; // Target time between blocks
  maxBlockSize: number; // Maximum block size in bytes
  enablePostQuantumCrypto: boolean;
  validatorNodes: string[]; // List of validator node IDs
}

/**
 * Transaction for consensus
 */
export interface ConsensusTransaction {
  id: string;
  type: 'agent-spawn' | 'agent-terminate' | 'task-assign' | 'resource-allocate' | 'state-update';
  proposer: string;
  data: any;
  signature: string;
  timestamp: Date;
  dependencies: string[]; // Transaction dependencies
  priority: number;
}

/**
 * Consensus block
 */
export interface ConsensusBlock {
  id: string;
  epoch: number;
  height: number;
  proposer: string;
  transactions: ConsensusTransaction[];
  previousHash: string;
  merkleRoot: string;
  timestamp: Date;
  signature: string;
  validators: string[];
  votes: Map<string, boolean>;
  finalized: boolean;
}

/**
 * Validator information
 */
export interface ValidatorInfo {
  id: string;
  publicKey: string;
  stake: number;
  reputation: number;
  lastActivity: Date;
  isActive: boolean;
  byzantineScore: number; // Measure of Byzantine behavior
}

/**
 * Consensus Engine implementation
 */
export class ConsensusEngine {
  private config: ConsensusConfig;
  private nodeId: string;
  private currentEpoch: number = 0;
  private currentHeight: number = 0;
  private state: ConsensusState;
  private dag: Map<string, DAGNode> = new Map();
  private pendingTransactions: Map<string, ConsensusTransaction> = new Map();
  private blocks: Map<string, ConsensusBlock> = new Map();
  private validators: Map<string, ValidatorInfo> = new Map();
  private isLeader: boolean = false;
  private consensusRound: number = 0;
  private messageHandlers: Map<string, Function> = new Map();
  private consensusTimeout: NodeJS.Timeout | null = null;
  private eventListeners: Array<(event: string, data: any) => void> = [];

  constructor(config: ConsensusConfig) {
    this.config = config;
    this.nodeId = config.nodeId;
    
    this.state = {
      epoch: this.currentEpoch,
      leader: '',
      proposals: new Map(),
      votes: new Map(),
      committed: [],
      pending: []
    };
    
    this.initializeValidators();
    this.setupMessageHandlers();
  }

  /**
   * Initialize validator set
   */
  private initializeValidators(): void {
    this.config.validatorNodes.forEach(nodeId => {
      this.validators.set(nodeId, {
        id: nodeId,
        publicKey: `pubkey_${nodeId}`,
        stake: 100,
        reputation: 100,
        lastActivity: new Date(),
        isActive: true,
        byzantineScore: 0
      });
    });
  }

  /**
   * Setup message handlers for different consensus messages
   */
  private setupMessageHandlers(): void {
    this.messageHandlers.set('proposal', this.handleProposal.bind(this));
    this.messageHandlers.set('vote', this.handleVote.bind(this));
    this.messageHandlers.set('commit', this.handleCommit.bind(this));
    this.messageHandlers.set('abort', this.handleAbort.bind(this));
    this.messageHandlers.set('leader-election', this.handleLeaderElection.bind(this));
    this.messageHandlers.set('block-proposal', this.handleBlockProposal.bind(this));
    this.messageHandlers.set('block-vote', this.handleBlockVote.bind(this));
  }

  /**
   * Start consensus engine
   */
  async start(): Promise<void> {
    console.log(`🌐 Starting Consensus Engine (${this.config.algorithm})...`);
    
    try {
      // Initialize consensus based on algorithm
      switch (this.config.algorithm) {
        case ConsensusAlgorithm.RAFT:
          await this.initializeRaft();
          break;
        case ConsensusAlgorithm.PBFT:
          await this.initializePBFT();
          break;
        case ConsensusAlgorithm.QUDAG:
          await this.initializeQuDAG();
          break;
        case ConsensusAlgorithm.AVALANCHE:
          await this.initializeAvalanche();
          break;
        default:
          throw new ConsensusError('Unsupported consensus algorithm', this.currentEpoch, this.nodeId);
      }
      
      // Start consensus rounds
      this.startConsensusRounds();
      
      console.log('✅ Consensus Engine started successfully');
      
    } catch (error) {
      console.error('❌ Consensus Engine startup failed:', error);
      throw error;
    }
  }

  /**
   * Initialize Raft consensus
   */
  private async initializeRaft(): Promise<void> {
    console.log('📄 Initializing Raft consensus...');
    
    // Start leader election
    await this.startLeaderElection();
  }

  /**
   * Initialize PBFT consensus
   */
  private async initializePBFT(): Promise<void> {
    console.log('🔒 Initializing PBFT consensus...');
    
    // PBFT requires 3f+1 nodes where f is the number of Byzantine nodes
    const minNodes = Math.floor(this.config.byzantineFaultTolerance * 3) + 1;
    
    if (this.validators.size < minNodes) {
      throw new ConsensusError(
        `Insufficient validators for PBFT. Need at least ${minNodes}, have ${this.validators.size}`,
        this.currentEpoch,
        this.nodeId
      );
    }
  }

  /**
   * Initialize QuDAG consensus
   */
  private async initializeQuDAG(): Promise<void> {
    console.log('🔍 Initializing QuDAG consensus...');
    
    // Initialize DAG structure
    this.initializeDAG();
    
    // Start quantum-resistant operations
    if (this.config.enablePostQuantumCrypto) {
      await this.initializePostQuantumCrypto();
    }
  }

  /**
   * Initialize Avalanche consensus
   */
  private async initializeAvalanche(): Promise<void> {
    console.log('❄️ Initializing Avalanche consensus...');
    
    // Avalanche-specific initialization
    this.startAvalancheProtocol();
  }

  /**
   * Initialize DAG structure for QuDAG
   */
  private initializeDAG(): void {
    // Create genesis node
    const genesisNode: DAGNode = {
      id: 'genesis',
      data: {
        type: 'genesis',
        epoch: 0,
        validators: Array.from(this.validators.keys())
      },
      parents: [],
      children: [],
      timestamp: new Date(),
      signature: 'genesis_signature',
      confirmed: true
    };
    
    this.dag.set('genesis', genesisNode);
  }

  /**
   * Initialize post-quantum cryptography
   */
  private async initializePostQuantumCrypto(): Promise<void> {
    console.log('🔐 Initializing post-quantum cryptography...');
    
    // Placeholder for ML-DSA and ML-KEM initialization
    // In a real implementation, this would initialize quantum-resistant signatures
  }

  /**
   * Start leader election for Raft
   */
  private async startLeaderElection(): Promise<void> {
    console.log('🗳️ Starting leader election...');
    
    // Simple leader election based on node ID
    const sortedValidators = Array.from(this.validators.keys()).sort();
    const leaderIndex = this.currentEpoch % sortedValidators.length;
    const leader = sortedValidators[leaderIndex];
    
    this.state.leader = leader;
    this.isLeader = leader === this.nodeId;
    
    console.log(`👑 Leader elected: ${leader} (${this.isLeader ? 'Self' : 'Other'})`);
    
    // Notify listeners
    this.emitEvent('leader-elected', { leader, isLeader: this.isLeader });
  }

  /**
   * Start Avalanche protocol
   */
  private startAvalancheProtocol(): void {
    console.log('🌀 Starting Avalanche protocol...');
    
    // Avalanche-specific protocol initialization
    // This would implement the snowball/avalanche consensus mechanism
  }

  /**
   * Start consensus rounds
   */
  private startConsensusRounds(): void {
    const roundInterval = this.config.blockTime || 5000; // Default 5 seconds
    
    const runConsensusRound = async () => {
      try {
        await this.runConsensusRound();
      } catch (error) {
        console.error('Consensus round failed:', error);
      }
      
      // Schedule next round
      this.consensusTimeout = setTimeout(runConsensusRound, roundInterval);
    };
    
    // Start first round
    runConsensusRound();
  }

  /**
   * Run a single consensus round
   */
  private async runConsensusRound(): Promise<void> {
    this.consensusRound++;
    
    console.log(`🔄 Starting consensus round ${this.consensusRound} (Epoch ${this.currentEpoch})`);
    
    if (this.isLeader) {
      await this.proposeBlock();
    }
    
    // Process pending transactions
    await this.processPendingTransactions();
    
    // Clean up old state
    this.cleanupOldState();
  }

  /**
   * Propose a new block (leader only)
   */
  private async proposeBlock(): Promise<void> {
    if (!this.isLeader) return;
    
    const transactions = this.selectTransactionsForBlock();
    
    if (transactions.length === 0) {
      console.log('💭 No transactions to propose');
      return;
    }
    
    const block: ConsensusBlock = {
      id: `block_${this.currentHeight}_${Date.now()}`,
      epoch: this.currentEpoch,
      height: this.currentHeight,
      proposer: this.nodeId,
      transactions,
      previousHash: this.getPreviousBlockHash(),
      merkleRoot: this.calculateMerkleRoot(transactions),
      timestamp: new Date(),
      signature: this.signBlock(transactions),
      validators: Array.from(this.validators.keys()),
      votes: new Map(),
      finalized: false
    };
    
    // Store block
    this.blocks.set(block.id, block);
    
    // Broadcast block proposal
    await this.broadcastBlockProposal(block);
    
    console.log(`📦 Proposed block ${block.id} with ${transactions.length} transactions`);
  }

  /**
   * Select transactions for inclusion in block
   */
  private selectTransactionsForBlock(): ConsensusTransaction[] {
    const maxSize = this.config.maxBlockSize;
    const transactions: ConsensusTransaction[] = [];
    let currentSize = 0;
    
    // Sort transactions by priority
    const sortedTransactions = Array.from(this.pendingTransactions.values())
      .sort((a, b) => b.priority - a.priority);
    
    for (const tx of sortedTransactions) {
      const txSize = JSON.stringify(tx).length;
      
      if (currentSize + txSize > maxSize) {
        break;
      }
      
      transactions.push(tx);
      currentSize += txSize;
    }
    
    return transactions;
  }

  /**
   * Get previous block hash
   */
  private getPreviousBlockHash(): string {
    const previousBlocks = Array.from(this.blocks.values())
      .filter(b => b.finalized)
      .sort((a, b) => b.height - a.height);
    
    return previousBlocks.length > 0 ? previousBlocks[0].id : 'genesis';
  }

  /**
   * Calculate Merkle root for transactions
   */
  private calculateMerkleRoot(transactions: ConsensusTransaction[]): string {
    if (transactions.length === 0) return '';
    
    // Simplified Merkle root calculation
    const txHashes = transactions.map(tx => this.hashTransaction(tx));
    return this.calculateMerkleRootFromHashes(txHashes);
  }

  /**
   * Hash a transaction
   */
  private hashTransaction(tx: ConsensusTransaction): string {
    // Simplified hash function
    return `hash_${tx.id}_${tx.timestamp.getTime()}`;
  }

  /**
   * Calculate Merkle root from hashes
   */
  private calculateMerkleRootFromHashes(hashes: string[]): string {
    if (hashes.length === 1) return hashes[0];
    
    const nextLevel: string[] = [];
    
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = hashes[i + 1] || hashes[i];
      nextLevel.push(`merkle_${left}_${right}`);
    }
    
    return this.calculateMerkleRootFromHashes(nextLevel);
  }

  /**
   * Sign a block
   */
  private signBlock(transactions: ConsensusTransaction[]): string {
    // Simplified signature
    return `sig_${this.nodeId}_${transactions.length}_${Date.now()}`;
  }

  /**
   * Broadcast block proposal
   */
  private async broadcastBlockProposal(block: ConsensusBlock): Promise<void> {
    const proposal: ConsensusMessage = {
      id: `proposal_${block.id}`,
      type: 'proposal',
      epoch: this.currentEpoch,
      proposer: this.nodeId,
      data: block,
      signature: this.signMessage(block),
      timestamp: new Date()
    };
    
    // This would be sent via P2P network
    console.log(`📡 Broadcasting block proposal: ${block.id}`);
    
    // Simulate network delay
    setTimeout(() => {
      this.emitEvent('block-proposed', { block, proposal });
    }, 100);
  }

  /**
   * Sign a message
   */
  private signMessage(data: any): string {
    return `sig_${this.nodeId}_${JSON.stringify(data).length}_${Date.now()}`;
  }

  /**
   * Process pending transactions
   */
  private async processPendingTransactions(): Promise<void> {
    const now = Date.now();
    const timeoutMs = this.config.consensusTimeout;
    
    // Remove expired transactions
    const expiredTransactions: string[] = [];
    
    this.pendingTransactions.forEach((tx, id) => {
      if (now - tx.timestamp.getTime() > timeoutMs) {
        expiredTransactions.push(id);
      }
    });
    
    expiredTransactions.forEach(id => {
      this.pendingTransactions.delete(id);
      console.log(`⏰ Transaction expired: ${id}`);
    });
  }

  /**
   * Clean up old state
   */
  private cleanupOldState(): void {
    const cutoffTime = new Date(Date.now() - 3600000); // 1 hour ago
    
    // Clean up old proposals
    const expiredProposals: string[] = [];
    
    this.state.proposals.forEach((proposal, id) => {
      if (proposal.timestamp < cutoffTime) {
        expiredProposals.push(id);
      }
    });
    
    expiredProposals.forEach(id => {
      this.state.proposals.delete(id);
      this.state.votes.delete(id);
    });
  }

  /**
   * Handle consensus message
   */
  async handleConsensusMessage(message: ConsensusMessage): Promise<void> {
    console.log(`📬 Received consensus message: ${message.type} from ${message.proposer}`);
    
    // Verify message signature
    if (!this.verifyMessageSignature(message)) {
      console.error('❌ Invalid message signature');
      return;
    }
    
    // Handle message based on type
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      await handler(message);
    } else {
      console.warn(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * Verify message signature
   */
  private verifyMessageSignature(message: ConsensusMessage): boolean {
    // Simplified signature verification
    return message.signature.startsWith(`sig_${message.proposer}`);
  }

  /**
   * Handle proposal message
   */
  private async handleProposal(message: ConsensusMessage): Promise<void> {
    console.log(`📄 Handling proposal: ${message.id}`);
    
    // Store proposal
    this.state.proposals.set(message.id, message);
    
    // Vote on proposal
    await this.voteOnProposal(message);
  }

  /**
   * Vote on a proposal
   */
  private async voteOnProposal(proposal: ConsensusMessage): Promise<void> {
    // Validate proposal
    const isValid = await this.validateProposal(proposal);
    
    // Cast vote
    const vote: ConsensusMessage = {
      id: `vote_${proposal.id}_${this.nodeId}`,
      type: 'vote',
      epoch: this.currentEpoch,
      proposer: this.nodeId,
      data: {
        proposalId: proposal.id,
        vote: isValid,
        reason: isValid ? 'valid' : 'invalid'
      },
      signature: this.signMessage({ proposalId: proposal.id, vote: isValid }),
      timestamp: new Date()
    };
    
    // Store vote
    if (!this.state.votes.has(proposal.id)) {
      this.state.votes.set(proposal.id, new Map());
    }
    this.state.votes.get(proposal.id)!.set(this.nodeId, isValid);
    
    // Broadcast vote
    await this.broadcastVote(vote);
    
    console.log(`🗳 Voted ${isValid ? 'YES' : 'NO'} on proposal: ${proposal.id}`);
  }

  /**
   * Validate a proposal
   */
  private async validateProposal(proposal: ConsensusMessage): Promise<boolean> {
    // Basic validation
    if (proposal.epoch !== this.currentEpoch) {
      console.log(`❌ Invalid epoch: ${proposal.epoch} vs ${this.currentEpoch}`);
      return false;
    }
    
    if (!this.validators.has(proposal.proposer)) {
      console.log(`❌ Invalid proposer: ${proposal.proposer}`);
      return false;
    }
    
    // Additional validation logic would go here
    return true;
  }

  /**
   * Broadcast vote
   */
  private async broadcastVote(vote: ConsensusMessage): Promise<void> {
    console.log(`📡 Broadcasting vote: ${vote.id}`);
    
    // Simulate network delay
    setTimeout(() => {
      this.emitEvent('vote-cast', { vote });
    }, 50);
  }

  /**
   * Handle vote message
   */
  private async handleVote(message: ConsensusMessage): Promise<void> {
    const { proposalId, vote } = message.data;
    
    console.log(`🗳 Handling vote: ${message.proposer} voted ${vote ? 'YES' : 'NO'} on ${proposalId}`);
    
    // Store vote
    if (!this.state.votes.has(proposalId)) {
      this.state.votes.set(proposalId, new Map());
    }
    this.state.votes.get(proposalId)!.set(message.proposer, vote);
    
    // Check if consensus reached
    await this.checkConsensus(proposalId);
  }

  /**
   * Check if consensus has been reached for a proposal
   */
  private async checkConsensus(proposalId: string): Promise<void> {
    const votes = this.state.votes.get(proposalId);
    if (!votes) return;
    
    const totalValidators = this.validators.size;
    const requiredVotes = Math.floor(totalValidators * 2 / 3) + 1; // 2/3 majority
    
    const yesVotes = Array.from(votes.values()).filter(v => v).length;
    const noVotes = Array.from(votes.values()).filter(v => !v).length;
    
    if (yesVotes >= requiredVotes) {
      // Consensus reached - commit
      await this.commitProposal(proposalId);
    } else if (noVotes >= requiredVotes) {
      // Consensus reached - abort
      await this.abortProposal(proposalId);
    }
  }

  /**
   * Commit a proposal
   */
  private async commitProposal(proposalId: string): Promise<void> {
    console.log(`✅ Committing proposal: ${proposalId}`);
    
    const proposal = this.state.proposals.get(proposalId);
    if (!proposal) return;
    
    // Move from pending to committed
    this.state.committed.push(proposalId);
    const pendingIndex = this.state.pending.indexOf(proposalId);
    if (pendingIndex > -1) {
      this.state.pending.splice(pendingIndex, 1);
    }
    
    // Process the committed proposal
    await this.processCommittedProposal(proposal);
    
    // Broadcast commit message
    await this.broadcastCommit(proposalId);
    
    // Emit event
    this.emitEvent('proposal-committed', { proposalId, proposal });
  }

  /**
   * Process a committed proposal
   */
  private async processCommittedProposal(proposal: ConsensusMessage): Promise<void> {
    console.log(`📦 Processing committed proposal: ${proposal.id}`);
    
    // Execute the proposal data
    if (proposal.data && proposal.data.transactions) {
      const block = proposal.data as ConsensusBlock;
      block.finalized = true;
      
      // Remove processed transactions from pending
      block.transactions.forEach(tx => {
        this.pendingTransactions.delete(tx.id);
      });
      
      // Update height
      this.currentHeight = Math.max(this.currentHeight, block.height + 1);
      
      console.log(`📊 Block finalized: ${block.id} (Height: ${block.height})`);
    }
  }

  /**
   * Abort a proposal
   */
  private async abortProposal(proposalId: string): Promise<void> {
    console.log(`❌ Aborting proposal: ${proposalId}`);
    
    // Remove from pending
    const pendingIndex = this.state.pending.indexOf(proposalId);
    if (pendingIndex > -1) {
      this.state.pending.splice(pendingIndex, 1);
    }
    
    // Broadcast abort message
    await this.broadcastAbort(proposalId);
    
    // Emit event
    this.emitEvent('proposal-aborted', { proposalId });
  }

  /**
   * Broadcast commit message
   */
  private async broadcastCommit(proposalId: string): Promise<void> {
    const commit: ConsensusMessage = {
      id: `commit_${proposalId}_${this.nodeId}`,
      type: 'commit',
      epoch: this.currentEpoch,
      proposer: this.nodeId,
      data: { proposalId },
      signature: this.signMessage({ proposalId }),
      timestamp: new Date()
    };
    
    console.log(`📡 Broadcasting commit: ${proposalId}`);
    
    // Simulate network delay
    setTimeout(() => {
      this.emitEvent('commit-broadcast', { commit });
    }, 50);
  }

  /**
   * Broadcast abort message
   */
  private async broadcastAbort(proposalId: string): Promise<void> {
    const abort: ConsensusMessage = {
      id: `abort_${proposalId}_${this.nodeId}`,
      type: 'abort',
      epoch: this.currentEpoch,
      proposer: this.nodeId,
      data: { proposalId },
      signature: this.signMessage({ proposalId }),
      timestamp: new Date()
    };
    
    console.log(`📡 Broadcasting abort: ${proposalId}`);
    
    // Simulate network delay
    setTimeout(() => {
      this.emitEvent('abort-broadcast', { abort });
    }, 50);
  }

  /**
   * Handle commit message
   */
  private async handleCommit(message: ConsensusMessage): Promise<void> {
    console.log(`✅ Handling commit: ${message.data.proposalId}`);
    
    // Process the commit
    const proposal = this.state.proposals.get(message.data.proposalId);
    if (proposal) {
      await this.processCommittedProposal(proposal);
    }
  }

  /**
   * Handle abort message
   */
  private async handleAbort(message: ConsensusMessage): Promise<void> {
    console.log(`❌ Handling abort: ${message.data.proposalId}`);
    
    // Clean up aborted proposal
    this.state.proposals.delete(message.data.proposalId);
    this.state.votes.delete(message.data.proposalId);
  }

  /**
   * Handle leader election message
   */
  private async handleLeaderElection(message: ConsensusMessage): Promise<void> {
    console.log(`🗳️ Handling leader election from: ${message.proposer}`);
    
    // Process leader election based on consensus algorithm
    if (this.config.algorithm === ConsensusAlgorithm.RAFT) {
      await this.processRaftLeaderElection(message);
    }
  }

  /**
   * Process Raft leader election
   */
  private async processRaftLeaderElection(message: ConsensusMessage): Promise<void> {
    // Simplified Raft leader election
    const candidate = message.proposer;
    const currentTerm = message.data.term || 0;
    
    if (currentTerm > this.currentEpoch) {
      this.currentEpoch = currentTerm;
      this.state.leader = candidate;
      this.isLeader = candidate === this.nodeId;
      
      console.log(`👑 New leader elected: ${candidate}`);
      this.emitEvent('leader-changed', { leader: candidate, term: currentTerm });
    }
  }

  /**
   * Handle block proposal message
   */
  private async handleBlockProposal(message: ConsensusMessage): Promise<void> {
    const block = message.data as ConsensusBlock;
    
    console.log(`📦 Handling block proposal: ${block.id}`);
    
    // Validate block
    const isValid = await this.validateBlock(block);
    
    // Vote on block
    await this.voteOnBlock(block, isValid);
  }

  /**
   * Validate a block
   */
  private async validateBlock(block: ConsensusBlock): Promise<boolean> {
    // Basic block validation
    if (block.epoch !== this.currentEpoch) {
      console.log(`❌ Invalid block epoch: ${block.epoch}`);
      return false;
    }
    
    if (!this.validators.has(block.proposer)) {
      console.log(`❌ Invalid block proposer: ${block.proposer}`);
      return false;
    }
    
    // Validate transactions
    for (const tx of block.transactions) {
      if (!await this.validateTransaction(tx)) {
        console.log(`❌ Invalid transaction in block: ${tx.id}`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Validate a transaction
   */
  private async validateTransaction(tx: ConsensusTransaction): Promise<boolean> {
    // Basic transaction validation
    if (!tx.id || !tx.proposer || !tx.signature) {
      return false;
    }
    
    // Verify signature
    if (!this.verifyTransactionSignature(tx)) {
      return false;
    }
    
    return true;
  }

  /**
   * Verify transaction signature
   */
  private verifyTransactionSignature(tx: ConsensusTransaction): boolean {
    // Simplified signature verification
    return tx.signature.startsWith(`sig_${tx.proposer}`);
  }

  /**
   * Vote on a block
   */
  private async voteOnBlock(block: ConsensusBlock, vote: boolean): Promise<void> {
    console.log(`🗳 Voting ${vote ? 'YES' : 'NO'} on block: ${block.id}`);
    
    // Store vote
    block.votes.set(this.nodeId, vote);
    
    // Broadcast vote
    const voteMessage: ConsensusMessage = {
      id: `block_vote_${block.id}_${this.nodeId}`,
      type: 'block-vote',
      epoch: this.currentEpoch,
      proposer: this.nodeId,
      data: {
        blockId: block.id,
        vote
      },
      signature: this.signMessage({ blockId: block.id, vote }),
      timestamp: new Date()
    };
    
    // Simulate network delay
    setTimeout(() => {
      this.emitEvent('block-vote-cast', { block, vote });
    }, 50);
  }

  /**
   * Handle block vote message
   */
  private async handleBlockVote(message: ConsensusMessage): Promise<void> {
    const { blockId, vote } = message.data;
    
    console.log(`🗳 Handling block vote: ${message.proposer} voted ${vote ? 'YES' : 'NO'} on ${blockId}`);
    
    // Find block and update vote
    const block = this.blocks.get(blockId);
    if (block) {
      block.votes.set(message.proposer, vote);
      
      // Check if block consensus reached
      await this.checkBlockConsensus(block);
    }
  }

  /**
   * Check if block consensus has been reached
   */
  private async checkBlockConsensus(block: ConsensusBlock): Promise<void> {
    const totalValidators = this.validators.size;
    const requiredVotes = Math.floor(totalValidators * 2 / 3) + 1;
    
    const yesVotes = Array.from(block.votes.values()).filter(v => v).length;
    
    if (yesVotes >= requiredVotes) {
      // Finalize block
      await this.finalizeBlock(block);
    }
  }

  /**
   * Finalize a block
   */
  private async finalizeBlock(block: ConsensusBlock): Promise<void> {
    console.log(`✅ Finalizing block: ${block.id}`);
    
    block.finalized = true;
    
    // Remove processed transactions
    block.transactions.forEach(tx => {
      this.pendingTransactions.delete(tx.id);
    });
    
    // Update height
    this.currentHeight = Math.max(this.currentHeight, block.height + 1);
    
    // Emit event
    this.emitEvent('block-finalized', { block });
  }

  /**
   * Submit a transaction for consensus
   */
  async submitTransaction(tx: ConsensusTransaction): Promise<void> {
    console.log(`📤 Submitting transaction: ${tx.id}`);
    
    // Validate transaction
    if (!await this.validateTransaction(tx)) {
      throw new ConsensusError('Invalid transaction', this.currentEpoch, this.nodeId, tx);
    }
    
    // Add to pending transactions
    this.pendingTransactions.set(tx.id, tx);
    
    // Emit event
    this.emitEvent('transaction-submitted', { transaction: tx });
  }

  /**
   * Get consensus state
   */
  getState(): ConsensusState {
    return {
      epoch: this.currentEpoch,
      leader: this.state.leader,
      proposals: new Map(this.state.proposals),
      votes: new Map(this.state.votes),
      committed: [...this.state.committed],
      pending: [...this.state.pending]
    };
  }

  /**
   * Get consensus metrics
   */
  getMetrics(): any {
    return {
      currentEpoch: this.currentEpoch,
      currentHeight: this.currentHeight,
      isLeader: this.isLeader,
      leader: this.state.leader,
      pendingTransactions: this.pendingTransactions.size,
      committedProposals: this.state.committed.length,
      totalBlocks: this.blocks.size,
      finalizedBlocks: Array.from(this.blocks.values()).filter(b => b.finalized).length,
      validators: this.validators.size,
      activeValidators: Array.from(this.validators.values()).filter(v => v.isActive).length
    };
  }

  /**
   * Add event listener
   */
  addEventListener(listener: (event: string, data: any) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: (event: string, data: any) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: string, data: any): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
  }

  /**
   * Shutdown consensus engine
   */
  async shutdown(): Promise<void> {
    console.log('🔌 Shutting down Consensus Engine...');
    
    // Stop consensus rounds
    if (this.consensusTimeout) {
      clearTimeout(this.consensusTimeout);
      this.consensusTimeout = null;
    }
    
    // Clear state
    this.state.proposals.clear();
    this.state.votes.clear();
    this.state.committed.length = 0;
    this.state.pending.length = 0;
    
    this.pendingTransactions.clear();
    this.blocks.clear();
    this.validators.clear();
    this.dag.clear();
    
    this.eventListeners.length = 0;
    
    console.log('✅ Consensus Engine shutdown complete');
  }
}

// Export singleton instance
let consensusEngineInstance: ConsensusEngine | null = null;

export const getConsensusEngine = (config: ConsensusConfig): ConsensusEngine => {
  if (!consensusEngineInstance) {
    consensusEngineInstance = new ConsensusEngine(config);
  }
  return consensusEngineInstance;
};

export const resetConsensusEngine = (): void => {
  if (consensusEngineInstance) {
    consensusEngineInstance.shutdown();
    consensusEngineInstance = null;
  }
};
