export type AnnotationTool = 'select' | 'rect' | 'circle' | 'oval' | 'arrow' | 'pen' | 'text' | null;

export interface Point {
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  imageId: string;
  tool: 'rect' | 'circle' | 'oval' | 'arrow' | 'pen' | 'text';
  color: string;
  strokeWidth: number;
  label?: string;
  // coordinates in percentage (0 to 100) relative to image width/height for responsive scaling
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: Point[]; // for pen freehand
  endPoint?: Point; // for arrow
  createdAt: string;
}

export interface Observation {
  id: string;
  imageId?: string; // undefined if general
  imageTitle?: string;
  pageNumber?: number;
  author: string;
  role: string;
  scope: 'current' | 'general';
  category: 'defect' | 'warning' | 'info' | 'conformity';
  text: string;
  timestamp: string;
  annotationId?: string;
  avatarColor?: string;
  isAuditorVerified?: boolean;
  reactions?: Record<string, number>;
  userReacted?: string[];
}

export interface InspectionImage {
  id: string;
  page: number;
  indexInPage: number;
  globalIndex: number;
  title: string;
  category: string;
  src: string;
  timestamp: string;
  dimensions: string;
  fileSize: string;
  checksum: string;
  tags: string[];
  annotationsCount?: number;
}

export interface PageGroup {
  page: number;
  title: string;
  description: string;
  images: InspectionImage[];
}
