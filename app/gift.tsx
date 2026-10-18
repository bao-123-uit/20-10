"use client";
// =====================================================================
// GiftExperience.tsx — TOÀN BỘ trải nghiệm quà tặng trong 1 file.
// Cài: npm i three @react-three/fiber gsap lucide-react framer-motion
//      npm i -D @types/three
// Dùng ở trang chủ:
//   const GiftExperience = dynamic(() => import("@/components/GiftExperience"), { ssr: false });
//   {gift && <GiftExperience audioRef={audioRef} onClose={() => setGift(false)} />}
// =====================================================================
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, RotateCcw, SkipForward, Volume2, VolumeX } from "lucide-react";


// ========== 1. NỘI DUNG — SỬA Ở ĐÂY ==========

// src/data/gift.ts — SỬA NỘI DUNG Ở ĐÂY

// Ảnh đặt trong public/ (ảnh dọc/vuông đều được, tự crop kiểu cover).
// Càng nhiều ảnh càng đẹp; nếu ít hơn số ô trên quả cầu thì ảnh sẽ được lặp lại.
const PHOTOS = [
  "/anh1.jpg",
  "/anh2.jpg",
  "/anh3.jpg",
  "/anh4.jpg",
  "/anh5.jpg",
  "/anh6.jpg",
  "/anh7.jpg",
  "/anh8.jpg",
  "/anh9.jpg",
  "/anh10.jpg",
  "/anh11.jpg",
];

// Dòng chữ nhỏ hiện giữa các cảnh (at = giây trên timeline)
const CAPTIONS = [
  { at: 3.2, text: "Có một điều nho nhỏ,anh muốn gửi riêng cho em..." },
  { at: 11.5, text: "Một bó hoa, chúc em luôn rạng rỡ.(Vì cũng không biết được địa chỉ nhà em nên em nhận hoa online trước nhé)" },
  { at: 19, text: "Thấy hay không em hihi." },
  { at: 31, text: "Em coi nhiều ảnh chưa nè hehe." },
];

const LETTER = {
  title: "Gửi Phương Linh,",
  lines: [
    "Nhân ngày 20/10, anh chúc em một ngày thật vui vẻ, rạng rỡ.",
    "Mong em luôn cười thật nhiều, luôn thấy mình được trân trọng, và những điều tốt đẹp nhất sẽ đến với em.",
    "Hmmm, anh cũng không biết nói gì hơn, chỉ muốn gửi đến em một món quà nho nhỏ, hy vọng em sẽ thích.",
    "Cảm ơn em vì đã xem đến cuối. Em cũng đừng cảm động quá nghe. Anh màaa, mấy cái ni đơn giản thoai hehee",
  ],
  signature: "— [Minh Bảo]",
  photo: "/images/letter.jpg", // ảnh cuối thư; xóa dòng này nếu không dùng
};

// ========== 2. STATE DÙNG CHUNG ==========

// Một object thường: GSAP tween các giá trị này, các scene đọc trong useFrame (không re-render React).
const S = {
  stars: 0, // độ hiện của sao nền
  converge: 0, // bụi sao hội tụ vào nebula
  glow: 0, // cường độ vùng sáng trung tâm
  spiral: 0, // hạt xoắn ốc về hình bó hoa
  fall: 0, // hạt rơi chậm quanh bó hoa
  vis: 1, // độ hiện của hạt
  streak: 0, // dải sáng hồng trước khi hiện hoa
  bouquet: 0, // độ hiện của bó hoa
  photos: 0, // ảnh lần lượt xuất hiện
  sphere: 0, // ảnh gom thành quả cầu
  impact: 0, // nhịp sáng khi mảnh cuối khớp vào cầu
  gallery: 0, // ảnh tách ra thành không gian bay
  photoVis: 1, // ảnh mờ dần khi kết thúc
  camZ: 11,
  lookZ: 0,
  sway: 0,
};
const INIT = { ...S };
const resetState = () => Object.assign(S, INIT);
const clamp = THREE.MathUtils.clamp;

let glowTex: THREE.CanvasTexture | null = null;
function getGlow() {
  if (!glowTex) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d")!;
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    glowTex = new THREE.CanvasTexture(c);
  }
  return glowTex;
}

// ========== 3. HẠT NEBULA + SAO ==========

const PALETTE = ["#FF4FA3", "#FF4FA3", "#FFC6E5", "#FFC6E5", "#A78BFA", "#A78BFA", "#FFF4FC", "#6C7BFF"].map((c) => new THREE.Color(c));
const gauss = () => (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2;

const vertex = /* glsl */ `
uniform float uTime, uConverge, uSpiral, uFall, uGlow, uVis, uPixel;
attribute vec3 aStart, aBq, aColor;
attribute vec4 aRnd;
varying vec3 vColor;
varying float vAlpha;
float ease(float t){ return t<.5 ? 4.*t*t*t : 1.-pow(-2.*t+2.,3.)/2.; }
mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
void main(){
  // 1) bay từ mọi hướng về nebula (mỗi hạt lệch nhịp một chút)
  float c = ease(clamp(uConverge*1.3 - aRnd.x*0.3, 0., 1.));
  vec3 p = mix(aStart, position, c);
  // 2) xoắn ốc về hình bó hoa
  float sp = ease(clamp(uSpiral*1.3 - aRnd.y*0.3, 0., 1.));
  vec3 q = mix(p, aBq, sp);
  q.xz = rot(sp*(1.-sp)*5.*(1.+aRnd.z) + uTime*0.12*(1.-sp)) * q.xz;
  // 3) rơi chậm quanh bó hoa
  float fall = mod(uTime*0.2*(0.4+aRnd.w) + aRnd.x*6., 6.);
  q.y = mix(q.y, 3. - fall, sp*uFall);
  // dao động nhẹ
  q += 0.07*vec3(sin(uTime*aRnd.z*2.+aRnd.w*6.), cos(uTime*aRnd.y*2.+aRnd.x*6.), sin(uTime*aRnd.w*2.+aRnd.z*6.));
  vec4 mv = modelViewMatrix * vec4(q,1.);
  float tw = pow(.5+.5*sin(uTime*(1.+aRnd.w*3.)+aRnd.x*40.), 8.); // vài hạt lóe sáng ngắn rồi mờ
  gl_PointSize = (aRnd.z*2.2+0.8) * (1.+tw*3.) * uPixel * (8./-mv.z);
  vColor = aColor * (0.55 + tw*1.5 + uGlow*0.35*c);
  vAlpha = (0.25 + 0.6*aRnd.z) * uVis * (0.3 + 0.7*c);
  gl_Position = projectionMatrix * mv;
}`;
const fragment = /* glsl */ `
varying vec3 vColor; varying float vAlpha;
void main(){
  float d = length(gl_PointCoord-.5);
  float a = pow(smoothstep(.5,0.,d), 2.);
  gl_FragColor = vec4(vColor, a*vAlpha);
}`;

function NebulaParticles({ count }: { count: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { geo, uniforms } = useMemo(() => {
    const pos = new Float32Array(count * 3), start = new Float32Array(count * 3), bq = new Float32Array(count * 3);
    const rnd = new Float32Array(count * 4), col = new Float32Array(count * 3);
    const dir = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      dir.set(gauss(), gauss(), gauss()).normalize().multiplyScalar(14 + Math.random() * 16);
      start.set([dir.x, dir.y, dir.z], i * 3);
      const r = Math.pow(Math.random(), 0.65) * 5.4;
      const a = Math.random() * Math.PI * 2;
      const funnelY = (Math.random() - 0.5) * 7.5;
      pos.set([Math.cos(a) * r, funnelY, Math.sin(a) * r], i * 3);
      const br = 0.8 + Math.random() * 3.2, ba = Math.random() * Math.PI * 2;
      bq.set([Math.cos(ba) * br, (Math.random() - 0.5) * 7, Math.sin(ba) * br], i * 3);
      rnd.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
      const c = PALETTE[(Math.random() * PALETTE.length) | 0];
      col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aStart", new THREE.BufferAttribute(start, 3));
    g.setAttribute("aBq", new THREE.BufferAttribute(bq, 3));
    g.setAttribute("aRnd", new THREE.BufferAttribute(rnd, 4));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    const u = {
      uTime: { value: 0 }, uConverge: { value: 0 }, uSpiral: { value: 0 }, uFall: { value: 0 },
      uGlow: { value: 0 }, uVis: { value: 1 }, uPixel: { value: 1 },
    };
    return { geo: g, uniforms: u };
  }, [count]);

  useFrame(({ clock, gl }) => {
    const u = mat.current?.uniforms;
    if (!u) return;
    u.uTime.value = clock.elapsedTime;
    u.uConverge.value = S.converge;
    u.uSpiral.value = S.spiral;
    u.uFall.value = S.fall;
    u.uGlow.value = S.glow;
    u.uVis.value = S.vis;
    u.uPixel.value = gl.getPixelRatio();
  });

  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial ref={mat} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms}
        transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

// Vùng sáng hồng ở trung tâm: mờ, additive, giới hạn độ sáng để không cháy che hạt
function CoreGlow() {
  const ref = useRef<THREE.Sprite>(null);
  const map = useMemo(() => getGlow(), []);
  useFrame(({ clock }) => {
    const s = ref.current;
    if (!s) return;
    const sc = (2.2 + S.glow * 5) * (1 + Math.sin(clock.elapsedTime * 2) * 0.06);
    s.scale.set(sc, sc, 1);
    (s.material as THREE.SpriteMaterial).opacity = S.glow * 0.4 * (1 - S.photos);
  });
  return (
    <sprite ref={ref}>
      <spriteMaterial map={map} color="#FF4FA3" blending={THREE.AdditiveBlending} transparent depthWrite={false} opacity={0} />
    </sprite>
  );
}

// Sao nền (xa) và đốm sáng nhỏ (gần, hiện ở không gian ảnh)
function Starfield({ count, rMin, rMax, size, color, opacity }: {
  count: number; rMin: number; rMax: number; size: number; color: string; opacity: () => number;
}) {
  const pts = useRef<THREE.Points>(null);
  const mat = useRef<THREE.PointsMaterial>(null);
  const geo = useMemo(() => {
    const a = new Float32Array(count * 3);
    const v = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      v.set(gauss(), gauss(), gauss()).normalize().multiplyScalar(rMin + Math.random() * (rMax - rMin));
      a.set([v.x, v.y, v.z], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(a, 3));
    return g;
  }, [count, rMin, rMax]);
  useFrame((_, dt) => {
    if (pts.current) pts.current.rotation.y += dt * 0.01;
    if (mat.current) mat.current.opacity = opacity();
  });
  return (
    <points ref={pts} geometry={geo} frustumCulled={false}>
      <pointsMaterial ref={mat} size={size} color={color} transparent opacity={0} depthWrite={false}
        blending={THREE.AdditiveBlending} fog={false} />
    </points>
  );
}

// ========== 4. BÓ HOA ==========

// Cánh hoa = một mảnh vỏ cầu cong. Xếp các vòng cánh lồng nhau => đóa hồng.
const petalGeo = new THREE.SphereGeometry(1, 20, 14, 0, Math.PI * 0.85, Math.PI * 0.3, Math.PI * 0.7);
const RINGS = [
  { s: 0.3, n: 3, t: -0.2, y: 0.02 },
  { s: 0.48, n: 4, t: 0.0, y: 0.05 },
  { s: 0.66, n: 5, t: 0.18, y: 0.1 },
  { s: 0.85, n: 6, t: 0.34, y: 0.16 },
];
const mk = (color: string, emissive: string, ei = 0.25) =>
  new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: ei, roughness: 0.55, side: THREE.DoubleSide, transparent: true });

type Mats = ReturnType<typeof makeMats>;
const makeMats = () => ({
  petals: [mk("#FF8DC1", "#FF4FA3"), mk("#FFB3D6", "#FF6FB4"), mk("#FFC6E5", "#FF8DC1")],
  deep: mk("#E23C8C", "#FF2D8A", 0.35),
  leaf: mk("#5E8F7E", "#2E5E4F", 0.1),
  paper: mk("#FFE9F5", "#FFC6E5", 0.15),
  paper2: mk("#C9B6FF", "#A78BFA", 0.2),
  ribbon: mk("#FF4FA3", "#FF4FA3", 0.5),
});

function Rose({ pos, quat, scale, mats, mi, seed }: {
  pos: THREE.Vector3; quat: THREE.Quaternion; scale: number; mats: Mats; mi: number; seed: number;
}) {
  return (
    <group position={pos} quaternion={quat} scale={scale}>
      {RINGS.map((r, ri) =>
        Array.from({ length: r.n }, (_, k) => (
          <mesh
            key={`${ri}-${k}`}
            geometry={petalGeo}
            material={ri < 2 ? mats.deep : mats.petals[mi % 3]}
            rotation={new THREE.Euler(r.t, (k / r.n) * Math.PI * 2 + ri * 0.9 + seed, 0, "YXZ")}
            scale={[r.s, r.s * 0.92, r.s]}
            position={[0, r.y, 0]}
          />
        ))
      )}
    </group>
  );
}

function Bouquet() {
  const root = useRef<THREE.Group>(null);
  const mats = useMemo(makeMats, []);
  const all = useMemo(() => Object.values(mats).flat() as THREE.MeshStandardMaterial[], [mats]);

  const { roses, leaves } = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const roses = Array.from({ length: 11 }, (_, i) => {
      const t = (i + 0.5) / 11;
      const phi = Math.acos(1 - t * 0.85), th = i * 2.399963; // phân bố kiểu hoa hướng dương trên bán cầu
      const dir = new THREE.Vector3(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th));
      return {
        pos: dir.clone().multiplyScalar(1.35).add(new THREE.Vector3(0, 0.6, 0)),
        quat: new THREE.Quaternion().setFromUnitVectors(up, dir),
        scale: 0.58 - t * 0.08,
        mi: i, seed: i * 1.3,
      };
    });
    const leaves = Array.from({ length: 9 }, (_, i) => ({ yaw: (i / 9) * Math.PI * 2 + 0.3, tilt: 0.5 + (i % 3) * 0.12 }));
    return { roses, leaves };
  }, []);

  useFrame(({ clock, pointer }) => {
    const g = root.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const e = THREE.MathUtils.smootherstep(S.bouquet, 0, 1);
    g.visible = S.bouquet > 0.001;
    g.scale.setScalar(0.35 + 0.65 * e);
    g.position.y = Math.sin(t * 0.9) * 0.1;
    g.rotation.y = Math.sin(t * 0.4) * 0.5 + pointer.x * 0.5;
    g.rotation.x = 0.15 - pointer.y * 0.2;
    const o = clamp(S.bouquet * 1.5, 0, 1);
    all.forEach((m) => (m.opacity = o));
  });

  return (
    <group ref={root} visible={false}>
      {roses.map((r, i) => <Rose key={i} {...r} mats={mats} />)}
      {leaves.map((l, i) => (
        <mesh key={i} material={mats.leaf} position={[Math.cos(l.yaw) * 1.5, 0.35, Math.sin(l.yaw) * 1.5]}
          rotation={new THREE.Euler(0, -l.yaw, l.tilt, "YXZ")} scale={[0.55, 0.07, 0.24]}>
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
      ))}
      {/* giấy gói + nơ */}
      <mesh material={mats.paper} position={[0, -0.65, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[1.25, 2.4, 32, 1, true]} />
      </mesh>
      <mesh material={mats.paper2} position={[0.04, -0.7, 0.04]} rotation={[Math.PI, 0.6, 0]} scale={0.96}>
        <coneGeometry args={[1.25, 2.4, 5, 1, true]} />
      </mesh>
      <mesh material={mats.ribbon} position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.87, 0.06, 8, 40]} />
      </mesh>
    </group>
  );
}

function RealBouquetScene({ bouquet }: { bouquet: RefObject<HTMLImageElement | null> }) {

  useFrame(({ clock }) => {
    const image = bouquet.current;
    if (!image) return;
    const visible = clamp(S.bouquet * 1.8, 0, 1);
    const float = Math.sin(clock.elapsedTime * 1.2) * 5;
    image.style.opacity = String(visible);
    image.style.transform = `translateY(${float}px) scale(${0.72 + visible * 0.28})`;
  });

  return null;
}

// Dải sáng hồng nằm ngang co giãn trước khi bó hoa hiện ra (như trong video)
function Streaks() {
  const g = useRef<THREE.Group>(null);
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#FF4FA3", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    []
  );
  useFrame(({ clock }) => {
    const t = clock.elapsedTime, k = S.streak;
    g.current?.children.forEach((m, i) => {
      const w = (0.35 + 0.65 * Math.abs(Math.sin(t * 3 + i * 1.7))) * k * (2.8 - Math.abs(i - 8.5) * 0.1);
      m.scale.set(Math.max(w, 0.0001), 1, 1);
      m.position.y = (i - 8.5) * 0.13 * (0.5 + 0.5 * k);
    });
    mat.opacity = 0.8 * Math.min(1, k * 2);
  });
  return (
    <group ref={g}>
      {Array.from({ length: 18 }, (_, i) => (
        <mesh key={i} material={mat}>
          <planeGeometry args={[1, 0.05 + ((i * 37) % 5) * 0.012]} />
        </mesh>
      ))}
    </group>
  );
}

// ========== 5. ẢNH: QUẢ CẦU + KHÔNG GIAN BAY ==========

// Cùng một bộ ảnh 3D "biến hình": rời rạc -> quả cầu Fibonacci -> không gian bay.
// (Gộp PhotoSphere + FloatingPhotoGallery vì ảnh thật sự tách ra từ quả cầu.)

const W = 1, H = 4 / 3;
const SPHERE_RADIUS = 3;
const SPHERE_ROWS = 7;
const SPHERE_GAP = -0.004;
const smooth = THREE.MathUtils.smootherstep;

let fb: THREE.CanvasTexture | null = null;
function fallbackTex() {
  if (!fb) {
    const c = document.createElement("canvas");
    c.width = 300; c.height = 400;
    const x = c.getContext("2d")!;
    const g = x.createLinearGradient(0, 0, 300, 400);
    g.addColorStop(0, "#FFC6E5"); g.addColorStop(1, "#A78BFA");
    x.fillStyle = g; x.fillRect(0, 0, 300, 400);
    x.fillStyle = "rgba(255,255,255,.8)"; x.font = "120px serif"; x.textAlign = "center"; x.fillText("♥", 150, 230);
    fb = new THREE.CanvasTexture(c);
    fb.colorSpace = THREE.SRGBColorSpace;
  }
  return fb;
}

const cache = new Map<string, Promise<THREE.Texture>>();
function loadTex(url: string) {
  if (!cache.has(url)) {
    cache.set(url, new Promise((res) => {
      new THREE.TextureLoader().load(url, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        res(t);
      }, undefined, () => res(fallbackTex())); // thiếu ảnh -> dùng ảnh tạm, không vỡ trang
    }));
  }
  return cache.get(url)!;
}

type D = {
  i: number; url: string; pS: THREE.Vector3; pH: THREE.Vector3; pG: THREE.Vector3;
  qS: THREE.Quaternion; qG: THREE.Quaternion;
  phiStart: number; phiLength: number; thetaStart: number; thetaLength: number;
  flatW: number; flatH: number; preScale: number; depthAlpha: number; parallax: number; arrival: number;
  sp: number; ph: number; amp: number; zamp: number;
};

function buildData(viewportAspect: number) {
  const cameraZ = viewportAspect < 0.8 ? 14.3 : 11;
  const viewHeight = 2 * cameraZ * Math.tan(THREE.MathUtils.degToRad(50 / 2));
  const viewWidth = viewHeight * viewportAspect;
  const targetCellWidth = viewportAspect < 0.8 ? 1.4 : 1.7;
  const targetCellHeight = targetCellWidth * H;
  const cols = Math.ceil(viewWidth / targetCellWidth);
  const rows = Math.ceil(viewHeight / targetCellHeight);
  const galleryCols = cols + 2;
  const galleryRows = rows + 2;
  const total = galleryCols * galleryRows;
  const actualCols = galleryCols;
  const actualRows = galleryRows;
  const galleryGapX = 0;
  const galleryGapY = 0;
  const galleryWidth = viewWidth / actualCols;
  const galleryHeight = viewHeight / actualRows;
  const foregroundHeight = viewHeight * (viewportAspect < 0.8 ? 0.44 : 0.46);
  const midHeight = viewHeight * (viewportAspect < 0.8 ? 0.26 : 0.28);
  const backHeight = viewHeight * (viewportAspect < 0.8 ? 0.12 : 0.13);
  const sphereRows = Array.from({ length: SPHERE_ROWS }, (_, row) => {
    const thetaStart = row * Math.PI / SPHERE_ROWS;
    const thetaLength = Math.PI / SPHERE_ROWS;
    const latitude = Math.abs(Math.PI / 2 - (thetaStart + thetaLength / 2));
    return { thetaStart, thetaLength, cols: Math.max(2, Math.round(total * Math.cos(latitude) / 4.8)) };
  });
  let sphereCount = sphereRows.reduce((sum, row) => sum + row.cols, 0);
  while (sphereCount > total) {
    const row = sphereRows.find((item) => item.cols > 2);
    if (!row) break;
    row.cols -= 1;
    sphereCount -= 1;
  }
  while (sphereCount < total) {
    sphereRows.sort((a, b) => b.cols - a.cols);
    sphereRows[0].cols += 1;
    sphereCount += 1;
  }
  const o = new THREE.Object3D();
  const data: D[] = [];
  let i = 0;
  sphereRows.forEach(({ thetaStart, thetaLength, cols: sphereCols }) => {
    for (let col = 0; col < sphereCols; col += 1) {
      const phiLength = Math.PI * 2 / sphereCols;
      const phiStart = col * phiLength;
      const thetaMid = thetaStart + thetaLength / 2;
      const phiMid = phiStart + phiLength / 2;
      const pH = new THREE.Vector3(
        Math.sin(thetaMid) * Math.cos(phiMid),
        Math.cos(thetaMid),
        Math.sin(thetaMid) * Math.sin(phiMid),
      ).multiplyScalar(SPHERE_RADIUS);
      o.position.copy(pH);
      o.lookAt(pH.clone().multiplyScalar(2));
      const galleryCol = i % actualCols;
      const galleryRow = Math.floor(i / actualCols);
      const galleryX = (galleryCol - (actualCols - 1) / 2) * galleryWidth;
      const galleryY = ((actualRows - 1) / 2 - galleryRow) * galleryHeight;
      const galleryZ = 0;
      const golden = Math.PI * (3 - Math.sqrt(5));
      const u = (i + 0.5) / total;
      const shellY = 1 - 2 * u;
      const shellRadius = Math.sqrt(Math.max(0, 1 - shellY * shellY));
      const shellAngle = i * golden;
      const shell = new THREE.Vector3(
        Math.cos(shellAngle) * shellRadius * 8.5,
        shellY * 8.5,
        Math.sin(shellAngle) * shellRadius * 8.5,
      );
      const startX = shell.x * 0.78;
      const startY = shell.y * 0.78;
      const startZ = -14 + ((shell.z / 8.5 + 1) * 0.5) * 17;
      const tier = i < 5 ? 0 : i < 20 ? 1 : 2;
      const targetHeight = tier === 0 ? foregroundHeight : tier === 1 ? midHeight : backHeight;
      const depthAlpha = tier === 0 ? 1 : tier === 1 ? 0.82 : 0.58;
      data.push({
        i, url: PHOTOS[(i * 5) % PHOTOS.length],
        pS: new THREE.Vector3(startX, startY, startZ),
        pH, pG: new THREE.Vector3(galleryX, galleryY, galleryZ),
        qS: new THREE.Quaternion().setFromEuler(new THREE.Euler(
          ((i * 17) % 11 - 5) * 0.16,
          ((i * 23) % 13 - 6) * 0.14,
          ((i * 29) % 15 - 7) * 0.12,
        )),
        qG: new THREE.Quaternion(),
        phiStart: phiStart + phiLength * SPHERE_GAP / 2,
        phiLength: phiLength * (1 - SPHERE_GAP),
        thetaStart: thetaStart + thetaLength * SPHERE_GAP / 2,
        thetaLength: thetaLength * (1 - SPHERE_GAP),
        flatW: galleryWidth,
        flatH: galleryHeight,
        preScale: targetHeight / galleryHeight,
        depthAlpha,
        parallax: tier === 0 ? 0.22 : tier === 1 ? 0.1 : 0.035,
        arrival: tier === 0 ? 0.14 : tier === 1 ? 0.05 : 0,
        sp: 0.25 + Math.random() * 0.35, ph: Math.random() * 6.28,
        amp: 0.3 + Math.random() * 0.6, zamp: 0.12,
      });
      i += 1;
    }
  });
  return { data, total: data.length };
}

function cropTexture(source: THREE.Texture, aspect: number) {
  const texture = source.clone();
  const image = source.image as { width: number; height: number };
  const imageAspect = image.width / image.height;
  if (imageAspect > aspect) {
    texture.repeat.set(aspect / imageAspect, 1);
    texture.offset.set((1 - aspect / imageAspect) / 2, 0);
  } else {
    texture.repeat.set(1, imageAspect / aspect);
    texture.offset.set(0, (1 - imageAspect / aspect) / 2);
  }
  texture.needsUpdate = true;
  return texture;
}

function PhotoItem({ d, n }: { d: D; n: number }) {
  const grp = useRef<THREE.Group>(null);
  const pm = useRef<THREE.MeshBasicMaterial>(null);
  const flatMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const frameMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const [flatTex, setFlatTex] = useState<THREE.Texture | null>(null);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const curvedGeo = useMemo(() => {
    const geometry = new THREE.SphereGeometry(SPHERE_RADIUS, 12, 6, d.phiStart, d.phiLength, d.thetaStart, d.thetaLength);
    geometry.translate(-d.pH.x, -d.pH.y, -d.pH.z);
    return geometry;
  }, [d]);
  const identity = useMemo(() => new THREE.Quaternion(), []);

  useEffect(() => {
    let ok = true;
    loadTex(d.url).then((t) => {
      if (!ok) return;
      const sphereAspect = d.phiLength * Math.sin(d.thetaStart + d.thetaLength / 2) / d.thetaLength;
      setTex(cropTexture(t, sphereAspect));
      setFlatTex(cropTexture(t, d.flatW / d.flatH));
    });
    return () => { ok = false; };
  }, [d]);

  useFrame(({ clock, pointer }) => {
    const g = grp.current;
    if (!g || !pm.current || !flatMaterial.current || !frameMaterial.current) return;
    const t = clock.elapsedTime;
    const a = smooth(clamp(S.photos * 2.2 - (d.i / n) * 1.2, 0, 1), 0, 1); // lần lượt xuất hiện
    const m = smooth(clamp((S.sphere - d.arrival) / (1 - d.arrival), 0, 1), 0, 1);
    const formation = smooth(clamp(m * 1.35, 0, 1), 0, 1);
    const k = smooth(S.gallery, 0, 1);
    pos.copy(d.pS).lerp(d.pH, formation).lerp(d.pG, k);
    if (formation < 1 && k < 0.01) {
      const swirl = (1 - formation) * (0.75 + d.amp * 0.35);
      const angle = d.ph + formation * (2.4 + d.sp * 3);
      pos.x += Math.cos(angle) * swirl;
      pos.z += Math.sin(angle) * swirl;
      pos.y += Math.sin(angle * 0.7) * swirl * 0.35;
      pos.x += Math.sin(t * d.sp + d.ph) * d.amp * (0.18 + (1 - formation) * 0.18);
      pos.y += Math.cos(t * d.sp * 0.8 + d.ph) * d.amp * (0.12 + (1 - formation) * 0.12);
    }
    pos.x += Math.sin(t * d.sp + d.ph) * d.amp * 0.025 * k;
    pos.y += Math.cos(t * d.sp * 0.8 + d.ph) * d.amp * 0.02 * k;
    pos.x += pointer.x * d.parallax * (1 - m);
    pos.y += pointer.y * d.parallax * 0.7 * (1 - m);
    pos.z += Math.sin(t * d.sp * 0.5 + d.ph) * d.zamp * k; // vài ảnh tiến gần camera rồi lùi lại
    g.position.copy(pos);
    g.quaternion.copy(d.qS).slerp(identity, formation).slerp(d.qG, k);
    const preScale = 1 + (d.preScale - 1) * (1 - formation) * (1 - k);
    const movingScale = (0.4 + 0.6 * a) * preScale * (0.62 + 0.38 * formation) * (0.6 + 0.4 * S.photoVis);
    const sphereLock = smooth(clamp((S.sphere - 0.78) / 0.22, 0, 1), 0, 1);
    g.scale.setScalar(k > 0.001 ? movingScale : movingScale * (1 - sphereLock) + sphereLock);
    g.visible = a > 0.001 && S.photoVis > 0.001;
    pm.current.map = tex;
    pm.current.opacity = a * S.photoVis * formation * (1 - k);
    pm.current.transparent = k > 0.001;
    pm.current.depthWrite = k <= 0.001;
    pm.current.needsUpdate = true;
    flatMaterial.current.map = flatTex;
    flatMaterial.current.opacity = a * S.photoVis * ((1 - m) * d.depthAlpha * (1 - k) + k);
    flatMaterial.current.needsUpdate = true;
    frameMaterial.current.opacity = 0;
    frameMaterial.current.needsUpdate = true;
  });

  return (
    <group ref={grp} visible={false}>
      {tex && (
        <mesh>
          <primitive object={curvedGeo} attach="geometry" />
          <meshBasicMaterial ref={pm} map={tex} transparent={false} opacity={1} side={THREE.FrontSide} depthWrite toneMapped={false} />
        </mesh>
      )}
      {flatTex && (
        <>
        <mesh position={[0, 0, 0.015]} scale={[1.04, 1.04, 1]}>
          <planeGeometry args={[d.flatW, d.flatH]} />
          <meshBasicMaterial ref={frameMaterial} color="#FF4FA3" transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[d.flatW, d.flatH]} />
          <meshBasicMaterial ref={flatMaterial} map={flatTex} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>
        </>
      )}
    </group>
  );
}

function PhotoSpace({ hidden = false }: { hidden?: boolean }) {
  const { size } = useThree();
  const viewportAspect = size.width / size.height;
  const { data, total } = useMemo(() => buildData(viewportAspect), [viewportAspect]);
  const root = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (root.current) root.current.visible = !hidden;
    if (hidden) return;
    if (root.current) {
      if (S.gallery < 0.02) {
        root.current.rotation.y += dt * 0.28 * clamp(S.sphere, 0, 1);
      } else {
        root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, 0, 4, dt);
      }
    }
    if (core.current) {
      core.current.visible = S.sphere > 0.985 && S.gallery < 0.02;
    }
  });
  return (
    <group ref={root}>
      <mesh ref={core} renderOrder={-1} visible={false}>
        <sphereGeometry args={[SPHERE_RADIUS * 0.985, 48, 32]} />
        <meshBasicMaterial color="#0B0614" side={THREE.BackSide} />
      </mesh>
      {data.map((d) => <PhotoItem key={d.i} d={d} n={total} />)}
    </group>
  );
}

// ========== 6. BỨC THƯ ==========

function FlowerGarden() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute left-1/2 top-[3%] h-44 w-64 -translate-x-1/2 sm:top-[5%] sm:h-56 sm:w-80"
        initial={{ opacity: 0, scale: 0.55, y: -35, rotate: -5 }}
        animate={{ opacity: 1, scale: [1, 1.04, 1], y: [0, -8, 0], rotate: [-2, 2, -2] }}
        transition={{
          opacity: { duration: 1.1, ease: "easeOut" },
          scale: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 },
          y: { duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 1 },
          rotate: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 },
        }}
      >
        <span className="absolute inset-4 rounded-full bg-[#FF70B0]/35 blur-2xl" />
        <img
          src="/real-bouquet.png"
          alt=""
          className="relative h-full w-full object-contain mix-blend-screen drop-shadow-[0_12px_18px_rgba(255,79,163,.65)]"
        />
        <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/30" />
      </motion.div>
    </div>
  );
}

function Letter({ onRestart, onClose }: { onRestart: () => void; onClose: () => void }) {
  const card = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const full = LETTER.lines.join("\n\n");
  const [n, setN] = useState(0);
  const [started, setStarted] = useState(false);
  const done = n >= full.length;

  // thư scale từ nhỏ, nghiêng nhẹ rồi ổn định
  useEffect(() => {
    const tw = gsap.fromTo(
      card.current,
      { scale: 0.25, rotate: -9, y: 60, opacity: 0 },
      { scale: 1, rotate: 0, y: 0, opacity: 1, duration: 1.4, ease: "back.out(1.3)", onComplete: () => setStarted(true) }
    );
    return () => { tw.kill(); };
  }, []);

  // đánh máy chậm, nghỉ ở dấu câu
  useEffect(() => {
    if (!started || done) return;
    const ch = full[n - 1] ?? "";
    const t = setTimeout(() => setN(n + 1), /[.!?]/.test(ch) ? 380 : ch === "," ? 160 : 34);
    return () => clearTimeout(t);
  }, [started, n, done, full]);

  useEffect(() => {
    const element = content.current;
    if (!element) return;
    requestAnimationFrame(() => {
      element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
    });
  }, [n, done]);

  return (
    <div className="absolute inset-0 z-10 grid place-items-center overflow-hidden px-4 py-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div
        ref={card}
        className="relative z-20 h-[min(94dvh,52rem)] w-[min(92vw,37rem)] overflow-hidden rounded-[0.35rem] border-0 bg-white text-[#5A2346] opacity-0 shadow-[0_30px_80px_rgba(255,79,163,.35)]"
        style={{
          backgroundImage: "url('/letter-template-right.png')",
          backgroundSize: "108% 104%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div ref={content} className="absolute inset-x-[8%] bottom-[13%] top-[50%] overflow-y-auto overscroll-contain pb-14 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <h2 className="text-center text-2xl leading-tight text-[#C0306F] sm:text-3xl" style={{ fontFamily: "var(--font-great-vibes), cursive" }}>
          {LETTER.title}
        </h2>

        {/* giữ chỗ bằng chữ trong suốt để khung thư không bị nhảy khi gõ */}
        <p className="mt-3 whitespace-pre-wrap text-[0.78rem] leading-[1.38] text-[#673653] sm:text-[0.9rem] sm:leading-[1.45]" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
          {full.slice(0, n)}
          {!done && started && <span className="ml-0.5 inline-block h-[1.1em] w-[2px] animate-pulse bg-[#C0306F] align-middle" />}
        </p>

        {done && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
            <p className="mt-3 text-right text-3xl text-[#C0306F]" style={{ fontFamily: "var(--font-great-vibes), cursive" }}>
              {LETTER.signature}
            </p>
            {LETTER.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={LETTER.photo}
                alt="Kỷ niệm"
                onError={(e) => (e.currentTarget.style.display = "none")}
                className="mt-6 max-h-72 w-full rounded-xl object-cover shadow-lg"
              />
            )}
          </motion.div>
        )}
        </div>
        {done && (
          <div className="absolute inset-x-[5%] bottom-[2.5%] z-30 flex flex-wrap justify-center gap-2">
            <button onClick={onRestart} className="inline-flex items-center gap-1.5 rounded-full bg-[#C0306F] px-4 py-2 text-xs font-medium text-white shadow-lg transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C0306F]">
              <RotateCcw className="h-4 w-4" aria-hidden /> Đọc lại từ đầu
            </button>
            <button onClick={onClose} className="rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-[#8A2656] shadow-lg transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C0306F]">
              Về trang chủ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== 7. ĐIỀU PHỐI (timeline) ==========


// Camera: parallax theo con trỏ/chạm, lùi xa hơn trên màn hình dọc, bay xuyên không gian ảnh
function Rig() {
  useFrame(({ camera, pointer, size, clock }) => {
    const k = size.width / size.height < 0.8 ? 1.3 : 1;
    const t = clock.elapsedTime;
    const galleryLock = 1 - clamp(S.gallery, 0, 1);
    camera.position.x += (pointer.x * 0.8 * galleryLock + Math.sin(t * 0.25) * S.sway * galleryLock - camera.position.x) * 0.04;
    camera.position.y += (pointer.y * 0.5 * galleryLock + Math.cos(t * 0.2) * S.sway * 0.4 * galleryLock - camera.position.y) * 0.04;
    camera.position.z = S.camZ * k;
    camera.lookAt(0, 0, S.lookZ);
  });
  return null;
}

export default function GiftExperience({ onClose, audioRef }: {
  onClose: () => void;
  audioRef?: RefObject<HTMLAudioElement | null>;
}) {
  const root = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const bouquetImage = useRef<HTMLImageElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [letter, setLetter] = useState(false);
  const [caption, setCaption] = useState("");
  const [typedCaption, setTypedCaption] = useState("");
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setTypedCaption("");
    if (!caption) return;
    let position = 0;
    const timer = window.setInterval(() => {
      position += 1;
      setTypedCaption(caption.slice(0, position));
      if (position >= caption.length) window.clearInterval(timer);
    }, 46);
    return () => window.clearInterval(timer);
  }, [caption]);

  // tự giảm tải trên điện thoại
  const mobile = useMemo(
    () => typeof window !== "undefined" && (window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent)),
    []
  );
  const counts = mobile ? { particles: 1400, stars: 900, glints: 120, photos: 36 } : { particles: 3000, stars: 1800, glints: 260, photos: 64 };

  const play = useCallback(() => {
    tlRef.current?.kill();
    resetState();
    gsap.set(root.current, { clipPath: "circle(0% at 50% 82%)" });

    const tl = gsap.timeline();
    tlRef.current = tl;
    const to = (v: Partial<typeof S>, d: number, at: number, ease = "power2.inOut") => tl.to(S, { ...v, duration: d, ease }, at);

    // Mở quà: vòng tối phóng ra từ vị trí nút + chớp sáng hồng
    tl.to(root.current, { clipPath: "circle(150% at 50% 82%)", duration: 1.2, ease: "power3.in" }, 0);
    tl.fromTo(flash.current, { opacity: 0 }, { opacity: 1, duration: 0.4, yoyo: true, repeat: 1, ease: "power1.out" }, 0.3);

    // Scene 2: bụi sao hội tụ, vùng sáng tăng dần
    to({ stars: 1 }, 2, 0.6);
    to({ converge: 1, glow: 1 }, 6, 1);
    to({ camZ: 8 }, 6, 1);

    // Scene 3: dải sáng -> xoắn ốc -> bó hoa hiện dần
    to({ streak: 1 }, 1.2, 7.2, "power2.out");
    to({ spiral: 1 }, 2.4, 7.8);
    to({ streak: 0 }, 0.8, 8.6);
    to({ bouquet: 1 }, 2.8, 8.5, "power2.out");
    to({ vis: 0.55, fall: 1 }, 2, 9.8);

    // Scene 4: hoa tan đi, ảnh lần lượt hiện, gom thành quả cầu
    to({ bouquet: 0 }, 1.6, 16.5, "power2.in");
    to({ spiral: 0, fall: 0, vis: 0.35 }, 2, 16.5);
    to({ photos: 1, camZ: 7.5 }, 3.8, 17.2, "power1.inOut");
    to({ sphere: 1, camZ: 6.8 }, 5.4, 20.8, "power3.inOut");
    to({ impact: 1 }, 0.12, 26.05, "power2.out");
    to({ impact: 0 }, 0.55, 26.17, "power2.inOut");

    // Scene 5: ảnh tách khỏi quả cầu, camera mở rộng rồi bay xuyên không gian ảnh
    to({ gallery: 1, camZ: 11, lookZ: 0, sway: 0 }, 4, 28.8);
    to({ camZ: 11, lookZ: 0, sway: 0 }, 9, 32.8, "sine.inOut");
    to({ photoVis: 0, glow: 0, vis: 0.2 }, 2.2, 41.3, "power1.in");

    // Scene 6: thư
    tl.call(() => {
      S.photoVis = 0;
      S.glow = 0;
      setCaption("");
      setTypedCaption("");
      setLetter(true);
    }, undefined, 44.2);

    CAPTIONS.forEach((c) => {
      tl.call(() => setCaption(c.text), undefined, c.at);
      tl.call(() => setCaption(""), undefined, c.at + 4.2);
    });
  }, []);

  useEffect(() => {
    play();
    return () => { tlRef.current?.kill(); resetState(); };
  }, [play]);

  const skip = () => {
    tlRef.current?.kill();
    Object.assign(S, { photoVis: 0, glow: 0, bouquet: 0, streak: 0, vis: 0.2, stars: 1 });
    setCaption("");
    setTypedCaption("");
    setLetter(true);
  };
  const restart = () => { setLetter(false); play(); };
  const toggleMusic = () => {
    const a = audioRef?.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    a.muted = !a.muted;
    setMuted(a.muted);
  };

  return (
    <div ref={root} className="fixed inset-0 z-[100] bg-[#03020A] text-[#FFF4FC]" style={{ clipPath: "circle(0% at 50% 82%)" }}>
      <Canvas
        flat
        dpr={[1, mobile ? 1.5 : 2]}
        camera={{ position: [0, 0, 11], fov: 50, near: 0.1, far: 120 }}
        gl={{ antialias: !mobile, powerPreference: "high-performance" }}
        className="!absolute inset-0 touch-none"
      >
        <color attach="background" args={["#05030B"]} />
        <fog attach="fog" args={["#05030B", 12, 40]} />
        <ambientLight intensity={0.7} color="#FFE6F3" />
        <directionalLight position={[3, 5, 4]} intensity={1.6} color="#FFF4FC" />
        <pointLight position={[0, 1, 3.5]} intensity={30} color="#FF4FA3" />
        <Rig />
        <Starfield count={counts.stars} rMin={30} rMax={70} size={0.2} color="#FFF4FC" opacity={() => S.stars * 0.8} />
        <Starfield count={counts.glints} rMin={4} rMax={16} size={0.07} color="#FFC6E5" opacity={() => S.gallery * 0.7 * S.photoVis} />
        <CoreGlow />
        <NebulaParticles count={counts.particles} />
        <Streaks />
        <RealBouquetScene bouquet={bouquetImage} />
        <PhotoSpace hidden={letter} />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center">
        <img
          ref={bouquetImage}
          src="/real-bouquet.png"
          alt=""
          className="h-[min(62vw,520px)] w-[min(78vw,680px)] object-contain mix-blend-screen opacity-0 drop-shadow-[0_0_28px_rgba(255,79,163,.75)]"
        />
      </div>

      <div
        ref={flash}
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{ background: "radial-gradient(circle at 50% 82%, rgba(255,120,190,.9), rgba(167,139,250,.35) 40%, transparent 70%)" }}
      />

      <AnimatePresence mode="wait">
        {!letter && typedCaption && (
          <motion.p
            key={caption}
            initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="pointer-events-none absolute inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-[4] flex justify-center px-3 text-center text-base leading-snug text-[#FFE3F0] drop-shadow-[0_2px_14px_rgba(255,79,163,.75)] sm:px-6 sm:text-2xl sm:leading-relaxed"
            style={{ fontFamily: "var(--font-script), cursive" }}
          >
            <span className="inline-block max-w-[min(94vw,52rem)] whitespace-normal break-words rounded-2xl border border-[#FFC6E5]/25 bg-[#180919]/75 px-4 py-2.5 backdrop-blur-[5px] sm:px-6 sm:py-3">
              {typedCaption.split("").map((character, index) => (
                <motion.span
                  key={`${caption}-${index}`}
                  initial={{ opacity: 0, y: 7, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                >
                  {character === " " ? "\u00A0" : character}
                </motion.span>
              ))}
              <motion.span
                className="ml-1 inline-block text-[#FFD1E5]"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                aria-hidden
              >
                |
              </motion.span>
            </span>
          </motion.p>
        )}
      </AnimatePresence>

      <div className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 flex gap-2">
        {audioRef && (
          <button onClick={toggleMusic} aria-label={muted ? "Bật nhạc" : "Tắt nhạc"}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFC6E5]">
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        )}
        {!letter && (
          <button onClick={skip} aria-label="Bỏ qua phần mở đầu"
            className="flex h-11 items-center gap-1.5 rounded-full bg-white/10 px-4 text-sm backdrop-blur transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFC6E5]">
            <SkipForward className="h-4 w-4" /> Bỏ qua
          </button>
        )}
      </div>

      {letter && <FlowerGarden />}
      {letter && <Letter onRestart={restart} onClose={onClose} />}
    </div>
  );
}
