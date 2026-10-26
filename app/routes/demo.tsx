import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
  ReactCompareSliderHandle,
} from "react-compare-slider";
import { ArrowLeft, ArrowRight, Box, Download, Sparkles } from "lucide-react";
import { Button } from "../../components/ui/Button";
import gsap from "gsap";

export function meta() {
  return [
    { title: "Roomify | Watch Demo - 2D to 3D Floor Plan" },
    {
      name: "description",
      content:
        "Drag the slider to compare the 2D architectural blueprint with the AI-rendered 3D floor plan.",
    },
  ];
}

export default function DemoPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".demo-header", {
        opacity: 0,
        y: 20,
        duration: 0.7,
        ease: "power3.out",
      });

      gsap.from(".demo-slider-container", {
        opacity: 0,
        y: 30,
        scale: 0.98,
        duration: 0.8,
        delay: 0.15,
        ease: "power3.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = "/demo-assets/floorplan-3d.jpg";
    a.download = "roomify-demo-3d-floorplan.jpg";
    a.click();
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#fdfbf7] text-[#1a1a1a] flex flex-col justify-between selection:bg-orange-100"
    >
      {/* Top Navbar */}
      <header className="w-full border-b border-black/5 bg-[#fdfbf7]/90 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-zinc-600 hover:text-black transition-colors px-3 py-1.5 rounded-lg hover:bg-black/5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="h-4 w-px bg-zinc-200" />

            <div
              onClick={() => navigate("/")}
              className="flex items-center space-x-2 cursor-pointer select-none"
            >
              <Box className="w-5 h-5 text-black" />
              <span className="font-serif font-bold text-lg text-black tracking-tight">
                Roomify
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate("/#upload")}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#f97316] text-white hover:bg-[#ea580c] text-xs font-mono uppercase tracking-wider font-bold transition-colors shadow-xs cursor-pointer"
          >
            <span>Upload Your Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl w-full mx-auto px-6 py-10 flex-1 flex flex-col items-center">
        {/* Clean Header */}
        <div className="demo-header text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-zinc-200 text-zinc-600 text-[11px] font-mono uppercase tracking-widest font-semibold mb-4 shadow-2xs">
            <Sparkles className="w-3 h-3 text-orange-500" />
            <span>Interactive Floor Plan Demo</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-serif text-black tracking-tight mb-3">
            2D Blueprint to 3D Floor Plan
          </h1>

          <p className="text-xs sm:text-sm font-mono text-zinc-500 uppercase tracking-wider leading-relaxed">
            Drag the center divider to compare the original 2D architectural
            layout with the photorealistic 3D render.
          </p>
        </div>

        {/* Comparison Slider */}
        <div className="demo-slider-container w-full relative">
          <div className="relative rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200/90 shadow-2xl">
            {/* Corner Badges (Overlaid with pointer-events-none) */}
            <div className="absolute top-4 left-4 z-20 pointer-events-none bg-white/90 backdrop-blur-md px-3 py-1 rounded-md border border-zinc-200 text-[11px] font-mono uppercase tracking-wider font-bold text-zinc-800 shadow-xs">
              2D Blueprint
            </div>

            <div className="absolute top-4 right-4 z-20 pointer-events-none bg-white/90 backdrop-blur-md px-3 py-1 rounded-md border border-orange-200 text-[11px] font-mono uppercase tracking-wider font-bold text-orange-600 shadow-xs flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>3D Spatial Render</span>
            </div>

            {/* Pure ReactCompareSlider */}
            <ReactCompareSlider
              defaultPosition={50}
              itemOne={
                <ReactCompareSliderImage
                  src="/demo-assets/floorplan-2d.jpg"
                  alt="2D Architectural Blueprint"
                />
              }
              itemTwo={
                <ReactCompareSliderImage
                  src="/demo-assets/floorplan-3d-canvas.jpg"
                  alt="3D Photorealistic Render"
                />
              }
              handle={
                <ReactCompareSliderHandle
                  buttonStyle={{
                    backdropFilter: "blur(8px)",
                    background: "rgba(255, 255, 255, 0.95)",
                    border: "2px solid #f97316",
                    boxShadow: "0 0 14px rgba(249, 115, 22, 0.35)",
                    color: "#f97316",
                    width: "42px",
                    height: "42px",
                  }}
                  linesStyle={{
                    width: "2px",
                    backgroundColor: "#f97316",
                  }}
                />
              }
              style={{ width: "100%", height: "auto" }}
            />
          </div>

          {/* Simple bottom actions */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-zinc-500">
            <span className="text-zinc-400">
              Tip: Click and drag anywhere across the divider.
            </span>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="text-xs font-mono cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download 3D Image
              </Button>

              <button
                onClick={() => navigate("/#upload")}
                className="inline-flex items-center text-xs font-mono font-bold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer"
              >
                <span>Try with your own floor plan</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-black/5 py-6 px-6 text-center text-xs font-mono text-zinc-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Roomify — AI Architectural Visualization</span>
          <span>Residence Demo Showcase</span>
        </div>
      </footer>
    </div>
  );
}
