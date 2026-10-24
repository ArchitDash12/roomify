import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { generate3DView } from "../../lib/ai.action";
import { Box, Download, RefreshCcw, Share, X, AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";

const VisualizerId = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { initialImage, initialRender, initialRendered, name } =
    location.state || {};   
  const startingRender = initialRender || initialRendered || null;
  const hasInitialGenerated = useRef(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(
    startingRender,
  );

  const handleBack = () => navigate("/");

  const runGeneration = async () => {
    if (!initialImage) return;

    try {
      setIsProcessing(true);
      setError(null);
      const result = await generate3DView({ sourceImage: initialImage });

      if (result.renderedImage) {
        setCurrentImage(result.renderedImage);
      } else {
        throw new Error("No rendered image was returned by the AI model.");
      }
    } catch (e: any) {
      console.error("Generation failed: ", e);
      const message =
        e?.message ||
        (typeof e === "string" ? e : "3D generation failed. Please try again.");
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    if (!currentImage) return;
    const a = document.createElement("a");
    a.href = currentImage;
    a.download = `${name || "roomify-render"}-3d.png`;
    a.click();
  };

  useEffect(() => {
    if (!initialImage || hasInitialGenerated.current) return;

    if (startingRender) {
      setCurrentImage(startingRender);
      hasInitialGenerated.current = true;
      return;
    }

    hasInitialGenerated.current = true;
    runGeneration();
  }, [initialImage, startingRender]);

  return (
    <div className="visualizer">
      <nav className="topbar">
        <div className="brand">
          <Box className="logo" />
          <span className="name">Roomify</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleBack} className="exit">
          <X className="icon" /> Exit Editor
        </Button>
      </nav>
      <section className="content">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-meta">
              <p>Project</p>
              <h2>{name || "Untitled Project"}</h2>
              <p className="note">Created by You</p>
            </div>
            <div className="panel-actions">
              <Button
                size="sm"
                variant="outline"
                onClick={runGeneration}
                disabled={isProcessing || !initialImage}
                className="regenerate"
              >
                <RefreshCcw
                  className={`w-4 h-4 mr-2 ${isProcessing ? "animate-spin" : ""}`}
                />
                {currentImage ? "Re-render" : "Generate 3D"}
              </Button>
              <Button
                size="sm"
                onClick={handleExport}
                className="export"
                disabled={!currentImage}
              >
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
              <Button size="sm" onClick={() => {}} className="share">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start justify-between text-red-700 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="ml-4 shrink-0 text-xs text-red-700 border-red-300 hover:bg-red-100"
                onClick={runGeneration}
                disabled={isProcessing}
              >
                Retry
              </Button>
            </div>
          )}

          <div className={`render-area ${isProcessing ? "is-processing" : ""}`}>
            {currentImage ? (
              <img src={currentImage} alt="AI Render" className="render-img" />
            ) : (
              <div className="render-placeholder">
                {initialImage && (
                  <img
                    src={initialImage}
                    alt="Original Floor Plan"
                    className="render-fallback"
                  />
                )}
              </div>
            )}
            {isProcessing && (
              <div className="render-overlay">
                <div className="rendering-card">
                  <RefreshCcw className="spinner" />
                  <span className="title">Rendering...</span>
                  <span className="subtitle">
                    Generating your 3D visualization
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default VisualizerId;
