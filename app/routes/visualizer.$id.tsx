import React, { useEffect, useRef, useState } from "react";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router";
import { generate3DView } from "../../lib/ai.action";
import {
  Box,
  Download,
  RefreshCcw,
  Share,
  X,
  AlertCircle,
  Split,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { createProject, getProjectById } from "../../lib/puter.action";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
  ReactCompareSliderHandle,
} from "react-compare-slider";
import gsap from "gsap";

const VisualizerId = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useOutletContext<AuthContext>();
  const hasInitialGenerated = useRef(false);

  const [project, setProject] = useState<DesignItem | null>(null);
  const [isProjectLoading, setIsProjectLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleBack = () => navigate("/");

  // GSAP entrance animation for visualizer panels
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.from(".topbar", {
        opacity: 0,
        y: -20,
        duration: 0.6,
        ease: "power2.out",
      });

      gsap.from(".visualizer-panel", {
        opacity: 0,
        y: 30,
        stagger: 0.15,
        duration: 0.8,
        ease: "power3.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const runGeneration = async (item: DesignItem) => {
    if (!id || !item.sourceImage) return;

    try {
      setIsProcessing(true);
      setError(null);
      const result = await generate3DView({ sourceImage: item.sourceImage });

      if (result.renderedImage) {
        setCurrentImage(result.renderedImage);
        const updatedItem = {
          ...item,
          renderedImage: result.renderedImage,
          renderedPath: result.renderedPath,
          timestamp: Date.now(),
          ownerId: item.ownerId ?? userId ?? null,
          isPublic: item.isPublic ?? false,
        };

        const saved = await createProject({
          item: updatedItem,
          visibility: "private",
        });

        if (saved) {
          setProject(saved);
          setCurrentImage(saved.renderedImage || result.renderedImage);
        }
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
    a.download = `${project?.name || "roomify-render"}-3d.png`;
    a.click();
  };

  useEffect(() => {
    let isMounted = true;

    const loadProject = async () => {
      if (!id) {
        setIsProjectLoading(false);
        return;
      }

      setIsProjectLoading(true);

      const fetchedProject = await getProjectById({ id });

      if (!isMounted) return;

      if (fetchedProject) {
        setProject(fetchedProject);
        setCurrentImage(fetchedProject?.renderedImage || null);
      } else if (location.state?.initialImage) {
        setProject({
          id,
          name: location.state.name || `Residence ${id}`,
          sourceImage: location.state.initialImage,
          renderedImage: location.state.initialRendered || undefined,
          timestamp: Date.now(),
        });
        setCurrentImage(location.state.initialRendered || null);
      }

      setIsProjectLoading(false);
      hasInitialGenerated.current = false;
    };

    loadProject();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (
      isProjectLoading ||
      hasInitialGenerated.current ||
      !project?.sourceImage
    )
      return;

    if (project.renderedImage) {
      setCurrentImage(project.renderedImage);
      hasInitialGenerated.current = true;
      return;
    }

    hasInitialGenerated.current = true;
    void runGeneration(project);
  }, [project, isProjectLoading]);

  return (
    <div ref={containerRef} className="visualizer">
      <nav className="topbar">
        <div className="brand" onClick={handleBack}>
          <Box className="logo" />
          <span className="name">Roomify</span>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/demo")}
            className="text-xs font-mono uppercase tracking-wider cursor-pointer"
          >
            <Split className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
            Watch Demo
          </Button>
          <Button variant="ghost" size="sm" onClick={handleBack} className="exit cursor-pointer">
            <X className="icon" /> Exit Editor
          </Button>
        </div>
      </nav>

      <section className="content">
        <div className="panel visualizer-panel">
          <div className="panel-header">
            <div className="panel-meta">
              <p>Project</p>
              <h2>{project?.name || `Residence ${id}`}</h2>
              <p className="note">Created by You</p>
            </div>
            <div className="panel-actions">
              <Button
                size="sm"
                variant="outline"
                onClick={() => project && runGeneration(project)}
                disabled={isProcessing || !project?.sourceImage}
                className="regenerate cursor-pointer"
              >
                <RefreshCcw
                  className={`w-4 h-4 mr-2 ${isProcessing ? "animate-spin" : ""}`}
                />
                {currentImage ? "Re-render" : "Generate 3D"}
              </Button>
              <Button
                size="sm"
                onClick={handleExport}
                className="export cursor-pointer"
                disabled={!currentImage}
              >
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
              <Button size="sm" onClick={() => {}} className="share cursor-pointer">
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
                onClick={() => project && runGeneration(project)}
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
                {project?.sourceImage && (
                  <img
                    src={project?.sourceImage}
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

        <div className="panel compare visualizer-panel">
          <div className="panel-header">
            <div className="panel-meta">
              <p>Comparison</p>
              <h3>Before and After</h3>
            </div>
            <div className="hint text-xs font-mono text-zinc-400">Drag to compare</div>
          </div>
          <div className="compare-stage">
            {project?.sourceImage && currentImage ? (
              <ReactCompareSlider
                defaultPosition={50}
                style={{ width: "100%", height: "auto" }}
                itemOne={
                  <ReactCompareSliderImage
                    src={project?.sourceImage}
                    alt="before"
                    className="compare-img"
                  />
                }
                itemTwo={
                  <ReactCompareSliderImage
                    src={currentImage || project?.renderedImage || undefined}
                    alt="after"
                    className="compare-img"
                  />
                }
                handle={
                  <ReactCompareSliderHandle
                    buttonStyle={{
                      backdropFilter: "blur(6px)",
                      background: "rgba(255, 255, 255, 0.95)",
                      border: "2px solid #f97316",
                      boxShadow: "0 0 14px rgba(249, 115, 22, 0.35)",
                      color: "#f97316",
                      width: "40px",
                      height: "40px",
                    }}
                    linesStyle={{
                      width: "2px",
                      backgroundColor: "#f97316",
                    }}
                  />
                }
              />
            ) : (
              <div className="compare-fallback">
                {project?.sourceImage && (
                  <img
                    src={project.sourceImage}
                    alt="Before"
                    className="compare-img"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default VisualizerId;
