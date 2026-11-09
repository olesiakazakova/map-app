import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import * as SQLite from 'expo-sqlite';
import { openDatabase } from '../database/schema';
import * as ops from '../database/operations';
import { MapMarkerData, MarkerImage } from '../types';

interface MarkersContextValue {
  markers: MapMarkerData[];
  isLoading: boolean;
  error: Error | null;
  retryInit: () => void;
  refresh: () => Promise<void>;

  addMarker: (m: { title: string; latitude: number; longitude: number }) => Promise<MapMarkerData>;
  removeMarker: (id: string) => Promise<void>;
  addImage: (markerId: string, uri: string) => Promise<void>;
  removeImage: (markerId: string, imageId: string) => Promise<void>;
  getMarker: (id: string) => Promise<MapMarkerData | null>;
}

const MarkersContext = createContext<MarkersContextValue | null>(null);

export const MarkersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dbRef = useRef<SQLite.SQLiteDatabase | null>(null);
  const [markers, setMarkers] = useState<MapMarkerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [initAttempt, setInitAttempt] = useState(0);
  const mountedRef = useRef(true);

  const requireDb = useCallback((): SQLite.SQLiteDatabase => {
    if (!dbRef.current) throw new Error('База данных не инициализирована');
    return dbRef.current;
  }, []);

  const wrap = useCallback(<T,>(fn: () => Promise<T>): Promise<T> => {
    return (async () => {
      try {
        return await fn();
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        if (__DEV__) console.error('[MarkersContext]', err);
        if (mountedRef.current) setError(err);
        throw err;
      }
    })();
  }, []);

  const refresh = useCallback(async () => {
    await wrap(async () => {
      const data = await ops.selectMarkersWithImages(requireDb());
      if (mountedRef.current) setMarkers(data);
    });
  }, [wrap, requireDb]);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const db = await openDatabase();
        if (cancelled) { db.closeAsync().catch(() => {}); return; }
        dbRef.current = db;
        const data = await ops.selectMarkersWithImages(db);
        if (!cancelled) setMarkers(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      dbRef.current?.closeAsync().catch(() => {});
      dbRef.current = null;
    };
  }, [initAttempt]);

  const retryInit = useCallback(() => setInitAttempt((n) => n + 1), []);

  const addMarker: MarkersContextValue['addMarker'] = useCallback(
    (input) => wrap(async () => {
      const created = await ops.insertMarker(requireDb(), input);
      if (mountedRef.current) setMarkers((prev) => [created, ...prev]);
      return created;
    }),
    [wrap, requireDb]
  );

  const removeMarker = useCallback(
    (id: string) => wrap(async () => {
      await ops.deleteMarker(requireDb(), id);
      if (mountedRef.current) setMarkers((prev) => prev.filter((m) => m.id !== id));
    }),
    [wrap, requireDb]
  );

  const addImage = useCallback(
    (markerId: string, uri: string) => wrap(async () => {
      const img: MarkerImage = await ops.insertImage(requireDb(), markerId, uri);
      if (mountedRef.current) {
        setMarkers((prev) => prev.map((m) =>
          m.id === markerId ? { ...m, images: [...m.images, img] } : m
        ));
      }
    }),
    [wrap, requireDb]
  );

  const removeImage = useCallback(
    (markerId: string, imageId: string) => wrap(async () => {
      await ops.deleteImage(requireDb(), imageId);
      if (mountedRef.current) {
        setMarkers((prev) => prev.map((m) =>
          m.id === markerId
            ? { ...m, images: m.images.filter((i) => i.id !== imageId) }
            : m
        ));
      }
    }),
    [wrap, requireDb]
  );

  const getMarker = useCallback(
    (id: string) => wrap(() => ops.selectMarkerById(requireDb(), id)),
    [wrap, requireDb]
  );

  const value = useMemo<MarkersContextValue>(
    () => ({
      markers, isLoading, error, retryInit, refresh,
      addMarker, removeMarker, addImage, removeImage, getMarker,
    }),
    [markers, isLoading, error, retryInit, refresh,
     addMarker, removeMarker, addImage, removeImage, getMarker]
  );

  return <MarkersContext.Provider value={value}>{children}</MarkersContext.Provider>;
};

export const useMarkers = () => {
  const ctx = useContext(MarkersContext);
  if (!ctx) throw new Error('useMarkers должен использоваться внутри MarkersProvider');
  return ctx;
};