// Изначальные структуры
export interface MarkerImage {
  id: string;
  uri: string;
  addedAt: number;
}

export interface MapMarkerData {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  images: MarkerImage[];
  createdAt: number;
}

export type RootStackParamList = {
  index: undefined;
  'marker/[id]': { id: string };
};

// Структуры для БД
export interface MarkerRow {
  id: number;
  title: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface MarkerImageRow {
  id: number;
  marker_id: number;
  uri: string;
  created_at: string;
}