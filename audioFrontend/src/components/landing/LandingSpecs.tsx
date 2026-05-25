"use client";

import React from "react";
import { Cpu, Server, Layers3, Radio } from "lucide-react";

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.80)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(0,0,0,0.07)",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.07)",
};

export function LandingSpecs() {
  return (
    <section id="specs" className="max-w-6xl mx-auto px-6 py-24 relative z-10"
      style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>

      <div className="text-center space-y-2 mb-16">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Technical Specifications</p>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900">Engineering Topology</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

        {/* Metrics table */}
        <div className="lg:col-span-5 rounded-[1.75rem] p-8" style={card}>
          <h3 className="text-lg font-black text-zinc-900 mb-6 tracking-tight">Metrics Comparison</h3>
          <div className="space-y-0 divide-y divide-black/5">
            {[
              { label: "Stream Latency", value: "Sub-100ms", highlight: true },
              { label: "Audio Format", value: "320kbps FLAC / AAC", highlight: false },
              { label: "Session Cache", value: "ioredis Memory", highlight: false },
              { label: "Database", value: "Neon PG Serverless", highlight: true },
              { label: "Delivery", value: "AWS S3 Edge CDN", highlight: false },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="flex justify-between items-center py-3.5">
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</span>
                <span className={`text-xs font-black uppercase tracking-wider ${highlight ? "text-primary" : "text-zinc-700"}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Architecture */}
        <div className="lg:col-span-7 rounded-[1.75rem] p-8 flex flex-col" style={card}>
          <h3 className="text-lg font-black text-zinc-900 tracking-tight mb-1">Architectural Blueprint</h3>
          <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
            How media and tokens travel across our hybrid edge serverless stack.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-auto">
            {[
              { Icon: Cpu, title: "Transcode", sub: "HLS Packaging" },
              { Icon: Server, title: "S3 Storage", sub: "AWS Edge" },
              { Icon: Layers3, title: "ioredis", sub: "Session Cache" },
              { Icon: Radio, title: "Hls.js", sub: "Decoded Live" },
            ].map(({ Icon, title, sub }) => (
              <div key={title} className="p-4 rounded-xl flex flex-col items-center gap-2.5 text-center"
                style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(120,240,142,0.12)", border: "1px solid rgba(120,240,142,0.2)" }}>
                  <Icon size={14} className="text-primary" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-zinc-800">{title}</h4>
                  <p className="text-[9px] text-zinc-400 uppercase tracking-wider mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
