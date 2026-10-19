"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Member, Family } from "@/types";
import {
  Crown,
  Heart,
  Baby,
  User,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Crosshair,
  Sparkles,
  Layers,
  ChevronDown,
  Info,
  Sliders,
} from "lucide-react";

interface FamilyTreeCanvasProps {
  family: Family;
  members: Member[];
  selectedMemberId: string | null;
  onSelectMember: (member: Member) => void;
}

interface NodePosition {
  member: Member;
  x: number;
  y: number;
  width: number;
  height: number;
  tier: number;
  isHead: boolean;
}

const NODE_WIDTH = 224;
const NODE_HEIGHT = 104;

export function FamilyTreeCanvas({
  family,
  members,
  selectedMemberId,
  onSelectMember,
}: FamilyTreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastTouchDist, setLastTouchDist] = useState<number | null>(null);
  const [showLegend, setShowLegend] = useState(false);

  // Group members into genealogical generational tiers
  const headMember =
    members.find(
      (m) => m.relationshipToHead === "head" || m.id === family.headOfFamilyId
    ) || members[0];

  const spouses = members.filter(
    (m) => m.relationshipToHead === "spouse" && m.id !== headMember?.id
  );
  const parents = members.filter(
    (m) => m.relationshipToHead === "parent" && m.id !== headMember?.id
  );
  const siblings = members.filter(
    (m) => m.relationshipToHead === "sibling" && m.id !== headMember?.id
  );
  const children = members.filter(
    (m) => m.relationshipToHead === "child" && m.id !== headMember?.id
  );
  const relatives = members.filter(
    (m) =>
      !["head", "spouse", "parent", "sibling", "child"].includes(
        m.relationshipToHead || "other"
      ) && m.id !== headMember?.id
  );

  // Canvas dimensions based on family density
  const maxTierCount = Math.max(
    parents.length,
    spouses.length + 1 + siblings.length,
    children.length,
    relatives.length,
    3
  );
  const canvasWidth = Math.max(1400, maxTierCount * (NODE_WIDTH + 60) + 300);
  const canvasHeight = 920;
  const centerX = canvasWidth / 2;

  // Compute node positions
  const nodePositions: NodePosition[] = [];

  // Tier Y definitions
  const Y_PARENTS = 70;
  const Y_CORE = 280;
  const Y_CHILDREN = 510;
  const Y_RELATIVES = 730;

  // 1. Generation 1: Head & Spouses & Siblings (Y_CORE)
  let headX = centerX - NODE_WIDTH / 2;
  if (spouses.length > 0) {
    headX = centerX - NODE_WIDTH - 40;
  }

  if (headMember) {
    nodePositions.push({
      member: headMember,
      x: headX,
      y: Y_CORE,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      tier: 1,
      isHead: true,
    });
  }

  // Spouses to the right of Head
  spouses.forEach((spouse, idx) => {
    const spouseX = centerX + 40 + idx * (NODE_WIDTH + 40);
    nodePositions.push({
      member: spouse,
      x: spouseX,
      y: Y_CORE,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      tier: 1,
      isHead: false,
    });
  });

  // Siblings to the left of Head
  if (siblings.length > 0) {
    const totalSibWidth = siblings.length * (NODE_WIDTH + 40) - 40;
    const startSibX = headX - totalSibWidth - 60;
    siblings.forEach((sib, idx) => {
      nodePositions.push({
        member: sib,
        x: startSibX + idx * (NODE_WIDTH + 40),
        y: Y_CORE,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        tier: 1,
        isHead: false,
      });
    });
  }

  // 2. Generation 0: Parents (Y_PARENTS)
  if (parents.length > 0) {
    const totalParentsWidth = parents.length * (NODE_WIDTH + 40) - 40;
    const parentsStartX = (headX + NODE_WIDTH / 2) - totalParentsWidth / 2;
    parents.forEach((parent, idx) => {
      nodePositions.push({
        member: parent,
        x: parentsStartX + idx * (NODE_WIDTH + 40),
        y: Y_PARENTS,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        tier: 0,
        isHead: false,
      });
    });
  }

  // 3. Generation 2: Children (Y_CHILDREN)
  if (children.length > 0) {
    const totalChildrenWidth = children.length * (NODE_WIDTH + 40) - 40;
    const childrenStartX = centerX - totalChildrenWidth / 2;
    children.forEach((child, idx) => {
      nodePositions.push({
        member: child,
        x: childrenStartX + idx * (NODE_WIDTH + 40),
        y: Y_CHILDREN,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        tier: 2,
        isHead: false,
      });
    });
  }

  // 4. Generation 3: Extended Relatives (Y_RELATIVES)
  if (relatives.length > 0) {
    const totalRelWidth = relatives.length * (NODE_WIDTH + 40) - 40;
    const relStartX = centerX - totalRelWidth / 2;
    relatives.forEach((rel, idx) => {
      nodePositions.push({
        member: rel,
        x: relStartX + idx * (NODE_WIDTH + 40),
        y: Y_RELATIVES,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        tier: 3,
        isHead: false,
      });
    });
  }

  // Center view on mount or reset
  const handleRecenter = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const targetScale = Math.min(
      (container.clientWidth - 80) / Math.min(canvasWidth, 1200),
      1
    );
    const clampedScale = Math.max(0.65, Math.min(targetScale, 1));
    const initX = (container.clientWidth - canvasWidth * clampedScale) / 2;
    const initY = (container.clientHeight - canvasHeight * clampedScale) / 2 + 20;

    setScale(clampedScale);
    setPan({ x: initX, y: initY });
  }, [canvasWidth, canvasHeight]);

  const handleFocusHead = useCallback(() => {
    if (!containerRef.current || !headMember) return;
    const container = containerRef.current;
    const headPos = nodePositions.find((n) => n.member.id === headMember.id);
    if (!headPos) return;

    const targetScale = 1;
    const targetX = container.clientWidth / 2 - (headPos.x + headPos.width / 2) * targetScale;
    const targetY = container.clientHeight / 2 - (headPos.y + headPos.height / 2) * targetScale;

    setScale(targetScale);
    setPan({ x: targetX, y: targetY });
  }, [headMember, nodePositions]);

  // Initial center on mount
  useEffect(() => {
    handleRecenter();
  }, [handleRecenter]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with primary mouse button
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.4, Math.min(scale * zoomFactor, 2.2));

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom centered at mouse position
    const newPanX = mouseX - ((mouseX - pan.x) / scale) * newScale;
    const newPanY = mouseY - ((mouseY - pan.y) / scale) * newScale;

    setScale(newScale);
    setPan({ x: newPanX, y: newPanY });
  };

  // Touch gesture handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setLastTouchDist(dist);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && lastTouchDist !== null) {
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = newDist / lastTouchDist;
      const newScale = Math.max(0.4, Math.min(scale * ratio, 2.2));
      setScale(newScale);
      setLastTouchDist(newDist);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setLastTouchDist(null);
  };

  // Helper to calculate age from DOB
  const calculateAge = (dobString?: string) => {
    if (!dobString) return null;
    try {
      const dob = new Date(dobString);
      const diffMs = Date.now() - dob.getTime();
      const ageDate = new Date(diffMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    } catch {
      return null;
    }
  };

  // Render SVG Connector Paths
  const renderConnectors = () => {
    const paths = [];

    // 1. Spousal Matrimonial Link
    if (spouses.length > 0 && headMember) {
      const headPos = nodePositions.find((n) => n.member.id === headMember.id);
      const firstSpousePos = nodePositions.find((n) => n.member.id === spouses[0].id);

      if (headPos && firstSpousePos) {
        const startX = headPos.x + headPos.width;
        const endX = firstSpousePos.x;
        const bridgeY = headPos.y + headPos.height / 2;

        paths.push(
          <g key="spouse-bridge">
            {/* Matrimonial Connection Line */}
            <path
              d={`M ${startX} ${bridgeY} L ${endX} ${bridgeY}`}
              stroke="#f43f5e"
              strokeWidth="2.5"
              strokeDasharray="4 3"
              fill="none"
              className="opacity-80"
            />
            {/* Wedding rings or heart symbol at midpoint */}
            <circle
              cx={centerX}
              cy={bridgeY}
              r="13"
              fill="white"
              stroke="#f43f5e"
              strokeWidth="2"
              className="dark:fill-zinc-900"
            />
            <text
              x={centerX}
              y={bridgeY + 4}
              textAnchor="middle"
              fontSize="12"
              fill="#f43f5e"
              fontWeight="bold"
            >
              ♥
            </text>
          </g>
        );
      }
    }

    // 2. Parents to Head connector
    if (parents.length > 0 && headMember) {
      const headPos = nodePositions.find((n) => n.member.id === headMember.id);
      const parentNodes = nodePositions.filter((n) => n.tier === 0);

      if (headPos && parentNodes.length > 0) {
        if (parentNodes.length === 1) {
          const p = parentNodes[0];
          const startX = p.x + p.width / 2;
          const startY = p.y + p.height;
          const targetX = headPos.x + headPos.width / 2;
          const targetY = headPos.y;

          paths.push(
            <path
              key="parent-single-path"
              d={`M ${startX} ${startY} C ${startX} ${startY + 40}, ${targetX} ${targetY - 40}, ${targetX} ${targetY}`}
              stroke="#6366f1"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          );
        } else {
          // Multiple parents: horizontal bar between them, then vertical trunk to Head
          const leftP = parentNodes[0];
          const rightP = parentNodes[parentNodes.length - 1];
          const barY = leftP.y + leftP.height + 25;
          const parentsMidX = (leftP.x + leftP.width / 2 + (rightP.x + rightP.width / 2)) / 2;

          // Connect each parent to horizontal bar
          parentNodes.forEach((p, idx) => {
            const px = p.x + p.width / 2;
            paths.push(
              <path
                key={`parent-drop-${idx}`}
                d={`M ${px} ${p.y + p.height} L ${px} ${barY}`}
                stroke="#6366f1"
                strokeWidth="2.5"
                fill="none"
              />
            );
          });

          // Horizontal bar
          paths.push(
            <path
              key="parents-h-bar"
              d={`M ${leftP.x + leftP.width / 2} ${barY} L ${rightP.x + rightP.width / 2} ${barY}`}
              stroke="#6366f1"
              strokeWidth="2.5"
              fill="none"
            />
          );

          // Trunk descending to Head
          const headXCenter = headPos.x + headPos.width / 2;
          paths.push(
            <path
              key="parents-trunk-to-head"
              d={`M ${parentsMidX} ${barY} C ${parentsMidX} ${barY + 30}, ${headXCenter} ${headPos.y - 30}, ${headXCenter} ${headPos.y}`}
              stroke="#6366f1"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          );
        }
      }
    }

    // 3. Children Offspring branch from Union
    if (children.length > 0) {
      const childNodes = nodePositions.filter((n) => n.tier === 2);
      const originX = spouses.length > 0 ? centerX : headX + NODE_WIDTH / 2;
      const originY = spouses.length > 0 ? Y_CORE + NODE_HEIGHT / 2 : Y_CORE + NODE_HEIGHT;
      const railY = 445;

      if (childNodes.length === 1) {
        const c = childNodes[0];
        const targetX = c.x + c.width / 2;
        paths.push(
          <path
            key="child-single-path"
            d={`M ${originX} ${originY} C ${originX} ${originY + 40}, ${targetX} ${c.y - 40}, ${targetX} ${c.y}`}
            stroke="#0ea5e9"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        );
      } else {
        // Vertical trunk dropping down to distribution rail
        paths.push(
          <path
            key="child-trunk"
            d={`M ${originX} ${originY} L ${originX} ${railY}`}
            stroke="#0ea5e9"
            strokeWidth="2.5"
            fill="none"
          />
        );

        // Horizontal distribution rail
        const firstChild = childNodes[0];
        const lastChild = childNodes[childNodes.length - 1];
        const minX = firstChild.x + firstChild.width / 2;
        const maxX = lastChild.x + lastChild.width / 2;

        paths.push(
          <path
            key="child-rail"
            d={`M ${minX} ${railY} L ${maxX} ${railY}`}
            stroke="#0ea5e9"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        );

        // Vertical drop from rail to each child node
        childNodes.forEach((c, idx) => {
          const cx = c.x + c.width / 2;
          paths.push(
            <path
              key={`child-drop-${idx}`}
              d={`M ${cx} ${railY} L ${cx} ${c.y}`}
              stroke="#0ea5e9"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          );
        });
      }
    }

    // 4. Siblings lateral connection
    if (siblings.length > 0 && headMember) {
      const headPos = nodePositions.find((n) => n.member.id === headMember.id);
      const sibNodes = nodePositions.filter(
        (n) => n.member.relationshipToHead === "sibling"
      );

      if (headPos && sibNodes.length > 0) {
        const branchY = headPos.y + headPos.height / 2;
        const rightmostSib = sibNodes[sibNodes.length - 1];
        const startX = rightmostSib.x + rightmostSib.width;
        const endX = headPos.x;

        paths.push(
          <path
            key="sibling-bridge"
            d={`M ${startX} ${branchY} L ${endX} ${branchY}`}
            stroke="#a855f7"
            strokeWidth="2"
            strokeDasharray="4 4"
            fill="none"
            className="opacity-70"
          />
        );
      }
    }

    // 5. Relatives extended branch
    if (relatives.length > 0) {
      const relNodes = nodePositions.filter((n) => n.tier === 3);
      const railY = 660;

      paths.push(
        <path
          key="relatives-trunk"
          d={`M ${centerX} ${510 + NODE_HEIGHT} L ${centerX} ${railY}`}
          stroke="#71717a"
          strokeWidth="2"
          strokeDasharray="4 4"
          fill="none"
          className="opacity-70"
        />
      );

      const firstRel = relNodes[0];
      const lastRel = relNodes[relNodes.length - 1];
      const minX = firstRel.x + firstRel.width / 2;
      const maxX = lastRel.x + lastRel.width / 2;

      paths.push(
        <path
          key="relatives-rail"
          d={`M ${minX} ${railY} L ${maxX} ${railY}`}
          stroke="#71717a"
          strokeWidth="2"
          strokeDasharray="4 4"
          fill="none"
          className="opacity-70"
        />
      );

      relNodes.forEach((r, idx) => {
        const rx = r.x + r.width / 2;
        paths.push(
          <path
            key={`rel-drop-${idx}`}
            d={`M ${rx} ${railY} L ${rx} ${r.y}`}
            stroke="#71717a"
            strokeWidth="2"
            strokeDasharray="4 4"
            fill="none"
            className="opacity-70"
          />
        );
      });
    }

    return paths;
  };

  return (
    <div className="relative w-full h-[700px] sm:h-[780px] bg-slate-950/5 dark:bg-zinc-950/80 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 overflow-hidden select-none">
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.35] dark:opacity-[0.18]"
        style={{
          backgroundImage: `radial-gradient(circle, #6366f1 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
          transform: `translate(${pan.x % 28}px, ${pan.y % 28}px)`,
        }}
      />

      {/* Interactive Canvas Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`w-full h-full relative cursor-grab active:cursor-grabbing touch-none overflow-hidden`}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            width: canvasWidth,
            height: canvasHeight,
          }}
          className="absolute top-0 left-0 transition-transform duration-75 ease-out"
        >
          {/* SVG Connector Layer */}
          <svg
            width={canvasWidth}
            height={canvasHeight}
            className="absolute inset-0 pointer-events-none overflow-visible z-0"
          >
            {renderConnectors()}
          </svg>

          {/* Member Interactive Nodes */}
          {nodePositions.map((pos) => {
            const member = pos.member;
            const isSelected = selectedMemberId === member.id;
            const isHead = pos.isHead;
            const age = calculateAge(member.dateOfBirth);

            // Rel badge colors
            const getTagStyle = () => {
              if (isHead) {
                return "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-400/40";
              }
              switch (member.relationshipToHead) {
                case "spouse":
                  return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/40";
                case "child":
                  return "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-400/40";
                case "parent":
                  return "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-400/40";
                case "sibling":
                  return "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-400/40";
                default:
                  return "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-400/40";
              }
            };

            return (
              <div
                key={member.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMember(member);
                }}
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                  width: pos.width,
                  height: pos.height,
                }}
                className={`absolute z-10 p-3 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-xl hover:-translate-y-1 ${
                  isHead
                    ? "border-amber-400 ring-2 ring-amber-400/40 dark:ring-amber-500/30 shadow-amber-500/10"
                    : isSelected
                    ? "border-indigo-600 ring-4 ring-indigo-500/30 dark:border-indigo-400"
                    : "border-zinc-200/90 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                }`}
              >
                {/* Crown badge for Head of Family */}
                {isHead && (
                  <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Head of Family
                  </div>
                )}

                <div className="flex items-center gap-3 h-full">
                  {/* Avatar */}
                  <div className="relative shrink-0 w-14 h-14">
                    <div
                      className={`w-full h-full rounded-xl overflow-hidden border ${
                        isHead
                          ? "border-amber-400 ring-2 ring-amber-400/20"
                          : "border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                          {member.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)}
                        </div>
                      )}
                    </div>

                    {/* Status dot */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-900 ${
                        member.status === "active"
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {member.fullName}
                    </h4>

                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border capitalize inline-flex items-center gap-1 ${getTagStyle()}`}
                      >
                        {member.relationshipToHead || "Member"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                      {age !== null && <span>Age {age}</span>}
                      {member.gender && (
                        <span className="capitalize">
                          {member.gender === "male"
                            ? "Male"
                            : member.gender === "female"
                            ? "Female"
                            : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating HUD Controls Toolbar */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl">
        <button
          onClick={() => setScale((s) => Math.min(s * 1.2, 2.2))}
          title="Zoom In"
          aria-label="Zoom in"
          className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        <button
          onClick={() => setScale((s) => Math.max(s / 1.2, 0.4))}
          title="Zoom Out"
          aria-label="Zoom out"
          className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ZoomOut className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

        <button
          onClick={() => {
            setScale(1);
            setPan({
              x: (containerRef.current?.clientWidth || 800) / 2 - centerX,
              y: 50,
            });
          }}
          title="Reset Zoom to 100%"
          aria-label="Reset zoom"
          className="px-2.5 py-1 text-xs font-semibold rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          {Math.round(scale * 100)}%
        </button>

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

        <button
          onClick={handleFocusHead}
          title="Center on Head of Family"
          aria-label="Center on Head"
          className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1 text-xs"
        >
          <Crown className="h-4 w-4 text-amber-500" />
        </button>

        <button
          onClick={handleRecenter}
          title="Fit Family Tree to View"
          aria-label="Fit View"
          className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Crosshair className="h-4 w-4" />
        </button>

        <button
          onClick={() => setShowLegend((v) => !v)}
          title="Toggle Legend"
          aria-label="Toggle Legend"
          className={`p-2 rounded-xl transition-colors ${
            showLegend
              ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600"
              : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

      {/* Floating Canvas Hint / Info */}
      <div className="absolute top-4 left-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-500 shadow-sm">
        <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
        <span>Click any node for member profile & edit options • Drag & scroll to pan/zoom</span>
      </div>

      {/* Collapsible Legend Drawer */}
      {showLegend && (
        <div className="absolute top-14 left-4 z-20 p-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl max-w-xs space-y-2.5 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-indigo-500" />
              Kinship Legend
            </span>
            <button
              onClick={() => setShowLegend(false)}
              className="text-zinc-400 hover:text-zinc-600 text-xs"
            >
              Close
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-400/30" />
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                Head of Family (Designated Representative)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400" />
              <span className="text-zinc-700 dark:text-zinc-300">
                Spouse (Matrimonial Union)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-400" />
              <span className="text-zinc-700 dark:text-zinc-300">
                Parents / Elders (Tier I)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-400" />
              <span className="text-zinc-700 dark:text-zinc-300">
                Children / Offspring (Tier III)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-400" />
              <span className="text-zinc-700 dark:text-zinc-300">
                Siblings & Extended Kin
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
