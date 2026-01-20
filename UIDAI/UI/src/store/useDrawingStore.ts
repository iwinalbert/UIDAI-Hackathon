import { create } from 'zustand';

// Drawing tool types
export type DrawingToolType =
    // Lines
    | 'trendLine' | 'ray' | 'infoLine' | 'extendedLine' | 'trendAngle'
    | 'horizontalLine' | 'horizontalRay' | 'verticalLine' | 'crossLine'
    // Channels
    | 'parallelChannel' | 'regressionTrend' | 'flatTopBottom' | 'disjointChannel'
    // Brushes
    | 'brush' | 'highlighter'
    // Arrows
    | 'arrowMarker' | 'arrow' | 'arrowUp' | 'arrowDown'
    // Shapes
    | 'rectangle' | 'rotatedRectangle' | 'path' | 'circle' | 'ellipse'
    | 'polyline' | 'triangle' | 'arc' | 'curve' | 'doubleCurve'
    // Text & Notes
    | 'text' | 'anchoredText' | 'note' | 'priceNote' | 'pin' | 'table'
    | 'callout' | 'comment' | 'priceLabel' | 'signpost' | 'flagMark'
    // Utility
    | 'cursor' | 'measure' | 'zoom';

export type DrawingCategory = 'lines' | 'brushes' | 'text' | 'shapes' | 'measure' | 'zoom';

export interface Point {
    x: number;
    y: number;
    time?: string;
    price?: number;
}

export interface Drawing {
    id: string;
    type: DrawingToolType;
    points: Point[];
    color: string;
    lineWidth: number;
    text?: string;
    visible: boolean;
    locked: boolean;
    createdAt: Date;
}

interface DrawingState {
    // Active tool
    activeTool: DrawingToolType | null;
    activeCategory: DrawingCategory | null;

    // Drawing settings
    drawingColor: string;
    lineWidth: number;

    // Controls
    keepDrawing: boolean;
    drawingsVisible: boolean;

    // Drawings storage
    drawings: Drawing[];
    selectedDrawingId: string | null;

    // Actions
    setActiveTool: (tool: DrawingToolType | null) => void;
    setActiveCategory: (category: DrawingCategory | null) => void;
    setKeepDrawing: (keep: boolean) => void;
    toggleDrawingsVisible: () => void;
    setDrawingColor: (color: string) => void;
    setLineWidth: (width: number) => void;

    // Drawing CRUD
    addDrawing: (drawing: Omit<Drawing, 'id' | 'createdAt'>) => void;
    updateDrawing: (id: string, updates: Partial<Drawing>) => void;
    deleteDrawing: (id: string) => void;
    deleteAllDrawings: () => void;
    selectDrawing: (id: string | null) => void;
}

export const useDrawingStore = create<DrawingState>((set) => ({
    // Initial state
    activeTool: null,
    activeCategory: null,
    drawingColor: '#2962FF',
    lineWidth: 2,
    keepDrawing: false,
    drawingsVisible: true,
    drawings: [],
    selectedDrawingId: null,

    // Actions
    setActiveTool: (tool) => set({ activeTool: tool }),
    setActiveCategory: (category) => set({ activeCategory: category }),
    setKeepDrawing: (keep) => set({ keepDrawing: keep }),
    toggleDrawingsVisible: () => set((state) => ({ drawingsVisible: !state.drawingsVisible })),
    setDrawingColor: (color) => set({ drawingColor: color }),
    setLineWidth: (width) => set({ lineWidth: width }),

    // Drawing CRUD
    addDrawing: (drawing) => set((state) => ({
        drawings: [...state.drawings, {
            ...drawing,
            id: `drawing_${Date.now()}`,
            createdAt: new Date()
        }]
    })),

    updateDrawing: (id, updates) => set((state) => ({
        drawings: state.drawings.map(d =>
            d.id === id ? { ...d, ...updates } : d
        )
    })),

    deleteDrawing: (id) => set((state) => ({
        drawings: state.drawings.filter(d => d.id !== id),
        selectedDrawingId: state.selectedDrawingId === id ? null : state.selectedDrawingId
    })),

    deleteAllDrawings: () => set({ drawings: [], selectedDrawingId: null }),

    selectDrawing: (id) => set({ selectedDrawingId: id })
}));
