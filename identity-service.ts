import crypto from 'crypto';

// Store user sessions with their associated fingerprints
const userSessions = new Map<string, {
  id: string;
  selectedName: string;
  fingerprint: string;
  createdAt: Date;
  lastSeen: Date;
  ipHash: string;
  locationHash: string;
}>();

// Simple in-memory name pool (in a real system, this could be much larger and more diverse)
const namePool = [
  // Quantum-inspired names
  'QuantumWanderer', 'EntangledParticle', 'SuperpositionUser', 
  'WaveFunction', 'QuantumBit', 'SchrodingersCat',
  // Region-specific names
  'NullIslandPioneer', 'EastNodesNavigator', 'WestGridSurfer',
  // Cryptography-inspired names
  'CipherWizard', 'CryptoVoyager', 'HashMaster',
  'ZeroKnowledgeUser', 'AsymmetricKey', 'SecureRandom',
  // AI-inspired names
  'NeuralNode', 'DeepLearner', 'TensorFlowRider', 
  'AINavigator', 'CortexExplorer', 'DataMiner',
  // Ninja-themed names
  'ShadowNinja', 'SilentCode', 'DataShinobi',
  'CyberRonin', 'QuantumSamurai', 'StealthByte'
];

/**
 * Identity Service for zero-knowledge user identification
 */
export class IdentityService {
  /**
   * Generate a fingerprint from user agent, IP, and other data
   * This is a simplified implementation - in a real system, more sophisticated techniques would be used
   */
  static generateFingerprint(userAgent: string, ip: string, headers: Record<string, string>): string {
    // Extract key components from headers to identify the user
    const components = [
      userAgent,
      ip,
      headers['accept-language'] || '',
      headers['sec-ch-ua'] || '', // Browser info
      headers['sec-ch-ua-platform'] || '' // Platform info
    ];

    // Create a hash of these components
    const hmac = crypto.createHmac('sha256', 'sinet-zk-identity-salt');
    hmac.update(components.join('|'));
    return hmac.digest('hex');
  }

  /**
   * Hash the IP address to avoid storing it directly
   */
  static hashIpAddress(ip: string): string {
    const hmac = crypto.createHmac('sha256', 'sinet-ip-salt');
    hmac.update(ip);
    return hmac.digest('hex');
  }

  /**
   * Hash the approximate location data
   */
  static hashLocation(latitude: number, longitude: number): string {
    // We round to reduce precision for privacy while maintaining usability
    const roundedLat = Math.round(latitude * 10) / 10;
    const roundedLong = Math.round(longitude * 10) / 10;

    const hmac = crypto.createHmac('sha256', 'sinet-location-salt');
    hmac.update(`${roundedLat},${roundedLong}`);
    return hmac.digest('hex');
  }

  /**
   * Generate a list of suggested names based on fingerprint data
   */
  static suggestNames(fingerprint: string, ipHash: string, locationHash?: string): string[] {
    // Use the fingerprint to seed a pseudo-random number generator
    let seedValue = parseInt(fingerprint.substring(0, 8), 16);
    const rand = () => {
      // Simple LCG random number generator
      seedValue = (seedValue * 1664525 + 1013904223) % 4294967296;
      return seedValue / 4294967296;
    };

    // Select 10 unique names from the pool
    const selectedNames = new Set<string>();
    while (selectedNames.size < 10) {
      const index = Math.floor(rand() * namePool.length);
      selectedNames.add(namePool[index]);
    }

    // Shuffle the names again to avoid any patterns
    return Array.from(selectedNames).sort(() => rand() - 0.5);
  }

  /**
   * Create a new user session
   */
  static createSession(fingerprint: string, ipHash: string, selectedName: string, locationHash?: string): string {
    const sessionId = crypto.randomUUID();

    userSessions.set(sessionId, {
      id: sessionId,
      selectedName,
      fingerprint,
      createdAt: new Date(),
      lastSeen: new Date(),
      ipHash,
      locationHash: locationHash || ''
    });

    return sessionId;
  }

  /**
   * Validate a user session
   */
  static validateSession(sessionId: string, fingerprint: string): boolean {
    const session = userSessions.get(sessionId);
    if (!session) return false;

    // Check if fingerprint matches
    if (session.fingerprint !== fingerprint) return false;

    // Update last seen timestamp
    session.lastSeen = new Date();
    userSessions.set(sessionId, session);

    return true;
  }

  /**
   * Get user by session ID
   */
  static getUserBySession(sessionId: string): { selectedName: string } | null {
    const session = userSessions.get(sessionId);
    if (!session) return null;

    return {
      selectedName: session.selectedName
    };
  }

  /**
   * Get user by fingerprint
   */
  static getUserByFingerprint(fingerprint: string): { sessionId: string; selectedName: string } | null {
    // Convert userSessions map to array and then find the matching session
    for (const [id, session] of Array.from(userSessions.entries())) {
      if (session.fingerprint === fingerprint) {
        return {
          sessionId: id,
          selectedName: session.selectedName
        };
      }
    }
    return null;
  }

  /**
   * Remove stale sessions (cleanup function)
   */
  static cleanupStaleSessions(maxAgeHours = 24): void {
    const now = new Date();
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert hours to milliseconds

    // Convert userSessions map to array and then filter/remove stale sessions
    Array.from(userSessions.entries()).forEach(([id, session]) => {
      const age = now.getTime() - session.lastSeen.getTime();
      if (age > maxAge) {
        userSessions.delete(id);
      }
    });
  }
}

// Run cleanup every hour
setInterval(() => {
  IdentityService.cleanupStaleSessions();
}, 60 * 60 * 1000);

export default IdentityService;