import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router";
import { generate3DView } from "../../lib/ai.action";
import { Box, Download, RefreshCcw, Share, X, AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { createProject, getProjectById } from "../../lib/puter.action";

const VisualizerId = () => {
    const { id } = useParams()
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useOutletContext<AuthContext>()
  const hasInitialGenerated = useRef(false);

  const [project, setProject] = useState<DesignItem | null>(null)
  const [isProjectLoading, setIsProjectLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  const handleBack = () => navigate("/");

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
        }

        const saved = await createProject({ item: updatedItem, visibility: "private" })

        if(saved){
            setProject(saved)
            setCurrentImage(saved.renderedImage || result.renderedImage)
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
              <h2>{project?.name || `Residence ${id}`}</h2>
              <p className="note">Created by You</p>
            </div>
            <div className="panel-actions">
              <Button
                size="sm"
                variant="outline"
                onClick={() => project && runGeneration(project)}
                disabled={isProcessing || !project?.sourceImage}
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
      </section>
    </div>
  );
};

export default VisualizerId;
