import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    MarkerType,
    Node,
    Edge,
    ReactFlowProvider,
    useReactFlow,
    getSmoothStepPath,
    EdgeLabelRenderer,
    BaseEdge,
    EdgeProps,
    Position,
    Handle
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import dagre from 'dagre';
import { Button } from "@/components/ui/button";
import { BrainCircuit, ChevronRight, ChevronLeft, Map, Compass, Maximize, Minimize, X, Zap, Download, Maximize2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface ConceptMapViewProps {
    mindmapCode: string | any;
    lectureId?: string;
}

interface GuideNode {
    node: string;
    explanation: string;
}

const FitViewTrigger = ({ step, isInteractive, viewMode, nodes }: { step: number; isInteractive: boolean; viewMode: string; nodes: any[] }) => {
    const { fitView } = useReactFlow();
    useEffect(() => {
        const timeout = setTimeout(() => {
            fitView({
                padding: viewMode === 'compact' ? 0.1 : 0.2,
                duration: 800,
                minZoom: 0.05,
                maxZoom: 1
            });
        }, 200);
        return () => clearTimeout(timeout);
    }, [step, isInteractive, viewMode, nodes.length, fitView]);
    return null;
};

const NODE_WIDTH = 280;
const NODE_HEIGHT = 70;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB', isRTL = false, viewMode: 'full' | 'compact' = 'full') => {
    const dagreInstance = dagre.graphlib ? dagre : (dagre as any).default;
    const dagreGraph = new dagreInstance.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const nodeW = viewMode === 'compact' ? 400 : NODE_WIDTH;
    const nodeH = viewMode === 'compact' ? 100 : NODE_HEIGHT;
    const rSep = viewMode === 'compact' ? 100 : 180;
    const nSep = viewMode === 'compact' ? 80 : 120;

    dagreGraph.setGraph({ rankdir: direction, ranksep: rSep, nodesep: nSep, ranker: 'network-simplex' });

    nodes.forEach((node) => {
        dagreGraph.setNode(String(node.id), { width: nodeW, height: nodeH });
    });

    const validNodeIds = new Set(nodes.map(n => String(n.id)));
    const validEdges = edges.filter(
        (edge) => validNodeIds.has(String(edge.source)) && validNodeIds.has(String(edge.target))
    );

    validEdges.forEach((edge) => {
        dagreGraph.setEdge(String(edge.source), String(edge.target));
    });

    dagreInstance.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(String(node.id));
        node.targetPosition = Position.Top;
        node.sourcePosition = Position.Bottom;

        if (nodeWithPosition) {
            node.position = {
                x: nodeWithPosition.x - (nodeW / 2),
                y: nodeWithPosition.y - (nodeH / 2),
            };
        }
    });

    return { nodes, edges: validEdges };
};


// 1. Custom Edge to handle labels correctly (Above the lines)
const CustomEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    label,
}: EdgeProps) => {
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetPosition,
        targetX,
        targetY,
        borderRadius: 16,
    });

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
            {label && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: 'all',
                        }}
                        className="nodrag nopan"
                    >
                        <div className="bg-white px-3 py-1.5 rounded-lg border border-orange-100 shadow-sm text-[#111827] text-[13px] font-black whitespace-nowrap animate-in fade-in zoom-in duration-200">
                            {label}
                        </div>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
};

const edgeTypes = {
    custom: CustomEdge,
};

const CustomNode = ({ data }: { data: any }) => {
    const level = data.level || 0;
    const isRTL = data.isRTL || false;

    // Premium White & Orange Design
    const styles: Record<number, { bg: string; border: string; text: string; size: string; weight: string; shadow: string }> = {
        0: { bg: '#F05A22', border: '#D04408', text: '#ffffff', size: '17px', weight: '900', shadow: '0 12px 40px rgba(240,90,34,0.35)' },
        1: { bg: '#ffffff', border: '#F05A22', text: '#F05A22', size: '15px', weight: '700', shadow: '0 4px 18px rgba(240,90,34,0.12)' },
        2: { bg: '#ffffff', border: '#cbd5e1', text: '#334155', size: '13px', weight: '600', shadow: '0 2px 10px rgba(0,0,0,0.06)' },
    };

    const s = styles[Math.min(level, 2)];

    return (
        <div
            dir={isRTL ? 'rtl' : 'ltr'}
            className={cn(
                "rounded-2xl p-[14px_22px] min-w-[160px] max-w-[320px] leading-[1.5] break-words font-display transition-all duration-300 border-[2.5px]",
                isRTL ? "text-right" : "text-left"
            )}
            style={{
                background: s.bg,
                borderColor: s.border,
                color: s.text,
                fontSize: s.size,
                fontWeight: s.weight as any,
                boxShadow: s.shadow,
            }}
        >
            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
            {data.label}
            <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
        </div>
    );
};

const nodeTypes = { custom: CustomNode };

// Custom floating control panel - updated with localized labels and better logic
const CustomControlPanel = ({
    downloadMap,
    isInteractive,
    viewMode,
    setViewMode,
    isFullscreen,
    lectureId
}: {
    downloadMap: () => void;
    isInteractive: boolean;
    viewMode: 'full' | 'compact';
    setViewMode: (v: 'full' | 'compact') => void;
    isFullscreen: boolean;
    lectureId?: string;
}) => {
    const { fitView } = useReactFlow();
    const { language } = useLanguage();

    const t = {
        zoom: language === 'ar' ? 'تكبير' : 'Zoom',
        fit: language === 'ar' ? 'احتواء' : 'Fit',
        download: language === 'ar' ? 'تحميل' : 'Download',
        newTab: language === 'ar' ? 'فتح في نافذة' : 'New Tab',
    };

    return (
        <div className="absolute bottom-6 left-6 z-10 flex gap-2 flex-col">
            {!isInteractive && (
                <div className="flex flex-col gap-[6px] bg-white/92 backdrop-blur-[8px] border border-[#e2e8f0] rounded-[16px] p-[10px] shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                    <button onClick={() => fitView({ padding: 0.2, duration: 600 })} title={t.fit} className="bg-none border-none cursor-pointer p-1.5 rounded-lg text-[#5a4139] hover:bg-slate-100 flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-[20px]">fit_screen</span>
                    </button>
                    <button onClick={downloadMap} title={t.download} className="bg-none border-none cursor-pointer p-1.5 rounded-lg text-[#5a4139] hover:bg-slate-100 flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-[20px]">download</span>
                    </button>
                </div>
            )}
        </div>
    );
};

function ConceptMapContent({ mindmapCode, lectureId }: ConceptMapViewProps) {
    const { language, isRTL } = useLanguage();

    const reactFlowInstance = useReactFlow();
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    const [guide, setGuide] = useState<GuideNode[]>([]);
    const [isInteractive, setIsInteractive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [parseError, setParseError] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [viewMode, setViewMode] = useState<'full' | 'compact'>('full');
    const [levelMap, setLevelMap] = useState<Record<string, number>>({});

    // Track original layouted nodes to avoid losing styles when mutating for visibility
    const [originalNodes, setOriginalNodes] = useState<Node[]>([]);
    const [originalEdges, setOriginalEdges] = useState<Edge[]>([]);

    useEffect(() => {
        if (!mindmapCode) return;

        try {
            const parsed = typeof mindmapCode === "string" ? JSON.parse(mindmapCode) : mindmapCode;
            const nodesData = parsed.nodes || [];
            const edgesData = parsed.edges || [];

            // 1. Calculate Levels using BFS
            const levelMapData: Record<string, number> = {};
            if (nodesData && nodesData.length > 0) {
                const adj: Record<string, string[]> = {};
                edgesData.forEach((e: any) => {
                    if (!adj[e.source]) adj[e.source] = [];
                    adj[e.source].push(e.target);
                });

                const rootNode = nodesData[0];
                if (rootNode && rootNode.id) {
                    const rootId = String(rootNode.id);
                    levelMapData[rootId] = 0;
                    const queue: [string, number][] = [[rootId, 0]];
                    const visited = new Set([rootId]);

                    while (queue.length > 0) {
                        const [currId, level] = queue.shift()!;
                        levelMapData[currId] = level;

                        (adj[currId] || []).forEach(nextId => {
                            if (!visited.has(nextId)) {
                                visited.add(nextId);
                                queue.push([nextId, level + 1]);
                            }
                        });
                    }
                }
                setLevelMap(levelMapData);
            }

            let initialNodes: Node[] = nodesData.map((n: any) => {
                const level = levelMapData[String(n.id)] || 0;

                return {
                    id: String(n.id),
                    type: 'custom',
                    data: { label: n.label || "Unnamed Concept", rawLabel: n.label || "", level, isRTL },
                    position: { x: 0, y: 0 },
                    style: {
                        width: NODE_WIDTH,
                        padding: 0,
                        border: 'none',
                        background: 'transparent',
                        boxShadow: 'none',
                        zIndex: level === 0 ? 10 : 1, // Core Concept always on top visually
                    },
                };
            });

            let initialEdges: Edge[] = edgesData.map((e: any) => ({
                id: String(e.id || `${e.source}-${e.target}`),
                source: String(e.source),
                target: String(e.target),
                type: 'custom', // Use the new CustomEdge
                label: e.label || undefined,
                animated: false,
                style: { stroke: '#F05A22', strokeWidth: 2.5, opacity: 0.8 }, // Vibrant Premium Orange
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#F05A22',
                    width: 24,
                    height: 24,
                },
            }));

            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                initialNodes,
                initialEdges,
                'TB',
                isRTL
            );

            setOriginalNodes(layoutedNodes);
            setOriginalEdges(layoutedEdges);
            setNodes(layoutedNodes);
            setEdges(layoutedEdges);

            if (parsed.interactiveGuide && Array.isArray(parsed.interactiveGuide)) {
                setGuide(parsed.interactiveGuide);
            }

            setParseError(false);
        } catch (e) {
            console.error("Failed to parse map data:", e);
            setParseError(true);
        }
    }, [mindmapCode, isRTL]);

    // Enhanced string normalization for robust matching
    const normalizeText = (text: string) => {
        if (!text) return "";
        // Remove all non-alphanumeric chars (including Arabic diacritics), keep spaces, trim, lowercase
        return String(text)
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents/diacritics
            .replace(/[^\w\u0621-\u064A\s]/g, '') // Keep Arabic letters, English letters, numbers, spaces. Remove symbols
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    };

    const nextStep = () => {
        if (isTransitioning || currentStep >= guide.length - 1) return;
        setIsTransitioning(true);
        setCurrentStep(prev => prev + 1);
        // Reduce lock-out time for snappier feel while still preventing layout collisions
        setTimeout(() => setIsTransitioning(false), 300); 
    };

    const prevStep = () => {
        if (isTransitioning || currentStep <= -1) return;
        setIsTransitioning(true);
        setCurrentStep(prev => prev - 1);
        setTimeout(() => setIsTransitioning(false), 300);
    };

    useEffect(() => {
        try {
            if (!originalNodes || originalNodes.length === 0) return;

            if (!isInteractive || guide.length === 0) {
                if (viewMode === 'compact') {
                    const compactNodeIds = new Set(
                        originalNodes.filter(n => (levelMap[n.id] ?? 0) <= 2).map(n => n.id)
                    );

                    if (compactNodeIds.size === 0 && originalNodes.length > 0) compactNodeIds.add(originalNodes[0].id);

                    // 1. Filter and SCALE nodes
                    const filteredNodes = originalNodes
                        .filter(n => compactNodeIds.has(n.id))
                        .map(n => {
                            const level = levelMap[n.id] || 0;
                            return {
                                ...n,
                                style: {
                                    ...n.style,
                                    fontSize: level === 0 ? '24px' : '18px', // Significantly larger text
                                    padding: '20px 24px',
                                    width: 400,
                                    minHeight: 100,
                                    borderRadius: '16px',
                                }
                            };
                        });

                    // 2. Filter and SCALE edges
                    const filteredEdges = originalEdges
                        .filter(e => compactNodeIds.has(e.source) && compactNodeIds.has(e.target))
                        .map(e => ({
                            ...e,
                            style: { ...e.style, strokeWidth: 5 }, // Thicker arrows
                            labelStyle: { ...e.labelStyle, fontSize: 16 }, // Larger labels
                            markerEnd: (typeof e.markerEnd === 'object' && e.markerEnd !== null) ? {
                                ...e.markerEnd,
                                width: 20,
                                height: 20,
                            } : e.markerEnd,
                        }));

                    // 3. RE-LAYOUT specifically for this subset and scale
                    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                        filteredNodes,
                        filteredEdges,
                        'TB',
                        isRTL,
                        'compact'
                    );

                    setNodes(layoutedNodes);
                    setEdges(layoutedEdges);
                } else {
                    setNodes(originalNodes);
                    setEdges(originalEdges);
                }
                return;
            }

            // 1. Identify which nodes should be visible based on the guide
            const visibleNodeIds = new Set<string>();
            visibleNodeIds.add(originalNodes[0].id); // Always root
            let currentActiveNodeId: string | null = null;

            if (currentStep >= 0) {
                for (let i = 0; i <= currentStep; i++) {
                    const gText = normalizeText(guide[i].node);
                    let bestMatchId: string | null = null;
                    let bestScore = -1;

                    originalNodes.forEach(n => {
                        const nText = normalizeText(n.data.rawLabel as string);
                        if (!nText || !gText) return;

                        let score = -1;
                        if (nText === gText) {
                            score = 1000;
                        } else if (nText.includes(gText)) {
                            score = 100 - (nText.length - gText.length);
                        } else if (gText.includes(nText)) {
                            score = 100 - (gText.length - nText.length);
                        }

                        if (score > bestScore) {
                            bestScore = score;
                            bestMatchId = n.id;
                        }
                    });

                    if (bestMatchId) {
                        visibleNodeIds.add(bestMatchId);
                        if (i === currentStep) {
                            currentActiveNodeId = bestMatchId;
                        }
                    }
                }
            } else {
                currentActiveNodeId = originalNodes[0].id;
            }

            // 2. Ensure connectivity: Include any parent nodes necessary to connect visible nodes back to the root
            let addedNew = true;
            let iterations = 0;
            while (addedNew && iterations < 50) {
                addedNew = false;
                iterations++;
                originalEdges.forEach(e => {
                    if (visibleNodeIds.has(e.target) && !visibleNodeIds.has(e.source)) {
                        visibleNodeIds.add(e.source);
                        addedNew = true;
                    }
                });
            }

            const visibleOriginalNodes = originalNodes.filter(n => visibleNodeIds.has(n.id));
            const visibleOriginalEdges = originalEdges.filter(e =>
                visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
            );

            if (visibleOriginalNodes.length === 0 && originalNodes.length > 0) {
                setNodes([originalNodes[0]]);
                setEdges([]);
                return;
            }

            // 3. RELAYOUT: recalculate the graph geometry for ONLY the currently visible elements
            const nodesToLayout = visibleOriginalNodes.map(n => ({ ...n, position: { ...n.position }, data: { ...n.data }, style: { ...n.style } }));
            const edgesToLayout = visibleOriginalEdges.map(e => ({ 
                ...e, 
                style: { ...e.style }, 
                labelStyle: { ...e.labelStyle },
                data: e.data ? { ...e.data } : {} 
            }));

            const { nodes: relayoutedNodes, edges: relayoutedEdges } = getLayoutedElements(
                nodesToLayout,
                edgesToLayout,
                'TB',
                isRTL
            );

            // 4. Apply current styling (glow) to the active concept
            const decoratedNodes = relayoutedNodes.map(n => {
                const isCurrent = n.id === currentActiveNodeId;
                return {
                    ...n,
                    hidden: false,
                    className: isCurrent ? 'scale-[1.05] transition-transform duration-300' : 'scale-100 transition-transform duration-300',
                    style: {
                        ...n.style,
                        opacity: isCurrent ? 1 : 0.4,
                        pointerEvents: isCurrent ? ('auto' as any) : ('all' as any),
                        filter: isCurrent ? 'drop-shadow(0 0 10px rgba(168, 51, 0, 0.4))' : 'grayscale(30%)',
                        transition: 'opacity 0.4s ease-out, filter 0.4s ease-out',
                        zIndex: isCurrent ? 1000 : 1,
                    }
                };
            });

            const activeEdges = relayoutedEdges.map(e => {
                return {
                    ...e,
                    hidden: false,
                    style: {
                        ...e.style,
                        opacity: 1,
                        transition: 'opacity 0.4s ease-out'
                    },
                    labelStyle: {
                        ...e.labelStyle,
                        opacity: 1,
                        transition: 'opacity 0.4s ease-out'
                    }
                };
            });

            setNodes(decoratedNodes);
            setEdges(activeEdges);
        } catch (err) {
            console.error("[ConceptMap] Critical Layouting Error:", err);
            // Fallback to original nodes to prevent white screen
            if (originalNodes.length > 0) {
                setNodes(originalNodes);
                setEdges(originalEdges);
            }
        }
    }, [isInteractive, currentStep, guide, originalNodes, originalEdges, isRTL, setNodes, setEdges, viewMode, levelMap]);

    const startPresentation = () => {
        setIsInteractive(true);
        setIsFullscreen(true);
        setCurrentStep(-1);
    };

    const exitPresentation = () => {
        setIsInteractive(false);
        setIsFullscreen(false);
        setCurrentStep(0);
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const downloadMap = async () => {
        const viewportEl = document.querySelector('.react-flow__viewport') as HTMLElement;
        if (!viewportEl) return;

        try {
            const nodes = reactFlowInstance.getNodes();
            if (nodes.length === 0) return;

            // 1. Calculate the exact bounds of all nodes
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            
            nodes.forEach(node => {
                const x = node.position.x;
                const y = node.position.y;
                const w = node.measured?.width ?? NODE_WIDTH;
                const h = node.measured?.height ?? NODE_HEIGHT;
                
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x + w > maxX) maxX = x + w;
                if (y + h > maxY) maxY = y + h;
            });

            // 2. Add margin (padding) to the capture
            const padding = 80;
            const mapWidth = maxX - minX + (padding * 2);
            const mapHeight = maxY - minY + (padding * 2);

            // 3. Capture at 2x scale for high quality
            const scale = 2;
            const finalWidth = mapWidth * scale;
            const finalHeight = mapHeight * scale;

            const dataUrl = await toPng(viewportEl, {
                backgroundColor: '#ffffff',
                width: finalWidth,
                height: finalHeight,
                style: {
                    width: `${finalWidth}px`,
                    height: `${finalHeight}px`,
                    // This transform shifts the top-left node to the top-left of the image (accounting for padding and scale)
                    transform: `scale(${scale}) translate(${-minX + padding}px, ${-minY + padding}px)`,
                    transformOrigin: 'top left',
                },
                filter: (node) => {
                    if (node?.classList?.contains('react-flow__minimap')) return false;
                    if (node?.classList?.contains('react-flow__controls')) return false;
                    return true;
                }
            });

            const link = document.createElement('a');
            link.download = `lecture-mindmap-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to download map:', err);
        }
    };

    if (parseError) {
        return (
            <div className="w-full min-h-[400px] flex items-center justify-center border-2 border-dashed border-destructive/50 rounded-xl bg-destructive/5 p-8 text-center flex-col">
                <BrainCircuit className="w-12 h-12 text-destructive/50 mb-4 animate-pulse" />
                <h4 className="text-lg font-bold text-destructive mb-2">
                    {language === 'ar' ? 'حدث خطأ أثناء تحميل الخريطة' : 'Error rendering Concept Map'}
                </h4>
                <p className="text-muted-foreground text-sm max-w-lg mb-4">
                    {language === 'ar' ? 'نمط البيانات غير متوافق. يرجى مسح السجل وإعادة المحاولة.' : 'Data syntax incompatible. Please clear log and retry.'}
                </p>

                {/* DEBUG VIEW FOR THE USER */}
                <div className="w-full text-left mt-4">
                    <p className="font-bold text-sm mb-2 text-destructive">Debug - Received Data:</p>
                    <pre className="bg-background text-foreground p-4 rounded-md overflow-x-auto text-xs whitespace-pre-wrap max-h-[300px] border border-destructive/20">
                        {typeof mindmapCode === 'string' ? mindmapCode : JSON.stringify(mindmapCode, null, 2)}
                    </pre>
                </div>
            </div>
        );
    }

    if (!mindmapCode || originalNodes.length === 0) {
        return (
            <div className="w-full min-h-[400px] flex items-center justify-center border-2 border-dashed border-muted rounded-xl bg-card/50 p-8 text-center flex-col">
                <Map className="w-12 h-12 text-muted-foreground mb-4" />
                <h4 className="text-lg font-bold text-foreground mb-2">
                    {language === 'ar' ? 'لا توجد خريطة مفاهيمية' : 'No Concept Map Available'}
                </h4>
                <p className="text-muted-foreground text-sm max-w-lg mb-4">
                    {language === 'ar' ? 'نموذج الذكاء الاصطناعي لم يقم بإنشاء خريطة لهذه المحاضرة حتى الآن. يمكنك إغلاق المحاضرة وإعادة معالجتها.' : 'The AI model has not generated a map for this lecture yet. Please re-run the AI process to create one.'}
                </p>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-4">
            <div className={cn(
                "relative rounded-3xl overflow-hidden border border-slate-200 bg-white animate-in fade-in duration-500 shadow-sm transition-all group",
                isFullscreen ? "fixed inset-0 z-[5000] rounded-none border-none flex flex-col" : "w-full",
                !isFullscreen && (isInteractive ? "h-[65vh] min-h-[500px]" : "h-[85vh] min-h-[750px]")
            )}>
                {/* Fullscreen Wrapper for Map area */}
                <div className={cn("relative flex-1", !isFullscreen && "h-full w-full")}>
            {/* SVG Background for Connective illusion */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 mix-blend-multiply z-0">
                <defs>
                   <radialGradient id="grad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#a83300" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                   </radialGradient>
                </defs>
                <circle cx="50%" cy="50%" r="40%" fill="url(#grad)" />
            </svg>

            {/* Concept Map Toolbar - Hide during Interactive Mode to prevent overlap */}
            {!isInteractive && (
                <div className="absolute top-6 left-6 right-6 z-40 flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-none">
                    <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-slate-200/50 shadow-lg pointer-events-auto">
                        <div className="w-8 h-8 rounded-xl bg-[#F05A22] flex items-center justify-center text-white">
                            <BrainCircuit className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-slate-900 leading-none">
                                {language === 'ar' ? 'الخريطة المفاهيمية' : 'Concept Mapping'}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">
                                {language === 'ar' ? 'أتمتة الذكاء الاصطناعي' : 'AI Powered logic'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white/95 backdrop-blur-xl p-2 rounded-2xl border border-slate-200/50 shadow-2xl pointer-events-auto">
                        {/* View Modes */}
                        <div className="flex bg-slate-50 p-1 rounded-xl mr-2">
                             <button 
                                onClick={() => setViewMode('compact')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                                    viewMode === 'compact' ? "bg-white text-[#F05A22] shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                <Compass className="w-3.5 h-3.5" />
                                {language === 'ar' ? 'ملخص' : 'Summary'}
                            </button>
                            <button 
                                onClick={() => setViewMode('full')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                                    viewMode === 'full' ? "bg-white text-[#F05A22] shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                <Map className="w-3.5 h-3.5" />
                                {language === 'ar' ? 'كامل' : 'Full'}
                            </button>
                        </div>

                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

                        {/* Interactive Button */}
                        <button 
                            onClick={startPresentation}
                            className="flex items-center gap-2 px-4 py-1.5 bg-[#F05A22]/10 hover:bg-[#F05A22]/20 text-[#F05A22] rounded-xl text-xs font-black transition-all border border-[#F05A22]/20"
                        >
                            <Zap className="w-3.5 h-3.5" />
                            {language === 'ar' ? 'بدء وضع العرض التفاعلي' : 'Guided Presentation'}
                        </button>


                        {/* Action Tooltips */}
                        <div className="flex gap-1 ml-2">
                            <button 
                                onClick={toggleFullscreen} 
                                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                                title={isFullscreen ? (language === 'ar' ? 'تصغير' : 'Exit Fullscreen') : (language === 'ar' ? 'تكبير' : 'Fullscreen')}
                            >
                                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                            </button>

                            <button 
                                onClick={downloadMap} 
                                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                                title={language === 'ar' ? 'تحميل كصورة' : 'Export as Image'}
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Interactive Controls (FIXED TOP HORIZONTAL ROW) */}
            {isInteractive && guide.length > 0 && (
                <div className={cn(
                    "fixed top-4 z-[5001] flex items-center gap-2 animate-in fade-in slide-in-from-top-4 pointer-events-none",
                    isRTL ? "left-4" : "right-4"
                )}>
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md p-2 rounded-full border border-orange-100 shadow-lg pointer-events-auto">
                        {/* Prev Button */}
                        <button 
                            onClick={prevStep} 
                            disabled={currentStep === -1 || isTransitioning} 
                            className="w-10 h-10 rounded-full bg-white text-[#F05A22] border border-orange-100 disabled:opacity-40 flex items-center justify-center shadow-md hover:bg-orange-50 transition-all hover:scale-105 active:scale-95"
                            title={language === 'ar' ? 'السابق' : 'Previous'}
                        >
                            <span className="material-symbols-outlined text-lg">{isRTL ? "chevron_right" : "chevron_left"}</span>
                        </button>

                        <div className="px-2 text-[10px] font-black text-[#F05A22] border-x border-orange-100 flex flex-col items-center min-w-[45px]">
                            <span>{currentStep + 1}</span>
                            <span className="h-[1px] w-full bg-orange-100" />
                            <span className="text-slate-400">{guide.length}</span>
                        </div>

                        {/* Next Button */}
                        <button 
                            onClick={nextStep} 
                            disabled={currentStep === guide.length - 1 || isTransitioning} 
                            className="w-10 h-10 rounded-full bg-gradient-to-r from-[#a83300] to-[#d04408] disabled:opacity-40 flex items-center justify-center text-white shadow-md hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                            title={language === 'ar' ? 'التالي' : 'Next'}
                        >
                            <span className="material-symbols-outlined text-2xl">{isRTL ? "chevron_left" : "chevron_right"}</span>
                        </button>
                    </div>

                    <div className="w-[1px] h-8 bg-slate-200 mx-1" />

                    {/* Exit Button */}
                    <button 
                        onClick={exitPresentation} 
                        className="w-10 h-10 rounded-full bg-white text-[#F05A22] border border-orange-100 flex items-center justify-center shadow-lg hover:bg-orange-50 transition-all hover:scale-105 active:scale-95 pointer-events-auto"
                        title={language === 'ar' ? 'إغلاق' : 'Close'}
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            )}







            <ReactFlowProvider>
                <FitViewTrigger step={currentStep} isInteractive={isInteractive} viewMode={viewMode} nodes={nodes} />
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    minZoom={0.05}
                    proOptions={{ hideAttribution: true }}
                    nodesConnectable={false}
                    nodesDraggable={viewMode === 'full' && !isInteractive} // disable dragging in compact mode
                    panOnScroll={true}
                    panOnDrag={true}
                    zoomOnScroll={true}
                    zoomOnPinch={true}
                    zoomOnDoubleClick={true}
                    preventScrolling={false}
                >
                    <CustomControlPanel 
                        downloadMap={downloadMap} 
                        isInteractive={isInteractive} 
                        viewMode={viewMode} 
                        setViewMode={setViewMode} 
                        isFullscreen={isFullscreen}
                        lectureId={lectureId}
                    />
                </ReactFlow>
            </ReactFlowProvider>
            </div>

            {/* Explanation Card (FOR FULLSCREEN MODE - Physical Docking at bottom) */}
            {isInteractive && guide.length > 0 && isFullscreen && (
                <div className={cn(
                    "w-full bg-white px-8 py-6 border-t border-orange-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom-10",
                    isRTL ? "text-right" : "text-left"
                )}>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-[#a83300] bg-[#a83300]/10 p-2 rounded-xl text-lg font-bold">smart_toy</span>
                        <h4 className="text-2xl font-black font-headline text-[#191c1e]">
                             {currentStep === -1 ? (String(originalNodes[0]?.data.rawLabel || 'Lecture Overview')) : String(guide[currentStep].node || '')}
                        </h4>
                    </div>
                    <div className="text-[#5a4139] leading-relaxed text-lg max-w-5xl mx-auto">
                        {currentStep === -1
                            ? <p>{language === 'ar' ? 'نمط العرض التفاعلي سيقودك عبر أهم المفاهيم.' : 'Guided mode will walk you through the core concepts.'}</p>
                            : guide[currentStep].explanation.split('\n').map((para, i) => (
                                para.trim() ? <p key={i} className="mb-3">{para}</p> : null
                            ))}
                    </div>
                </div>
            )}
            </div>

            {/* Explanation Card (STRUCTURALLY BELOW THE MAP FRAME - Only when NOT in fullscreen) */}
            {isInteractive && guide.length > 0 && !isFullscreen && (
                <div className={cn(
                    "w-full bg-white p-6 md:p-8 rounded-3xl border border-orange-100 shadow-sm animate-in slide-in-from-bottom-4",
                    isRTL ? "text-right" : "text-left"
                )}>
                    <div className="flex items-center gap-3 mb-3">
                        <span className="material-symbols-outlined text-[#a83300] bg-[#a83300]/10 p-2 rounded-xl text-lg">smart_toy</span>
                        <h4 className="text-xl font-extrabold font-headline text-[#191c1e]">
                             {currentStep === -1 ? (String(originalNodes[0]?.data.rawLabel || 'Lecture Overview')) : String(guide[currentStep].node || '')}
                        </h4>
                    </div>
                    <div className="text-[#5a4139] leading-relaxed text-base">
                        {currentStep === -1
                            ? <p>{language === 'ar' ? 'نمط العرض التفاعلي سيقودك عبر أهم المفاهيم.' : 'Guided mode will walk you through the core concepts.'}</p>
                            : guide[currentStep].explanation.split('\n').map((para, i) => (
                                para.trim() ? <p key={i} className="mb-2">{para}</p> : null
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function ConceptMapView(props: ConceptMapViewProps) {
    return (
        <ReactFlowProvider>
            <ConceptMapContent {...props} />
        </ReactFlowProvider>
    );
}

