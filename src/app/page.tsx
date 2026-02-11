"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Zap,
  TrendingUp,
  Palette,
  Video,
  Calendar,
  BarChart3,
  Brain,
  ChevronDown,
  ChevronRight,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Instagram,
  Image,
  Layers,
  Film,
  Wifi,
  WifiOff,
  ShoppingBag,
  Wand2,
  Eye,
  EyeOff,
  Package,
  RefreshCw,
} from "lucide-react";
import type { OrchestratorOutput, AgentId } from "@/types/agents";

// ─── Agent Config ────────────────────────────────────────

const AGENTS: {
  id: AgentId;
  name: string;
  icon: typeof Zap;
  color: string;
  description: string;
}[] = [
    {
      id: "trend-scout",
      name: "Trend Scout",
      icon: TrendingUp,
      color: "#39FF14",
      description: "Identifies viral Reel trends for streetwear",
    },
    {
      id: "brand-intel",
      name: "Brand Intelligence",
      icon: Brain,
      color: "#FF6B6B",
      description: "Deep RIIQX brand DNA analysis",
    },
    {
      id: "reel-script",
      name: "Viral Reel Script",
      icon: Video,
      color: "#4ECDC4",
      description: "Scroll-stopping Reel concepts",
    },
    {
      id: "canva-prompts",
      name: "Design Prompts",
      icon: Palette,
      color: "#FFE66D",
      description: "Canva-ready visual design prompts",
    },
    {
      id: "content-strategy",
      name: "Content Strategy",
      icon: Calendar,
      color: "#A78BFA",
      description: "Posting schedule & growth hacks",
    },
    {
      id: "performance",
      name: "Performance",
      icon: BarChart3,
      color: "#F472B6",
      description: "Analytics & optimization tips",
    },
  ];

// ─── Types ───────────────────────────────────────────────

interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  tags: string[];
  images: string[];
  handle: string;
  shopUrl: string;
}

interface IGAccount {
  connected: boolean;
  username?: string;
  name?: string;
  followers_count?: number;
  media_count?: number;
}

interface AutoPostResult {
  success: boolean;
  product: { id: string; name: string };
  content: {
    type: string;
    caption: string;
    hashtags: string[];
    cta: string;
    imageUrl?: string;
    slides?: { imageUrl: string; overlayText: string }[];
    hook?: string;
    scenes?: string[];
  };
  video?: {
    publicUrl: string;
    duration: number;
    resolution: string;
    expiresAt: string;
  };
  posted?: { mediaId: string };
  error?: string;
}

// ─── Dashboard ───────────────────────────────────────────

export default function Dashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<OrchestratorOutput | null>(null);
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [individualResults, setIndividualResults] = useState<
    Record<string, unknown>
  >({});
  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Instagram state
  const [igAccount, setIgAccount] = useState<IGAccount | null>(null);
  const [igLoading, setIgLoading] = useState(true);

  // Products state (live from Shopify)
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Product auto-post state
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [postContentType, setPostContentType] = useState<
    "image" | "carousel" | "reel"
  >("image");
  const [autoPublish, setAutoPublish] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoPostResult, setAutoPostResult] = useState<AutoPostResult | null>(
    null
  );
  const [showPreview, setShowPreview] = useState(false);

  // IG connection check
  const checkIGConnection = useCallback(async () => {
    setIgLoading(true);
    try {
      const res = await fetch("/api/instagram/setup");
      const data = await res.json();
      setIgAccount(data);
    } catch {
      setIgAccount({ connected: false });
    } finally {
      setIgLoading(false);
    }
  }, []);

  // Fetch products from Shopify
  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkIGConnection();
    loadProducts();
  }, [checkIGConnection, loadProducts]);

  // ─── Agent Handlers ──────────────────────────────────

  const runOrchestrator = async () => {
    setIsRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/orchestrator", { method: "POST" });
      const data = await res.json();
      setResult(data);
      setExpandedAgents(new Set(AGENTS.map((a) => a.id)));
    } catch (err) {
      console.error("Orchestrator failed:", err);
    } finally {
      setIsRunning(false);
    }
  };

  const runSingleAgent = async (agentId: AgentId) => {
    setRunningAgent(agentId);
    try {
      const res = await fetch(`/api/agents/${agentId}`, { method: "POST" });
      const data = await res.json();
      setIndividualResults((prev) => ({ ...prev, [agentId]: data }));
      setExpandedAgents((prev) => new Set([...prev, agentId]));
    } catch (err) {
      console.error(`Agent ${agentId} failed:`, err);
    } finally {
      setRunningAgent(null);
    }
  };

  const toggleAgent = (agentId: string) => {
    setExpandedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId);
      else next.add(agentId);
      return next;
    });
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getAgentData = (agentId: AgentId): unknown | null => {
    if (individualResults[agentId]) return individualResults[agentId];
    if (!result) return null;
    const map: Record<AgentId, unknown> = {
      "trend-scout": result.trends,
      "brand-intel": result.brand_intel,
      "reel-script": result.reel_script,
      "canva-prompts": result.canva_prompts,
      "content-strategy": result.content_strategy,
      performance: result.performance,
    };
    return map[agentId];
  };

  // ─── Auto-Post Handler ──────────────────────────────

  const handleAutoPost = async (productId: string) => {
    setIsGenerating(true);
    setAutoPostResult(null);
    setSelectedProduct(productId);

    try {
      const endpoint =
        postContentType === "reel" ? "/api/generate-reel" : "/api/auto-post";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          content_type: postContentType,
          auto_publish: autoPublish,
        }),
      });

      const data = await res.json();
      if (data.error && !data.content) {
        setAutoPostResult({
          success: false,
          product: { id: productId, name: "" },
          content: { type: "image", caption: "", hashtags: [], cta: "" },
          error: data.error,
        });
      } else {
        setAutoPostResult(data);
        setShowPreview(true);
        checkIGConnection();
      }
    } catch (err) {
      setAutoPostResult({
        success: false,
        product: { id: productId, name: "" },
        content: { type: "image", caption: "", hashtags: [], cta: "" },
        error: err instanceof Error ? err.message : "Failed",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Render ──────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#000]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#222] bg-[#000]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#39FF14] rounded-lg flex items-center justify-center">
              <Sparkles size={18} className="text-black" />
            </div>
            <div>
              <h1
                className="text-xl font-bold tracking-wider"
                style={{ fontFamily: "Oswald, sans-serif" }}
              >
                RIIQX
              </h1>
              <p className="text-[10px] text-[#666] tracking-[0.2em] uppercase">
                Content Engine v2
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {igAccount !== null && (
              <div className="flex items-center gap-2 text-xs">
                {igAccount.connected ? (
                  <>
                    <Wifi size={12} className="text-[#39FF14]" />
                    <span className="text-[#39FF14]">
                      @{igAccount.username}
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff size={12} className="text-[#FF6B6B]" />
                    <span className="text-[#FF6B6B]">IG not connected</span>
                  </>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-[#666]">
              <Package size={12} />
              {productsLoading ? "..." : `${products.length} products`}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <section className="text-center mb-16 animate-[fadeIn_0.6s_ease-out]">
          <h2
            className="text-4xl md:text-6xl font-bold tracking-tight mb-4"
            style={{ fontFamily: "Oswald, sans-serif" }}
          >
            AI CONTENT
            <span className="text-[#39FF14] neon-text"> ENGINE</span>
          </h2>
          <p className="text-[#666] text-lg mb-10 max-w-xl mx-auto">
            Shopify products → AI content → Instagram auto-post. One click.
          </p>

          <button
            onClick={runOrchestrator}
            disabled={isRunning}
            className={`
              relative px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 cursor-pointer
              ${isRunning
                ? "bg-[#181818] text-[#666] cursor-not-allowed animate-border-glow border-2 border-[#39FF14]/20"
                : "bg-[#39FF14] text-black hover:shadow-[0_0_30px_rgba(57,255,20,0.3)] neon-glow hover:scale-[1.02] active:scale-[0.98]"
              }
            `}
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Running 6 agents...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Zap size={18} />
                Run Daily Cycle
              </span>
            )}
          </button>
        </section>

        {/* ─── Products from Shopify ─────────────────── */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#666] tracking-[0.15em] uppercase flex items-center gap-2">
              <ShoppingBag size={16} />
              Shopify Products — Generate & Post
            </h3>
            <button
              onClick={loadProducts}
              disabled={productsLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#666] hover:text-[#39FF14] border border-[#222] hover:border-[#39FF14]/30 transition-all cursor-pointer"
            >
              <RefreshCw
                size={12}
                className={productsLoading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex gap-1.5">
              {[
                { type: "image" as const, icon: Image, label: "Image" },
                {
                  type: "carousel" as const,
                  icon: Layers,
                  label: "Carousel",
                },
                { type: "reel" as const, icon: Film, label: "Reel Script" },
              ].map(({ type, icon: TabIcon, label }) => (
                <button
                  key={type}
                  onClick={() => setPostContentType(type)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                    ${postContentType === type
                      ? "bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30"
                      : "bg-[#111] text-[#666] border border-[#222] hover:text-[#999]"
                    }
                  `}
                >
                  <TabIcon size={12} />
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setAutoPublish(!autoPublish)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                ${autoPublish
                  ? "bg-gradient-to-r from-[#F58529]/10 via-[#DD2A7B]/10 to-[#8134AF]/10 text-[#DD2A7B] border border-[#DD2A7B]/30"
                  : "bg-[#111] text-[#666] border border-[#222]"
                }
              `}
            >
              <Instagram size={12} />
              Auto-post {autoPublish ? "ON" : "OFF"}
            </button>
          </div>

          {/* Product Grid */}
          {productsLoading ? (
            <div className="flex items-center justify-center py-16 text-[#666]">
              <Loader2 size={20} className="animate-spin mr-3" />
              Loading products from Shopify...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <Package size={32} className="text-[#333] mx-auto mb-3" />
              <p className="text-[#666]">No products found</p>
              <p className="text-[#444] text-sm mt-1">
                Check your Shopify Storefront API token
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="agent-card overflow-hidden group"
                  style={{
                    animation: `fadeIn 0.4s ease-out ${index * 60}ms backwards`,
                  }}
                >
                  {/* Product Image */}
                  <div className="relative h-48 overflow-hidden bg-[#111]">
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#333]">
                        <Package size={32} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-[10px] text-[#999] uppercase tracking-wider">
                        {product.category || "Uncategorized"}
                      </p>
                      <p className="text-sm font-semibold text-[#f5f5f0] leading-tight line-clamp-2">
                        {product.title}
                      </p>
                    </div>
                    <div className="absolute top-3 right-3 bg-[#000]/70 backdrop-blur-sm px-2 py-1 rounded-md">
                      <p className="text-xs font-bold text-[#39FF14]">
                        ₹{product.price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  {product.tags.length > 0 && (
                    <div className="px-4 pt-3 flex flex-wrap gap-1">
                      {product.tags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="text-[9px] bg-[#111] text-[#666] px-1.5 py-0.5 rounded border border-[#222]"
                        >
                          {tag}
                        </span>
                      ))}
                      {product.tags.length > 3 && (
                        <span className="text-[9px] text-[#444]">
                          +{product.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action */}
                  <div className="p-4">
                    <button
                      onClick={() => handleAutoPost(product.id)}
                      disabled={
                        isGenerating && selectedProduct === product.id
                      }
                      className={`
                        w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer
                        ${isGenerating && selectedProduct === product.id
                          ? "bg-[#181818] text-[#666] cursor-not-allowed"
                          : "bg-[#39FF14] text-black hover:bg-[#45ff24] active:scale-[0.97]"
                        }
                      `}
                    >
                      {isGenerating && selectedProduct === product.id ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          {autoPublish
                            ? "Generating & Posting..."
                            : "Generating..."}
                        </>
                      ) : (
                        <>
                          <Wand2 size={14} />
                          {autoPublish
                            ? "Generate & Post"
                            : "Generate Preview"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Generated Content Preview */}
          {autoPostResult && showPreview && (
            <div className="mt-6 agent-card p-6 animate-[fadeIn_0.3s_ease-out]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-[#f5f5f0] flex items-center gap-2">
                  <Sparkles size={14} className="text-[#39FF14]" />
                  Generated Content
                  {autoPostResult.posted && (
                    <span className="text-xs bg-[#39FF14]/10 text-[#39FF14] px-2 py-0.5 rounded-full border border-[#39FF14]/20">
                      ✅ Posted to @{igAccount?.username}
                    </span>
                  )}
                  {autoPostResult.error && (
                    <span className="text-xs bg-[#FF6B6B]/10 text-[#FF6B6B] px-2 py-0.5 rounded-full border border-[#FF6B6B]/20">
                      ❌ {autoPostResult.error}
                    </span>
                  )}
                </h4>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-[#666] hover:text-[#f5f5f0] p-1 cursor-pointer"
                >
                  <EyeOff size={14} />
                </button>
              </div>

              {/* Content type label */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-[#999] uppercase tracking-wider">
                  {autoPostResult.product.name}
                </span>
                <span className="text-[#333]">·</span>
                <span className="text-xs text-[#39FF14] uppercase tracking-wider">
                  {autoPostResult.content.type}
                </span>
              </div>

              {/* Video Player */}
              {autoPostResult.video && (
                <div className="mb-6 rounded-lg overflow-hidden border border-[#222] bg-[#111]">
                  <video
                    src={autoPostResult.video.publicUrl}
                    controls
                    className="w-full max-h-[600px] object-contain aspect-[9/16] bg-black"
                  />
                  <div className="flex items-center justify-between p-3 bg-[#181818] border-t border-[#222]">
                    <div className="flex items-center gap-3 text-xs text-[#666]">
                      <span>{autoPostResult.video.resolution}</span>
                      <span>·</span>
                      <span>{Math.round(autoPostResult.video.duration)}s</span>
                    </div>
                    <a
                      href={autoPostResult.video.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#39FF14] hover:underline"
                    >
                      Open Video ↗
                    </a>
                  </div>
                </div>
              )}

              {/* Caption */}
              <div className="relative mb-4">
                <pre className="json-display p-4 text-[#ccc] whitespace-pre-wrap text-sm leading-relaxed max-h-[300px] overflow-y-auto">
                  {autoPostResult.content.caption}
                </pre>
                <button
                  onClick={() =>
                    copyToClipboard(
                      autoPostResult.content.caption,
                      "caption"
                    )
                  }
                  className="absolute top-3 right-3 p-1.5 rounded-md bg-[#222] text-[#666] hover:text-[#39FF14] transition-colors z-10 cursor-pointer"
                >
                  {copiedId === "caption" ? (
                    <Check size={14} className="text-[#39FF14]" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>

              {/* Hashtags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {autoPostResult.content.hashtags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-[#111] text-[#4ECDC4] px-2 py-1 rounded-md border border-[#222]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Reel script scenes */}
              {autoPostResult.content.scenes && !autoPostResult.video && (
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-[#666] uppercase tracking-wider font-semibold">
                    Scenes
                  </p>
                  {autoPostResult.content.scenes.map((scene, i) => (
                    <div
                      key={i}
                      className="flex gap-3 p-3 bg-[#111] rounded-lg border border-[#1a1a1a]"
                    >
                      <span className="text-xs text-[#39FF14] font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-xs text-[#ccc] leading-relaxed">
                        {scene}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Carousel slides */}
              {autoPostResult.content.slides && (
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-[#666] uppercase tracking-wider font-semibold">
                    Carousel Slides
                  </p>
                  {autoPostResult.content.slides.map((slide, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-[#111] rounded-lg border border-[#1a1a1a]"
                    >
                      <span className="text-xs text-[#39FF14] font-bold">
                        {i + 1}
                      </span>
                      <p className="text-xs text-[#f5f5f0] font-medium">
                        {slide.overlayText}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA */}
              <div className="p-3 bg-[#39FF14]/5 rounded-lg border border-[#39FF14]/10">
                <p className="text-xs text-[#39FF14]">
                  <strong>CTA:</strong> {autoPostResult.content.cta}
                </p>
              </div>

              {/* Media ID */}
              {autoPostResult.posted && (
                <div className="mt-3 p-3 bg-[#111] rounded-lg border border-[#222]">
                  <p className="text-xs text-[#666]">
                    Media ID:{" "}
                    <span className="text-[#ccc] font-mono">
                      {autoPostResult.posted.mediaId}
                    </span>
                  </p>
                </div>
              )}

              {/* Full JSON toggle */}
              <details className="mt-4">
                <summary className="text-xs text-[#444] cursor-pointer hover:text-[#666] flex items-center gap-1">
                  <Eye size={12} />
                  View full JSON
                </summary>
                <pre className="json-display p-4 text-[#ccc] mt-2 max-h-[400px] overflow-y-auto text-[11px]">
                  {JSON.stringify(autoPostResult, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </section>

        {/* ─── Agent Grid ─────────────────────────────── */}
        <section className="space-y-4 mb-16">
          <h3 className="text-sm font-semibold text-[#666] tracking-[0.15em] uppercase mb-4">
            Agents
          </h3>
          {AGENTS.map((agent, index) => {
            const data = getAgentData(agent.id);
            const isExpanded = expandedAgents.has(agent.id);
            const isThisRunning = runningAgent === agent.id;
            const Icon = agent.icon;

            return (
              <div
                key={agent.id}
                className="agent-card overflow-hidden"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: "fadeIn 0.4s ease-out backwards",
                }}
              >
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: agent.color + "15" }}
                    >
                      <Icon size={20} style={{ color: agent.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#f5f5f0]">
                        {agent.name}
                      </h3>
                      <p className="text-xs text-[#666]">
                        {agent.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => runSingleAgent(agent.id)}
                      disabled={isThisRunning || isRunning}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#333] text-[#999] hover:border-[#39FF14]/40 hover:text-[#39FF14] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:scale-[1.05] active:scale-[0.95]"
                    >
                      {isThisRunning ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        "Run"
                      )}
                    </button>

                    {data !== null && (
                      <button
                        onClick={() => toggleAgent(agent.id)}
                        className="p-1.5 text-[#666] hover:text-[#f5f5f0] transition-colors cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && data !== null && (
                  <div className="px-5 pb-5 animate-[slideDown_0.3s_ease-out]">
                    <div className="relative">
                      <button
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(data, null, 2),
                            agent.id
                          )
                        }
                        className="absolute top-3 right-3 p-1.5 rounded-md bg-[#222] text-[#666] hover:text-[#39FF14] transition-colors z-10 cursor-pointer"
                        title="Copy JSON"
                      >
                        {copiedId === agent.id ? (
                          <Check size={14} className="text-[#39FF14]" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <pre className="json-display p-4 text-[#ccc] max-h-[500px] overflow-y-auto">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* ─── IG Connection ──────────────────────────── */}
        <section className="mb-16">
          <h3 className="text-sm font-semibold text-[#666] tracking-[0.15em] uppercase mb-4 flex items-center gap-2">
            <Instagram size={16} />
            Instagram Connection
          </h3>

          <div className="agent-card p-6">
            {igLoading ? (
              <div className="flex items-center gap-2 text-[#666] text-sm">
                <Loader2 size={14} className="animate-spin" />
                Checking connection...
              </div>
            ) : !igAccount?.connected ? (
              <div className="text-center py-6">
                <WifiOff size={28} className="text-[#FF6B6B] mx-auto mb-3" />
                <p className="text-[#FF6B6B] font-medium mb-1">
                  Not Connected
                </p>
                <p className="text-[#666] text-sm">
                  Add META_ACCESS_TOKEN to .env.local
                </p>
                <button
                  onClick={checkIGConnection}
                  className="mt-3 px-4 py-2 rounded-lg text-xs font-medium border border-[#333] text-[#999] hover:border-[#39FF14]/40 hover:text-[#39FF14] transition-all cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] p-[2px]">
                    <div className="w-full h-full rounded-full bg-[#181818] flex items-center justify-center">
                      <Instagram size={16} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#f5f5f0]">
                      @{igAccount.username}
                    </p>
                    <p className="text-xs text-[#666]">
                      {igAccount.followers_count?.toLocaleString()} followers ·{" "}
                      {igAccount.media_count} posts
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#39FF14]">
                  <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
                  Connected
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="pb-10 text-center">
          <p className="text-[#333] text-xs">
            RIIQX Content Engine v2.0 — Shopify + AI Agents + Instagram
            Auto-Post
          </p>
        </footer>
      </main>
    </div>
  );
}
