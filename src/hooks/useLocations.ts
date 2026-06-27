'use client';

import { useState, useEffect } from 'react';
import { useDocument } from './useFirestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface LocationHierarchy {
  [stateName: string]: {
    [districtName: string]: string[];
  };
}

export const DEFAULT_LOCATION_HIERARCHY: LocationHierarchy = {
  'Tamil Nadu': {
    'Theni': [
      'Theni', 'Uthamapalayam', 'Cumbum', 'Chinnamanur', 'Bodinayakanur',
      'Periyakulam', 'Andipatti', 'Devaram', 'Kombai', 'Veerapandi',
      'Gudalur', 'Thevaram'
    ],
    'Madurai': [
      'Madurai City', 'Melur', 'Tirumangalam', 'Vadipatti', 'Usilampatti'
    ],
    'Coimbatore': [
      'Coimbatore City', 'Pollachi', 'Mettupalayam', 'Valparai'
    ],
    'Dindigul': [
      'Dindigul City', 'Palani', 'Kodaikanal', 'Natham'
    ]
  }
};

export function useLocations() {
  const { data: remoteSettings, loading } = useDocument<any>('platformSettings', 'global');
  const [hierarchy, setHierarchy] = useState<LocationHierarchy>(DEFAULT_LOCATION_HIERARCHY);

  useEffect(() => {
    if (remoteSettings && remoteSettings.locationHierarchy) {
      setHierarchy(remoteSettings.locationHierarchy);
    }
  }, [remoteSettings]);

  const states = Object.keys(hierarchy);

  const getDistricts = (stateName: string): string[] => {
    if (!stateName || !hierarchy[stateName]) return [];
    return Object.keys(hierarchy[stateName]);
  };

  const getAreas = (stateName: string, districtName: string): string[] => {
    if (!stateName || !hierarchy[stateName] || !districtName || !hierarchy[stateName][districtName]) return [];
    return hierarchy[stateName][districtName];
  };

  // Flat list of all areas across all states/districts for legacy select compatibility
  const getAllAreas = (): string[] => {
    const list: string[] = [];
    Object.values(hierarchy).forEach((districtsObj) => {
      Object.values(districtsObj).forEach((areasArr) => {
        list.push(...areasArr);
      });
    });
    return Array.from(new Set(list)).sort();
  };

  // Flat list of all districts across all states for filtering compatibility
  const getAllDistricts = (): string[] => {
    const list: string[] = [];
    Object.values(hierarchy).forEach((districtsObj) => {
      list.push(...Object.keys(districtsObj));
    });
    return Array.from(new Set(list)).sort();
  };

  return {
    hierarchy,
    states,
    getDistricts,
    getAreas,
    allAreas: getAllAreas(),
    allDistricts: getAllDistricts(),
    loading
  };
}
