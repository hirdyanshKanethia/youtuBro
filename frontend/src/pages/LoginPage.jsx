import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { FaGoogle } from "react-icons/fa";
import youtubroLogo from "../assets/youtuBro_logo_with_text.png";
import youtuBro_action1 from "../assets/youtuBro_inaction_1.png"
import youtuBro_action2 from "../assets/youtuBro_inaction_2.png"

const FeatureSection = ({
  title,
  description,
  examples,
  alignment,
  colorClass,
}) => (
  <div
    className={`flex flex-col md:flex-row items-center gap-12 py-16 px-4 ${
      alignment === "left" ? "md:flex-row" : "md:flex-row-reverse"
    }`}
  >
    <div className="flex-1 text-center md:text-left">
      <h2 className={`text-4xl md:text-5xl font-extrabold mb-4 ${colorClass}`}>
        {title}
      </h2>
      <p className="text-lg md:text-xl text-gray-300 mb-6 leading-relaxed">
        {description}
      </p>
      {examples && (
        <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg border border-gray-700 max-w-lg mx-auto md:mx-0">
          <p className="font-semibold text-lg text-white mb-2">
            Example Prompts:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 text-left">
            {examples.map((example, index) => (
              <li key={index} className="text-md md:text-lg">
                <span className="font-mono bg-gray-700 rounded px-2 py-1 text-purple-300 text-sm">
                  {example}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  </div>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const mountRef = useRef(null);
  // --- NEW: State for CSS cursor position ---
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 }); // Initialize off-screen
  // --- END NEW ---

  useEffect(() => {
    if (localStorage.getItem("jwt_token")) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);
    camera.position.z = 5;

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);
    const colorPalette = [
      new THREE.Color(0xdb2777), // Pink
      new THREE.Color(0x9333ea), // Purple
      new THREE.Color(0xef4444), // Red
      new THREE.Color(0x3b82f6), // Blue
    ];

    for (let i = 0; i < particlesCount; i++) {
      posArray[i * 3] = (Math.random() - 0.5) * 10;
      posArray[i * 3 + 1] = (Math.random() - 0.5) * 10;
      posArray[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3)
    );

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.015,
      color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    const particlesMesh = new THREE.Points(
      particlesGeometry,
      particlesMaterial
    );
    scene.add(particlesMesh);

    const animate = () => {
      requestAnimationFrame(animate);
      particlesMesh.rotation.y += 0.0005;
      renderer.render(scene, camera);
    };
    animate();

    const onWindowResize = () => {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener("resize", onWindowResize);

    return () => {
      window.removeEventListener("resize", onWindowResize);
      currentMount.removeChild(renderer.domElement);
    };
  }, []); // Three.js effect runs once, doesn't depend on mouse position

  // --- NEW: Mouse move handler for CSS cursor ---
  const handleMouseMove = useCallback((e) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]); // Effect for CSS cursor event listener
  // --- END NEW ---

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const loginUrl = `${API_URL}/auth/login`;

  return (
    <div className="relative w-screen min-h-screen bg-black text-white overflow-x-hidden">
      {/* Three.js Canvas Container - Fixed background */}
      <div ref={mountRef} className="fixed inset-0 z-0 opacity-80"></div>
      {/* --- NEW: CSS Cursor Glow Element --- */}
      <div
        className="fixed z-40 w-32 h-32 rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
        style={{
          left: cursorPos.x,
          top: cursorPos.y,
          background:
            "radial-gradient(circle at center, rgba(239, 68, 68, 0.4) 0%, rgba(147, 51, 234, 0.2) 50%, transparent 100%)",
          filter: "blur(30px)", // Soft blur
          transition:
            "transform 0.1s ease-out, left 0.05s linear, top 0.05s linear", // Smooth movement
        }}
      ></div>
      {/* --- END NEW --- */}
      {/* Login Button - Sharp Top Right */}
      <a
        href={loginUrl}
        className="fixed top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-purple-600 hover:border-purple-500 transition-all duration-300 z-30"
      >
        <FaGoogle />
        Login with Google
      </a>
      {/* Scrollable Content Container */}
      <div className="relative z-10 w-full max-w-8xl mx-auto py-16 md:py-24 px-6 custom-scrollbar">
        {/* Hero Section */}
        <div className="text-center mb-20 md:mb-24 pt-16">
          <img
            src={youtubroLogo}
            alt="YoutuBro Logo"
            className="max-w-xs md:max-w-lg mx-auto mb-6 drop-shadow-lg"
          />
          <p className="p-4 pb-30 text-x1 md:text-2xl font-light text-blue-400 leading-relaxed max-w-3xl mx-auto">
            Your intelligent YouTube integrated MCP assistant. Effortlessly
            create, manage, and discover content using only text. Experience a
            new dimension of media interaction, personalized just for you.
          </p>

          {/* Flex container for two side-by-side images */}
          <div className="py-16 flex flex-col md:flex-row gap-4 max-w-6xl mx-auto">
            {/* Image 1 */}
            <div className="w-full md:w-1/2">
              <img
                src={youtuBro_action1} // Replace with your first image
                alt="Feature demonstration 1"
                className="w-full h-full object-cover rounded-lg shadow-2xl shadow-purple-500/10"
              />
            </div>
            {/* Image 2 */}
            <div className="w-full md:w-1/2">
              <img
                src={youtuBro_action2} // Replace with your second image
                alt="Feature demonstration 2"
                className="w-full h-full object-cover rounded-lg shadow-2xl shadow-pink-500/10"
              />
            </div>
          </div>
        </div>

        {/* Feature Sections with alternating layout */}

        {/* Section 1 */}
        <div className="flex flex-col md:flex-row items-center gap-12 py-16 px-4">
          <div className="flex-1">
            <FeatureSection
              title="Dynamic Playlist Creation"
              description="Craft the perfect playlist for any mood or purpose. If you are trying to learn something or just chilling in your leisure time, YoutuBro understands your intent and fetches videos directly from YouTube."
              examples={[
                "Create a playlist named 'study time' for studying with lo-fi hip-hop music.",
                "Make a workout playlist with high-energy rock songs from the 80s.",
                "Make a playlist to learn about Neural Networks",
              ]}
              colorClass="text-pink-400"
            />
          </div>
          <div className="flex-1"></div>{" "}
          {/* Empty placeholder div for the image */}
        </div>

        {/* Section 2 */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-12 py-16 px-4">
          <div className="flex-1">
            <FeatureSection
              title="Seamless Content Management"
              description="Effortlessly modify your playlists without ever leaving the application. Add new videos, remove old ones, or even rename entire playlists with natural language prompts."
              examples={[
                "Add the latest Taylor Swift songs to my 'Pop Hits' playlist.",
                "Remove 'Old Town Road' from my workout playlist.",
                "Rename 'My Favorites' playlist to 'Top Tracks 2024'.",
              ]}
              colorClass="text-purple-400"
            />
          </div>
          <div className="flex-1"></div>{" "}
          {/* Empty placeholder div for the image */}
        </div>

        {/* Section 3 */}
        <div className="flex flex-col md:flex-row items-center gap-12 py-16 px-4">
          <div className="flex-1">
            <FeatureSection
              title="Instant Playback & Control"
              description="Directly control your media playback. Play, pause, skip, or queue up videos instantly, making your viewing experience truly hands-free."
              examples={[
                "Play 'Bohemian Rhapsody' by Queen.",
                "Play a minecraft gameplay video",
              ]}
              colorClass="text-blue-400"
            />
          </div>
          <div className="flex-1"></div>{" "}
          {/* Empty placeholder div for the image */}
        </div>

        {/* Section 4 */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-12 py-16 px-4">
          <div className="flex-1">
            <FeatureSection
              title="Interactive Chat & Discovery"
              description="Beyond commands, engage in a natural conversation with your AI assistant. Discover new content, get recommendations, or learn more about artists and videos."
              examples={[
                "Suggest some good artists similar to Tame Impala.",
                "Find me a tutorial for cooking white pasta",
              ]}
              colorClass="text-red-400"
            />
          </div>
          <div className="flex-1"></div>{" "}
          {/* Empty placeholder div for the image */}
        </div>

        {/* Call to Action at the bottom */}
        <div className="text-center py-16 mt-16 bg-gray-900 bg-opacity-70 rounded-xl border border-gray-700 max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Ready to Revolutionize Your YouTube Experience?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-xl mx-auto">
            Join YoutuBro today and unlock the full potential of AI-powered
            media control.
          </p>
          <a
            href={loginUrl}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <FaGoogle size={20} />
            Get Started with Google
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
