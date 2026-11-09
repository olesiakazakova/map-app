import * as SQLite from 'expo-sqlite';

export const DATABASE_NAME = 'markers.db';
export const DATABASE_VERSION = 2;

export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  try {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await migrate(db);
    return db;
  } catch (error) {
    if (__DEV__) console.error('Ошибка инициализации базы данных:', error);
    throw error;
  }
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const version = row?.user_version ?? 0;
  if (version >= DATABASE_VERSION) return;

  if (version < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS markers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS marker_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        marker_id INTEGER NOT NULL,
        uri TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (marker_id) REFERENCES markers (id) ON DELETE CASCADE
      );
    `);
  }

  if (version < 2) {
    await db.execAsync(`
      ALTER TABLE markers ADD COLUMN title TEXT NOT NULL DEFAULT '';
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
}