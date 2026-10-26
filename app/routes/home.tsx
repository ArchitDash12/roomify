import { ArrowRight, ArrowUpRight, Clock, Layers } from "lucide-react";
import Navbar from "../../components/Navbar";
import type { Route } from "./+types/home";
import { Button } from "../../components/ui/Button";
import Upload from "../../components/Upload";
import { useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { createProject, getProjects } from "../../lib/puter.action";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Roomify | AI Architectural Visualization" },
    {
      name: "description",
      content:
        "Roomify is an AI-first design environment that helps you visualize, render, and ship architectural projects faster than ever.",
    },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<DesignItem[]>([]);
  const isCreatingProjectRef = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const uploadShellRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef<HTMLElement>(null);
  const partnersRef = useRef<HTMLElement>(null);

  const handleUploadComplete = async (base64Image: string) => {
    if (isCreatingProjectRef.current) return false;
    isCreatingProjectRef.current = true;
    try {
      const newId = Date.now().toString();
      const name = `Residence ${newId}`;

      const newItem = {
        id: newId,
        name,
        sourceImage: base64Image,
        renderedImage: undefined,
        timestamp: Date.now(),
      };

      const saved = await createProject({ item: newItem, visibility: "private" });

      if (saved) {
        setProjects((prev) => [saved, ...prev]);
      } else {
        console.warn("Project failed to save to worker/backend, navigating with local state.");
      }

      navigate(`/visualizer/${newId}`, {
        state: {
          initialImage: base64Image,
          initialRendered: saved?.renderedImage || null,
          name,
        },
      });

      return true;
    } finally {
      isCreatingProjectRef.current = false;
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      const items = await getProjects();
      setProjects(items);
    };

    fetchProjects();
  }, []);

  // Smooth GSAP animations & Parallax
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // 1. Hero entrance animation
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".hero .announce", {
        opacity: 0,
        y: -15,
        duration: 0.6,
      })
        .from(
          ".hero h1",
          {
            opacity: 0,
            y: 30,
            duration: 0.8,
          },
          "-=0.3"
        )
        .from(
          ".hero .subtitle",
          {
            opacity: 0,
            y: 20,
            duration: 0.7,
          },
          "-=0.4"
        )
        .from(
          ".hero .actions",
          {
            opacity: 0,
            y: 20,
            duration: 0.6,
          },
          "-=0.4"
        )
        .from(
          uploadShellRef.current,
          {
            opacity: 0,
            y: 40,
            duration: 0.9,
          },
          "-=0.3"
        );

      // 2. Parallax effect on hero as user scrolls down
      if (heroRef.current && uploadShellRef.current) {
        gsap.to(".hero h1, .hero .subtitle", {
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
          y: -40,
          ease: "none",
        });

        gsap.to(uploadShellRef.current, {
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
          y: -20,
          ease: "none",
        });
      }

      // 3. Scroll-triggered appearance for Projects section
      if (projectsRef.current) {
        gsap.from(".projects .section-head", {
          scrollTrigger: {
            trigger: projectsRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
            once: true,
          },
          opacity: 0,
          y: 30,
          duration: 0.8,
          ease: "power3.out",
        });

        gsap.from(".projects .project-card", {
          scrollTrigger: {
            trigger: ".projects-grid",
            start: "top 85%",
            toggleActions: "play none none none",
            once: true,
          },
          opacity: 0,
          y: 40,
          stagger: 0.1,
          duration: 0.7,
          ease: "power2.out",
        });
      }

      // 4. Scroll-triggered appearance for Partners section
      if (partnersRef.current) {
        gsap.from(".partners .logo-item", {
          scrollTrigger: {
            trigger: partnersRef.current,
            start: "top 90%",
            toggleActions: "play none none none",
            once: true,
          },
          opacity: 0,
          y: 20,
          stagger: 0.08,
          duration: 0.6,
          ease: "power2.out",
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="home">
      <Navbar />

      <section ref={heroRef} className="hero">
        <div className="announce">
          <div className="dot">
            <div className="pulse"></div>
          </div>

          <p>Introducing Roomify 2.0</p>
        </div>

        <h1>Build beautiful spaces at the speed of thought with Roomify</h1>

        <p className="subtitle">
          Roomify is an AI-first design environment that helps you visualize,
          render, and ship architectural projects faster than ever.
        </p>

        <div className="actions">
          <a href="#upload" className="cta">
            Start Building <ArrowRight className="icon" />
          </a>

          {/* Clicking Watch Demo navigates to /demo */}
          <Button
            variant="outline"
            size="lg"
            className="demo cursor-pointer hover:border-zinc-400 transition-colors"
            onClick={() => navigate("/demo")}
          >
            Watch Demo
          </Button>
        </div>

        <div id="upload" ref={uploadShellRef} className="upload-shell">
          <div className="grid-overlay" />

          <div className="upload-card">
            <div className="upload-head">
              <div className="upload-icon">
                <Layers className="icon" />
              </div>

              <h3>Upload your floor plan</h3>
              <p>Supports JPG, PNG, formats up to 10MB</p>
            </div>

            <Upload onComplete={handleUploadComplete} />
          </div>
        </div>
      </section>

      <section ref={projectsRef} id="projects" className="projects">
        <div className="section-inner">
          <div className="section-head">
            <div className="copy">
              <h2>Projects</h2>
              <p>
                Your latest work and shared community projects, all in one
                place.
              </p>
            </div>
          </div>

          <div className="projects-grid">
            {projects.length === 0 ? (
              <div className="empty">
                <p>No community projects yet. Upload a floor plan above to get started!</p>
              </div>
            ) : (
              projects.map(
                ({ id, name, renderedImage, sourceImage, timestamp }) => (
                  <div
                    key={id}
                    className="project-card group"
                    onClick={() => navigate(`/visualizer/${id}`)}
                  >
                    <div className="preview">
                      <img
                        src={renderedImage || sourceImage}
                        alt="project preview"
                      />

                      <div className="badge">
                        <span>Community</span>
                      </div>
                    </div>

                    <div className="card-body">
                      <div>
                        <h3>{name}</h3>

                        <div className="meta">
                          <Clock size={12} />
                          <span>
                            {new Date(timestamp).toLocaleDateString()}
                          </span>

                          <span>By Archit Dash</span>
                        </div>
                      </div>

                      <div className="arrow">
                        <ArrowUpRight size={18} />
                      </div>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </section>

      <section ref={partnersRef} className="partners">
        <div className="section-inner">
          <div className="logos">
            <div className="logo-item group">
              <div>📐</div>
              <span>ARCHISTUDIO</span>
            </div>
            <div className="logo-item group">
              <div>🏢</div>
              <span>MODERNA</span>
            </div>
            <div className="logo-item group">
              <div>🧭</div>
              <span>SPATIAL LAB</span>
            </div>
            <div className="logo-item group">
              <div>⚡</div>
              <span>BLUEPRINT AI</span>
            </div>
            <div className="logo-item group">
              <div>✨</div>
              <span>VIRTUAL DESIGN</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
