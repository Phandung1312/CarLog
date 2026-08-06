import { componentIds, knowledgeNodeIds } from "../domain/ids";
import type { ComponentId, KnowledgeNodeId } from "../domain/ids";
import type { LogRecord, LogSeverity, NormalizedCarEvent, VisualizationEventKind, VisualizationSession } from "../domain/visualization";

const tagMap: Array<[RegExp, ComponentId[], KnowledgeNodeId[], VisualizationEventKind]> = [
  [/vhal|ivehicle|carproperty/i, ["vhal", "ivi-compute"], ["node:ivh", "node:car-property-service"], "property-change"],
  [/can|ethernet|gateway/i, ["can-bus", "gateway-ecu"], ["node:can", "node:gateway"], "network-frame"],
  [/audio|media|focus/i, ["audio-amp", "ivi-compute"], ["node:car-audio-service", "node:media-session"], "audio-focus"],
  [/display|systemui|cluster/i, ["cluster", "ivi-display"], ["node:systemui", "node:display-manager"], "display-update"],
  [/user|caruser|userhal/i, ["ivi-compute", "vhal"], ["node:car-user-manager", "node:user-hal"], "user-lifecycle"],
  [/power|suspend|shutdown|garage/i, ["ivi-compute", "traction-battery"], ["node:car-power", "node:power-policy"], "power-transition"],
];

function severity(value: unknown): LogSeverity {
  const text = String(value ?? "").toLowerCase();
  return (({ v: "verbose", d: "debug", i: "info", w: "warn", e: "error", f: "fatal" } as Record<string, LogSeverity>)[text] ?? (text as LogSeverity)) || "unknown";
}

function timestamp(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return undefined;
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) return parsed;
  const match = value.match(/(\d{2}):(\d{2}):(\d{2})[.:](\d{3,6})/);
  if (!match) return undefined;
  return ((Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])) * 1000) + Number(match[4].slice(0, 3));
}

function fromObject(value: Record<string, unknown>, sourceId: `source:${string}`, index: number): LogRecord {
  const message = String(value.message ?? value.msg ?? value.text ?? "");
  return { id: `${sourceId}:${index}`, sourceId, rawLine: JSON.stringify(value), timestamp: timestamp(value.timestamp ?? value.time ?? value.ts), severity: severity(value.level ?? value.priority ?? value.severity), tag: value.tag ? String(value.tag) : undefined, pid: Number.isFinite(Number(value.pid)) ? Number(value.pid) : undefined, tid: Number.isFinite(Number(value.tid)) ? Number(value.tid) : undefined, uid: Number.isFinite(Number(value.uid)) ? Number(value.uid) : undefined, process: value.process ? String(value.process) : undefined, message, parserConfidence: message ? "high" : "low" };
}

function parseLine(line: string, sourceId: `source:${string}`, index: number): LogRecord {
  const threadtime = line.match(/^(\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}\.\d{3})\s+(\d+)\s+(\d+)\s+([VDIWEF])\s+([^:]+):\s?(.*)$/);
  if (threadtime) return { id: `${sourceId}:${index}`, sourceId, rawLine: line, timestamp: timestamp(threadtime[2]), severity: severity(threadtime[5]), pid: Number(threadtime[3]), tid: Number(threadtime[4]), tag: threadtime[6].trim(), message: threadtime[7], parserConfidence: "high" };
  const brief = line.match(/^([VDIWEF])\/([^\s(]+)\(\s*(\d+)\):\s?(.*)$/);
  if (brief) return { id: `${sourceId}:${index}`, sourceId, rawLine: line, severity: severity(brief[1]), tag: brief[2], pid: Number(brief[3]), message: brief[4], parserConfidence: "medium" };
  return { id: `${sourceId}:${index}`, sourceId, rawLine: line, severity: "unknown", message: line, parserConfidence: "low" };
}

export function normalizeRecord(record: LogRecord): NormalizedCarEvent {
  const text = `${record.tag ?? ""} ${record.message}`;
  const match = tagMap.find(([pattern]) => pattern.test(text));
  const componentIdsForEvent: ComponentId[] = match?.[1] ?? ["ivi-compute"];
  const nodeIds: KnowledgeNodeId[] = match?.[2] ?? [];
  const kind: VisualizationEventKind = match?.[3] ?? "log-line";
  const stateMutations: Record<string, string | number | boolean> = {};
  if (kind === "property-change") stateMutations["lastProperty"] = record.message;
  if (kind === "power-transition") stateMutations.power = record.message;
  if (kind === "display-update") stateMutations.displays = record.message;
  if (kind === "audio-focus") stateMutations.audio = record.message;
  return { id: `event:${record.id}`, recordId: record.id, kind, timestamp: record.timestamp, summary: record.message || "Unparsed log record", componentIds: componentIdsForEvent.filter((id) => componentIds.includes(id)), knowledgeNodeIds: nodeIds.filter((id) => knowledgeNodeIds.includes(id)), stateMutations, evidence: [record.rawLine], explanation: { text: match ? `Mapped from ${record.tag ?? "Android log"} using the curated CarLog ruleset.` : "No mapping rule matched this record; it remains visible as raw evidence.", confidence: match ? "correlated" : "unknown", recordIds: [record.id] } };
}

export function parseCarLog(input: string, name = "Imported log"): VisualizationSession {
  const sourceId = `source:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "session"}` as `source:${string}`;
  const warnings: string[] = [];
  let records: LogRecord[] = [];
  const trimmed = input.trim();
  if (!trimmed) warnings.push("The imported file is empty.");
  else if (trimmed.startsWith("[")) {
    try { const parsed = JSON.parse(trimmed); if (!Array.isArray(parsed)) throw new Error("Expected an array"); records = parsed.map((item, index) => fromObject(item as Record<string, unknown>, sourceId, index)); }
    catch { warnings.push("JSON import could not be parsed; falling back to text lines."); records = input.split(/\r?\n/).filter(Boolean).map((line, index) => parseLine(line, sourceId, index)); }
  } else if (trimmed.startsWith("{")) {
    input.split(/\r?\n/).filter(Boolean).forEach((line, index) => { try { records.push(fromObject(JSON.parse(line) as Record<string, unknown>, sourceId, index)); } catch { warnings.push(`Line ${index + 1}: invalid JSON retained as raw text.`); records.push(parseLine(line, sourceId, index)); } });
  } else records = input.split(/\r?\n/).filter((line) => line.trim()).map((line, index) => parseLine(line, sourceId, index));
  if (records.some((record) => record.parserConfidence === "low")) warnings.push(`${records.filter((record) => record.parserConfidence === "low").length} record(s) have low parser confidence.`);
  return { sourceId, name, records, events: records.map(normalizeRecord), warnings, parserVersion: "carlog-parser/1" };
}
