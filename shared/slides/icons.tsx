import React from "react";
import {
  Activity, AlertTriangle, Atom, BarChart3, Battery, Beaker, BookOpen, Box, Boxes, Brain,
  Calculator, CheckCircle2, CircuitBoard, Clock, Cloud, Code2, Cog, Compass, Cpu, Database,
  Dna, Droplet, Eye, Flame, Gauge, GitBranch, Globe, GraduationCap, HardDrive, Heart, Info,
  Key, Layers, Lightbulb, Link as LinkIcon, Lock, Magnet, Map as MapIcon, MemoryStick,
  Microscope, Network, Pill, Plug, Power, Puzzle, Radio, Rocket, Ruler, Server, Settings,
  Shield, Sigma, Signal, Star, Stethoscope, Target, Thermometer, TrendingUp, Triangle,
  Waves, Wifi, Workflow, Wrench, Zap, Circle, type LucideIcon,
} from "lucide-react";

// Keyword -> icon. Names the AI is told to use map here; unknown names fall back.
const MAP: Record<string, LucideIcon> = {
  cpu: Cpu, processor: Cpu, microcontroller: Cpu, chip: Cpu, microchip: Cpu,
  circuit: CircuitBoard, board: CircuitBoard, pcb: CircuitBoard, electronics: CircuitBoard,
  power: Power, energy: Zap, voltage: Zap, current: Zap, electric: Zap, bolt: Zap,
  battery: Battery, plug: Plug, signal: Signal, wifi: Wifi, radio: Radio, network: Network,
  code: Code2, software: Code2, program: Code2, terminal: Code2,
  database: Database, storage: HardDrive, disk: HardDrive, memory: MemoryStick, ram: MemoryStick,
  server: Server, cloud: Cloud, settings: Settings, config: Settings, gear: Cog, system: Cog,
  speed: Gauge, performance: Gauge, gauge: Gauge, clock: Clock, time: Clock,
  idea: Lightbulb, concept: Lightbulb, tip: Lightbulb, insight: Lightbulb,
  brain: Brain, ai: Brain, intelligence: Brain, learn: GraduationCap, study: GraduationCap,
  book: BookOpen, definition: BookOpen, theory: BookOpen,
  science: Beaker, chemistry: Beaker, experiment: Beaker, atom: Atom, physics: Atom,
  math: Calculator, calculation: Calculator, formula: Sigma, sum: Sigma, sigma: Sigma,
  ruler: Ruler, measure: Ruler, geometry: Triangle, triangle: Triangle, compass: Compass,
  layers: Layers, stack: Layers, components: Boxes, parts: Boxes, box: Box, module: Box,
  workflow: Workflow, process: Workflow, flow: GitBranch, branch: GitBranch, pipeline: GitBranch,
  link: LinkIcon, connection: LinkIcon, puzzle: Puzzle, integration: Puzzle,
  check: CheckCircle2, done: CheckCircle2, success: CheckCircle2, advantage: CheckCircle2,
  warning: AlertTriangle, caution: AlertTriangle, risk: AlertTriangle, danger: AlertTriangle,
  info: Info, note: Info, star: Star, key: Key, important: Key, lock: Lock, security: Shield,
  shield: Shield, target: Target, goal: Target, trend: TrendingUp, growth: TrendingUp,
  chart: BarChart3, stats: BarChart3, data: BarChart3,
  microscope: Microscope, medical: Stethoscope, health: Heart, heart: Heart, drug: Pill,
  pill: Pill, dna: Dna, gene: Dna, temperature: Thermometer, eye: Eye, vision: Eye,
  globe: Globe, world: Globe, map: MapIcon, water: Droplet, fluid: Droplet, fire: Flame,
  heat: Flame, magnet: Magnet, wave: Waves, frequency: Waves, tool: Wrench, build: Wrench,
  motor: Settings, sensor: Activity, activity: Activity, rocket: Rocket, launch: Rocket,
};

export function pickIcon(name?: string): LucideIcon {
  if (!name) return Circle;
  const key = name.toLowerCase().trim();
  if (MAP[key]) return MAP[key];
  // try keyword contains
  for (const k of Object.keys(MAP)) {
    if (key.includes(k)) return MAP[k];
  }
  return Circle;
}

export function SlideIcon({ name, size = 22 }: { name?: string; size?: number }): React.ReactElement {
  const Ico = pickIcon(name);
  return <Ico size={size} strokeWidth={2.4} />;
}
