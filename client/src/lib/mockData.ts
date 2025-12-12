import { LucideIcon, ShieldAlert, ShieldCheck, UserX, Activity, Globe, Eye, Server, Zap } from "lucide-react";

// Types
export interface ThreatActor {
  id: string;
  name: string;
  alias: string[];
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  origin: string;
  lastActive: string;
  targets: string[];
  capabilities: string[];
}

export interface FraudFinding {
  id: string;
  timestamp: string;
  source: string;
  type: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'New' | 'Investigating' | 'Resolved';
  details: string;
}

export interface Prediction {
  id: string;
  target: string;
  riskScore: number;
  likelyAttackType: string;
  projectedImpact: string;
  aiConfidence: number;
  region: string;
}

export interface IntelFeedItem {
  id: string;
  timestamp: string;
  source: string;
  content: string;
  tags: string[];
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
}

// Mock Data
export const threatActors: ThreatActor[] = [
  {
    id: 'TA-001',
    name: 'Cobalt Mirage',
    alias: ['UNC2452', 'DarkHalo'],
    riskLevel: 'Critical',
    origin: 'Eastern Europe',
    lastActive: '2 hours ago',
    targets: ['Fintech', 'Banking', 'Crypto'],
    capabilities: ['Ransomware', 'Supply Chain', 'Zero-day']
  },
  {
    id: 'TA-002',
    name: 'Silent Librarian',
    alias: ['TA407', 'COBALT DICKENS'],
    riskLevel: 'High',
    origin: 'Middle East',
    lastActive: '1 day ago',
    targets: ['Research', 'Financial Services'],
    capabilities: ['Phishing', 'Credential Harvesting']
  },
  {
    id: 'TA-003',
    name: 'Lazarus Group',
    alias: ['HIDDEN COBRA', 'Guardians of Peace'],
    riskLevel: 'Critical',
    origin: 'East Asia',
    lastActive: '4 hours ago',
    targets: ['Cryptocurrency Exchanges', 'SWIFT'],
    capabilities: ['Advanced Malware', 'Social Engineering']
  },
  {
    id: 'TA-004',
    name: 'Fin7',
    alias: ['Carbanak', 'Navigator Group'],
    riskLevel: 'High',
    origin: 'Eastern Europe',
    lastActive: '3 days ago',
    targets: ['Retail', 'Hospitality', 'Banking'],
    capabilities: ['Point-of-Sale Malware', 'Spear Phishing']
  }
];

export const fraudFindings: FraudFinding[] = [
  {
    id: 'FR-2024-8892',
    timestamp: '2024-05-15 14:32:00',
    source: 'Transaction Monitor',
    type: 'Account Takeover',
    severity: 'Critical',
    status: 'New',
    details: 'Multiple high-value transfers to unverified external accounts from IP 192.168.x.x (VPN Exit Node).'
  },
  {
    id: 'FR-2024-8891',
    timestamp: '2024-05-15 13:45:12',
    source: 'Login Gate',
    type: 'Credential Stuffing',
    severity: 'High',
    status: 'Investigating',
    details: '500+ failed login attempts detected on user segment A-12 within 5 minutes.'
  },
  {
    id: 'FR-2024-8890',
    timestamp: '2024-05-15 12:10:05',
    source: 'KYC Verification',
    type: 'Synthetic Identity',
    severity: 'Medium',
    status: 'Resolved',
    details: 'Mismatched document metadata for onboarding application #99281.'
  },
  {
    id: 'FR-2024-8889',
    timestamp: '2024-05-15 11:30:00',
    source: 'Payment Gateway',
    type: 'Card Testing',
    severity: 'Low',
    status: 'Resolved',
    details: 'Small value transactions (<$1) pattern detected across multiple merchant IDs.'
  },
  {
    id: 'FR-2024-8888',
    timestamp: '2024-05-15 10:15:22',
    source: 'Mobile App API',
    type: 'API Abuse',
    severity: 'High',
    status: 'New',
    details: 'Rate limit anomalies detected on /v1/transfer/initiate endpoint.'
  }
];

export const predictions: Prediction[] = [
  {
    id: 'PRED-001',
    target: 'Payment Gateway North America',
    riskScore: 88,
    likelyAttackType: 'DDoS & Credential Stuffing',
    projectedImpact: 'Service degradation, 15% transaction failure',
    aiConfidence: 92,
    region: 'North America'
  },
  {
    id: 'PRED-002',
    target: 'User Database Shard 4',
    riskScore: 65,
    likelyAttackType: 'SQL Injection via Legacy API',
    projectedImpact: 'Data leakage risk',
    aiConfidence: 78,
    region: 'Global'
  },
  {
    id: 'PRED-003',
    target: 'Crypto Wallet Integration',
    riskScore: 42,
    likelyAttackType: 'Smart Contract Exploit',
    projectedImpact: 'Asset freeze',
    aiConfidence: 60,
    region: 'Europe'
  }
];

export const darkWebIntel: IntelFeedItem[] = [
  {
    id: 'INT-992',
    timestamp: '10 mins ago',
    source: 'DeepWeb Forum "X"',
    content: 'Selling new exploit kit for FinShadow banking API v2.1. Verified working.',
    tags: ['Exploit', 'Banking', 'API'],
    severity: 'Critical'
  },
  {
    id: 'INT-991',
    timestamp: '45 mins ago',
    source: 'Telegram Channel',
    content: 'Dump of 50k credit cards [US/EU] available. Bin 414720.',
    tags: ['Carding', 'Data Dump'],
    severity: 'High'
  },
  {
    id: 'INT-990',
    timestamp: '2 hours ago',
    source: 'Tor Marketplace',
    content: 'Looking for insiders at major fintech firms. High payout.',
    tags: ['Insider Threat', 'Recruitment'],
    severity: 'Medium'
  }
];

export const stats = {
  activeThreats: 12,
  fraudAttemptsBlocked: 1450,
  systemRiskScore: 72,
  aiConfidenceAvg: 89
};
