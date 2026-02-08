import type { Participant, BookingSettings, AdditionalActivity } from '../types';

export interface SavedCalculation {
  participants: Participant[];
  settings: BookingSettings;
  additionalActivities: AdditionalActivity[];
  createdAt: string;
}

export interface SaveResponse {
  success: boolean;
  calculationId?: string;
  message: string;
}

export interface LoadResponse {
  success: boolean;
  data?: SavedCalculation;
  message?: string;
}

const API_BASE = '/api';

export async function saveCalculation(
  participants: Participant[],
  settings: BookingSettings,
  additionalActivities: AdditionalActivity[],
  existingId?: string
): Promise<SaveResponse> {
  try {
    const response = await fetch(`${API_BASE}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        participants,
        settings,
        additionalActivities,
        existingId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Save error:', error);
    return {
      success: false,
      message: 'Failed to save calculation. Please try again.'
    };
  }
}

export async function loadCalculation(calculationId: string): Promise<LoadResponse> {
  try {
    const response = await fetch(`${API_BASE}/load?id=${encodeURIComponent(calculationId)}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          message: 'Calculation not found or has expired.'
        };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Load error:', error);
    return {
      success: false,
      message: 'Failed to load calculation. Please check the ID and try again.'
    };
  }
}

export function getShareableUrl(calculationId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}?calc=${calculationId}`;
}