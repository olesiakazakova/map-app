import * as SQLite from 'expo-sqlite';
import {
  MapMarkerData,
  MarkerImage,
  MarkerRow,
  MarkerImageRow,
} from '../types';

export class DatabaseError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

function log(...args: unknown[]) {
  if (__DEV__) console.log('[DB]', ...args);
}

function rowToImage(r: MarkerImageRow): MarkerImage {
  return {
    id: String(r.id),
    uri: r.uri,
    addedAt: new Date(r.created_at).getTime(),
  };
}

function rowToMarker(r: MarkerRow, images: MarkerImage[] = []): MapMarkerData {
  return {
    id: String(r.id),
    title: r.title,
    latitude: r.latitude,
    longitude: r.longitude,
    createdAt: new Date(r.created_at).getTime(),
    images,
  };
}

// Операции с маркерами

export async function insertMarker(
  db: SQLite.SQLiteDatabase,
  input: { title: string; latitude: number; longitude: number }
): Promise<MapMarkerData> {
  try {
    const res = await db.runAsync(
      'INSERT INTO markers (title, latitude, longitude) VALUES (?, ?, ?);',
      [input.title, input.latitude, input.longitude]
    );
    const row = await db.getFirstAsync<MarkerRow>(
      'SELECT * FROM markers WHERE id = ?;',
      [res.lastInsertRowId]
    );
    if (!row) throw new Error('Маркер не найден после вставки');
    log('insertMarker', row);
    return rowToMarker(row);
  } catch (e) {
    throw new DatabaseError('Не удалось создать маркер', e);
  }
}

export async function deleteMarker(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<void> {
  try {
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM markers WHERE id = ?;', [Number(id)]);
    });
  } catch (e) {
    throw new DatabaseError(`Не удалось удалить маркер ${id}`, e);
  }
}

export async function selectMarkers(db: SQLite.SQLiteDatabase): Promise<MapMarkerData[]> {
  try {
    const rows = await db.getAllAsync<MarkerRow>(
      'SELECT * FROM markers ORDER BY created_at DESC;'
    );
    return rows.map((r) => rowToMarker(r));
  } catch (e) {
    throw new DatabaseError('Не удалось загрузить маркеры', e);
  }
}

export async function selectMarkerById(
  db: SQLite.SQLiteDatabase,
  id: string
): Promise<MapMarkerData | null> {
  try {
    const row = await db.getFirstAsync<MarkerRow>(
      'SELECT * FROM markers WHERE id = ?;',
      [Number(id)]
    );
    if (!row) return null;
    const imgRows = await db.getAllAsync<MarkerImageRow>(
      'SELECT * FROM marker_images WHERE marker_id = ? ORDER BY created_at ASC;',
      [row.id]
    );
    return rowToMarker(row, imgRows.map(rowToImage));
  } catch (e) {
    throw new DatabaseError(`Не удалось загрузить маркер ${id}`, e);
  }
}

export async function selectMarkersWithImages(
  db: SQLite.SQLiteDatabase
): Promise<MapMarkerData[]> {
  try {
    type JoinedRow = MarkerRow & {
      img_id: number | null;
      img_uri: string | null;
      img_created_at: string | null;
    };
    const rows = await db.getAllAsync<JoinedRow>(`
      SELECT
        m.id, m.title, m.latitude, m.longitude, m.created_at,
        i.id         AS img_id,
        i.uri        AS img_uri,
        i.created_at AS img_created_at
      FROM markers m
      LEFT JOIN marker_images i ON i.marker_id = m.id
      ORDER BY m.created_at DESC, i.created_at ASC;
    `);

    const byId = new Map<string, MapMarkerData>();
    for (const r of rows) {
      const key = String(r.id);
      let marker = byId.get(key);
      if (!marker) {
        marker = rowToMarker(r);
        byId.set(key, marker);
      }
      if (r.img_id != null && r.img_uri != null && r.img_created_at != null) {
        marker.images.push({
          id: String(r.img_id),
          uri: r.img_uri,
          addedAt: new Date(r.img_created_at).getTime(),
        });
      }
    }
    return Array.from(byId.values());
  } catch (e) {
    throw new DatabaseError('Не удалось загрузить маркеры с изображениями', e);
  }
}

// Операции с изображениями

export async function insertImage(
  db: SQLite.SQLiteDatabase,
  markerId: string,
  uri: string
): Promise<MarkerImage> {
  try {
    const res = await db.runAsync(
      'INSERT INTO marker_images (marker_id, uri) VALUES (?, ?);',
      [Number(markerId), uri]
    );
    const row = await db.getFirstAsync<MarkerImageRow>(
      'SELECT * FROM marker_images WHERE id = ?;',
      [res.lastInsertRowId]
    );
    if (!row) throw new Error('Изображение не найдено после вставки');
    return rowToImage(row);
  } catch (e) {
    throw new DatabaseError('Не удалось добавить изображение', e);
  }
}

export async function deleteImage(
  db: SQLite.SQLiteDatabase,
  imageId: string
): Promise<void> {
  try {
    await db.runAsync('DELETE FROM marker_images WHERE id = ?;', [Number(imageId)]);
  } catch (e) {
    throw new DatabaseError(`Не удалось удалить изображение ${imageId}`, e);
  }
}

export async function selectImagesByMarker(
  db: SQLite.SQLiteDatabase,
  markerId: string
): Promise<MarkerImage[]> {
  try {
    const rows = await db.getAllAsync<MarkerImageRow>(
      'SELECT * FROM marker_images WHERE marker_id = ? ORDER BY created_at ASC;',
      [Number(markerId)]
    );
    return rows.map(rowToImage);
  } catch (e) {
    throw new DatabaseError('Не удалось загрузить изображения', e);
  }
}