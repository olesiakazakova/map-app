import React, { createContext, useContext, useState, useCallback } from 'react';
import { MapMarkerData } from '../types';

interface MarkersContextValue {
  markers: MapMarkerData[];
  addMarker: (m: Omit<MapMarkerData, 'id' | 'images' | 'createdAt'>) => MapMarkerData;
  removeMarker: (id: string) => void;
  addImage: (markerId: string, uri: string) => void;
  removeImage: (markerId: string, imageId: string) => void;
  getMarker: (id: string) => MapMarkerData | undefined;
}

const MarkersContext = createContext<MarkersContextValue | null>(null);
const genId = () => Math.random().toString(36).slice(2, 10);

export const MarkersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [markers, setMarkers] = useState<MapMarkerData[]>([]);

  const addMarker: MarkersContextValue['addMarker'] = useCallback((m) => {
    const newMarker: MapMarkerData = { ...m, id: genId(), images: [], createdAt: Date.now() };
    setMarkers((prev) => [...prev, newMarker]);
    return newMarker;
  }, []);

  const removeMarker = useCallback((id: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const addImage = useCallback((markerId: string, uri: string) => {
    setMarkers((prev) =>
      prev.map((m) =>
        m.id === markerId ? { ...m, images: [...m.images, { id: genId(), uri, addedAt: Date.now() }] } : m
      )
    );
  }, []);

  const removeImage = useCallback((markerId: string, imageId: string) => {
    setMarkers((prev) =>
      prev.map((m) => (m.id === markerId ? { ...m, images: m.images.filter((i) => i.id !== imageId) } : m))
    );
  }, []);

  const getMarker = useCallback((id: string) => markers.find((m) => m.id === id), [markers]);

  return (
    <MarkersContext.Provider value={{ markers, addMarker, removeMarker, addImage, removeImage, getMarker }}>
      {children}
    </MarkersContext.Provider>
  );
};

export const useMarkers = () => {
  const ctx = useContext(MarkersContext);
  if (!ctx) throw new Error('useMarkers должен использоваться внутри MarkersProvider');
  return ctx;
};