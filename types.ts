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