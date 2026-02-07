import { Redis } from '@upstash/redis';
import type { SavedCalculation, Participant, BookingSettings, AdditionalModule } from '../types';

// Initialize Redis client
let redis: Redis | null = null;

export function initializeDatabase(url: string, token: string) {
  redis = new Redis({
    url,
    token,
  });
  return redis;
}

export function getRedisClient(): Redis {
  if (!redis) {
    // Try to initialize with environment variables
    const url = import.meta.env.VITE_UPSTASH_REDIS_REST_URL;
    const token = import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN;
    
    if (!url || !token) {
      throw new Error('Redis not initialized. Please call initializeDatabase() first or set environment variables.');
    }
    
    redis = new Redis({ url, token });
  }
  return redis;
}

// Database operations
export async function saveCalculation(
  id: string,
  name: string,
  participants: Participant[],
  settings: BookingSettings,
  additionalModules: AdditionalModule[]
): Promise<void> {
  const client = getRedisClient();
  
  const calculation: SavedCalculation = {
    id,
    name,
    participants,
    settings,
    additionalModules,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  await client.set(`calculation:${id}`, JSON.stringify(calculation));
  
  // Also store in a list for easier retrieval
  await client.lpush('calculations', id);
}

export async function loadCalculation(id: string): Promise<SavedCalculation | null> {
  const client = getRedisClient();
  
  const data = await client.get(`calculation:${id}`);
  if (!data) return null;
  
  return typeof data === 'string' ? JSON.parse(data) : data as SavedCalculation;
}

export async function listCalculations(): Promise<SavedCalculation[]> {
  const client = getRedisClient();
  
  const ids = await client.lrange('calculations', 0, -1);
  if (!ids || ids.length === 0) return [];
  
  const calculations: SavedCalculation[] = [];
  
  for (const id of ids) {
    const calculation = await loadCalculation(id as string);
    if (calculation) {
      calculations.push(calculation);
    }
  }
  
  return calculations.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function deleteCalculation(id: string): Promise<void> {
  const client = getRedisClient();
  
  await client.del(`calculation:${id}`);
  await client.lrem('calculations', 1, id);
}

export async function updateCalculation(
  id: string,
  participants: Participant[],
  settings: BookingSettings,
  additionalModules: AdditionalModule[]
): Promise<void> {
  const client = getRedisClient();
  
  const existing = await loadCalculation(id);
  if (!existing) {
    throw new Error('Calculation not found');
  }
  
  const updated: SavedCalculation = {
    ...existing,
    participants,
    settings,
    additionalModules,
    updatedAt: new Date().toISOString(),
  };
  
  await client.set(`calculation:${id}`, JSON.stringify(updated));
}

// Utility function to generate unique IDs
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}