import * as THREE from "three";

const GEAR_ANIMATION_MS = 460;

function makeCapsule(radius, length, radialSegments = 28) {
  if (THREE.CapsuleGeometry) {
    return new THREE.CapsuleGeometry(radius, length, 9, radialSegments);
  }
  return new THREE.CylinderGeometry(radius, radius, length + radius * 2, radialSegments);
}

function makeMat(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: options.metalness ?? 0.04,
    roughness: options.roughness ?? 0.56,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    side: options.side ?? THREE.FrontSide,
  });
}

function createMaterials() {
  return {
    yellow: makeMat(0xfacc15, { roughness: 0.34 }),
    yellowDeep: makeMat(0xd59608, { roughness: 0.42 }),
    navy: makeMat(0x102f55, { roughness: 0.72 }),
    navyDark: makeMat(0x0b2038, { roughness: 0.76 }),
    navyPanel: makeMat(0x1d4d78, { roughness: 0.68 }),
    clothHighlight: makeMat(0x38688e, { roughness: 0.7 }),
    skinMale: makeMat(0xd89b6a, { roughness: 0.66 }),
    skinFemale: makeMat(0xe5ad7e, { roughness: 0.64 }),
    hairMale: makeMat(0x2a1a13, { roughness: 0.84 }),
    hairFemale: makeMat(0x5b3426, { roughness: 0.82 }),
    black: makeMat(0x111827, { roughness: 0.5 }),
    rubber: makeMat(0x475569, { roughness: 0.5 }),
    glove: makeMat(0x242b36, { roughness: 0.5 }),
    bootLeather: makeMat(0x70441f, { roughness: 0.42 }),
    bootToe: makeMat(0x1f2937, { roughness: 0.48 }),
    reflective: makeMat(0xf8fafc, { metalness: 0.16, roughness: 0.2 }),
    visor: makeMat(0x9bdcf7, { transparent: true, opacity: 0.34, roughness: 0.08, side: THREE.DoubleSide }),
    glass: makeMat(0xdff5ff, { transparent: true, opacity: 0.5, roughness: 0.06, side: THREE.DoubleSide }),
    mask: makeMat(0xdbe3ec, { roughness: 0.42 }),
    seam: makeMat(0x8fb4cf, { roughness: 0.72 }),
  };
}

function prepareGearMesh(mesh, gearKind = "") {
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  if (gearKind) {
    mesh.userData.gearKind = gearKind;
    mesh.userData.startAt = performance.now();
    mesh.userData.targetScale = mesh.scale.clone();
    mesh.scale.multiplyScalar(0.05);
    if (mesh.material) {
      mesh.material = mesh.material.clone();
      mesh.material.transparent = true;
      mesh.material.opacity = 0;
    }
  }
  return mesh;
}

function addMesh(parent, geometry, material, position, scale = [1, 1, 1], rotation = [0, 0, 0], gearKind = "") {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.rotation.set(...rotation);
  parent.add(prepareGearMesh(mesh, gearKind));
  return mesh;
}

function addBox(parent, size, material, position, scale = [1, 1, 1], rotation = [0, 0, 0], gearKind = "") {
  return addMesh(parent, new THREE.BoxGeometry(...size), material, position, scale, rotation, gearKind);
}

function addSphere(parent, radius, material, position, scale = [1, 1, 1], rotation = [0, 0, 0], gearKind = "") {
  return addMesh(parent, new THREE.SphereGeometry(radius, 36, 24), material, position, scale, rotation, gearKind);
}

function addCylinder(parent, radiusTop, radiusBottom, height, material, position, scale = [1, 1, 1], rotation = [0, 0, 0], gearKind = "") {
  return addMesh(parent, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 40), material, position, scale, rotation, gearKind);
}

function addCapsule(parent, radius, length, material, position, scale = [1, 1, 1], rotation = [0, 0, 0], gearKind = "") {
  return addMesh(parent, makeCapsule(radius, length), material, position, scale, rotation, gearKind);
}

function addTube(parent, points, radius, material, gearKind = "") {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
  return addMesh(parent, new THREE.TubeGeometry(curve, 32, radius, 10, false), material, [0, 0, 0], [1, 1, 1], [0, 0, 0], gearKind);
}

function addPanel(parent, width, height, material, position, scale = [1, 1, 1], rotation = [0, 0, 0], gearKind = "") {
  return addMesh(parent, new THREE.PlaneGeometry(width, height), material, position, scale, rotation, gearKind);
}

function skinFor(profile, materials) {
  return profile.gender === "female" ? materials.skinFemale : materials.skinMale;
}

function hairFor(profile, materials) {
  return profile.gender === "female" ? materials.hairFemale : materials.hairMale;
}

function addFace(worker, profile, materials) {
  const skin = skinFor(profile, materials);
  const hair = hairFor(profile, materials);
  const faceY = 3.02;
  const headScale = profile.gender === "female" ? [0.82, 1.04, 0.74] : [0.88, 1.08, 0.78];

  addSphere(worker, 0.28, skin, [0, faceY, 0.05], headScale);
  addSphere(worker, 0.052, skin, [-0.245, faceY - 0.005, 0.035], [0.72, 1, 0.52]);
  addSphere(worker, 0.052, skin, [0.245, faceY - 0.005, 0.035], [0.72, 1, 0.52]);
  addBox(worker, [0.042, 0.12, 0.045], skin, [0, faceY - 0.03, 0.275], [1, 1, 1], [0.16, 0, 0]);
  addBox(worker, [0.14, 0.014, 0.014], materials.black, [0, faceY - 0.18, 0.285]);

  addSphere(worker, 0.025, materials.black, [-0.09, faceY + 0.045, 0.27], [1, 1, 0.42]);
  addSphere(worker, 0.025, materials.black, [0.09, faceY + 0.045, 0.27], [1, 1, 0.42]);
  addBox(worker, [0.13, 0.013, 0.014], materials.black, [-0.095, faceY + 0.105, 0.28], [1, 1, 1], [0, 0, -0.09]);
  addBox(worker, [0.13, 0.013, 0.014], materials.black, [0.095, faceY + 0.105, 0.28], [1, 1, 1], [0, 0, 0.09]);
  addSphere(worker, 0.018, makeMat(0xeeb889, { roughness: 0.6 }), [-0.11, faceY - 0.06, 0.29], [1.4, 0.75, 0.32]);
  addSphere(worker, 0.018, makeMat(0xeeb889, { roughness: 0.6 }), [0.11, faceY - 0.06, 0.29], [1.4, 0.75, 0.32]);

  if (profile.gender === "female") {
    addSphere(worker, 0.31, hair, [0, 3.08, -0.055], [0.92, 1.0, 0.68]);
    addSphere(worker, 0.16, hair, [-0.2, 2.84, -0.02], [0.72, 1.55, 0.52]);
    addSphere(worker, 0.16, hair, [0.2, 2.84, -0.02], [0.72, 1.55, 0.52]);
    addSphere(worker, 0.16, hair, [0, 2.72, -0.1], [0.9, 1.3, 0.62]);
  } else {
    addMesh(worker, new THREE.SphereGeometry(0.295, 36, 16, 0, Math.PI * 2, 0, Math.PI / 2), hair, [0, 3.14, 0.02], [0.96, 0.58, 0.78]);
    addSphere(worker, 0.2, hair, [0, 2.88, 0.08], [0.82, 0.28, 0.68]);
    addBox(worker, [0.19, 0.045, 0.018], hair, [-0.09, 2.89, 0.292], [1, 1, 1], [0, 0, -0.04]);
    addBox(worker, [0.19, 0.045, 0.018], hair, [0.09, 2.89, 0.292], [1, 1, 1], [0, 0, 0.04]);
  }
}

function addUniformDetails(worker, profile, materials) {
  const shoulderWidth = profile.gender === "female" ? 0.78 : 0.9;
  addBox(worker, [0.025, 0.88, 0.026], materials.seam, [0, 2.03, 0.35]);
  addBox(worker, [0.32, 0.028, 0.03], materials.seam, [-0.2, 2.43, 0.34], [1, 1, 1], [0, 0, 0.08]);
  addBox(worker, [0.32, 0.028, 0.03], materials.seam, [0.2, 2.43, 0.34], [1, 1, 1], [0, 0, -0.08]);
  addBox(worker, [0.2, 0.13, 0.028], materials.navyDark, [-0.2, 2.26, 0.365]);
  addBox(worker, [0.2, 0.13, 0.028], materials.navyDark, [0.2, 2.26, 0.365]);
  addBox(worker, [shoulderWidth, 0.035, 0.028], materials.clothHighlight, [0, 2.5, 0.315]);
  addBox(worker, [0.23, 0.21, 0.03], materials.navyPanel, [-0.24, 1.0, 0.26]);
  addBox(worker, [0.23, 0.21, 0.03], materials.navyPanel, [0.24, 1.0, 0.26]);
  addBox(worker, [0.18, 0.03, 0.03], materials.seam, [-0.17, 0.74, 0.26]);
  addBox(worker, [0.18, 0.03, 0.03], materials.seam, [0.17, 0.74, 0.26]);
  addBox(worker, [0.17, 0.018, 0.03], materials.seam, [-0.6, 1.82, 0.12], [1, 1, 1], [0, 0, 0.1]);
  addBox(worker, [0.17, 0.018, 0.03], materials.seam, [0.6, 1.82, 0.12], [1, 1, 1], [0, 0, -0.1]);
}

function addBaseWorker(root, profile, x, materials) {
  const worker = new THREE.Group();
  worker.position.set(x, 0.02, 0);
  worker.userData.phase = profile.phase;
  root.add(worker);

  const skin = skinFor(profile, materials);
  const shoulder = profile.gender === "female" ? 0.43 : 0.5;
  const waist = profile.gender === "female" ? 0.31 : 0.39;
  const torsoScale = profile.gender === "female" ? [0.9, 1.18, 0.55] : [1, 1.2, 0.58];
  const legX = profile.gender === "female" ? 0.16 : 0.18;

  addCylinder(worker, 0.11, 0.12, 0.22, skin, [0, 2.61, 0.02], [1, 1, 0.78]);
  addSphere(worker, 0.48, materials.navy, [0, 2.05, 0], torsoScale);
  addCylinder(worker, shoulder, waist, 1.02, materials.navy, [0, 2.03, 0.02], [1, 1, 0.58]);
  addSphere(worker, 0.36, materials.navyPanel, [0, 2.5, 0.03], [1.2, 0.34, 0.52]);
  addBox(worker, [0.28, 0.13, 0.06], materials.navyDark, [-0.11, 2.55, 0.31], [1, 1, 1], [0, 0, -0.2]);
  addBox(worker, [0.28, 0.13, 0.06], materials.navyDark, [0.11, 2.55, 0.31], [1, 1, 1], [0, 0, 0.2]);

  addSphere(worker, 0.14, materials.navyPanel, [-shoulder - 0.04, 2.35, 0.02], [1, 1, 0.82]);
  addSphere(worker, 0.14, materials.navyPanel, [shoulder + 0.04, 2.35, 0.02], [1, 1, 0.82]);
  addCapsule(worker, 0.08, 0.68, materials.navyPanel, [-shoulder - 0.12, 1.96, 0.02], [1, 1, 0.82], [0, 0, -0.18]);
  addCapsule(worker, 0.08, 0.68, materials.navyPanel, [shoulder + 0.12, 1.96, 0.02], [1, 1, 0.82], [0, 0, 0.18]);
  addSphere(worker, 0.082, materials.navyDark, [-shoulder - 0.2, 1.58, 0.06], [1, 1, 0.78]);
  addSphere(worker, 0.082, materials.navyDark, [shoulder + 0.2, 1.58, 0.06], [1, 1, 0.78]);
  addCapsule(worker, 0.071, 0.5, materials.navy, [-shoulder - 0.2, 1.34, 0.08], [1, 1, 0.84], [0, 0, 0.08]);
  addCapsule(worker, 0.071, 0.5, materials.navy, [shoulder + 0.2, 1.34, 0.08], [1, 1, 0.84], [0, 0, -0.08]);
  addSphere(worker, 0.09, skin, [-shoulder - 0.2, 1.06, 0.13], [0.95, 1.05, 0.72]);
  addSphere(worker, 0.09, skin, [shoulder + 0.2, 1.06, 0.13], [0.95, 1.05, 0.72]);

  addCapsule(worker, 0.13, 1.12, materials.navy, [-legX, 0.91, 0.01], [0.84, 1, 0.72], [0, 0, -0.035]);
  addCapsule(worker, 0.13, 1.12, materials.navy, [legX, 0.91, 0.01], [0.84, 1, 0.72], [0, 0, 0.035]);
  addBox(worker, [0.17, 0.22, 0.025], materials.clothHighlight, [-legX, 0.58, 0.205]);
  addBox(worker, [0.17, 0.22, 0.025], materials.clothHighlight, [legX, 0.58, 0.205]);
  addBox(worker, [0.22, 0.2, 0.035], materials.navyPanel, [-0.29, 1.05, 0.22]);
  addBox(worker, [0.22, 0.2, 0.035], materials.navyPanel, [0.29, 1.05, 0.22]);
  addBox(worker, [0.3, 0.16, 0.18], materials.bootLeather, [-legX, 0.19, 0.12], [1, 1, 1], [0, 0, -0.02]);
  addBox(worker, [0.3, 0.16, 0.18], materials.bootLeather, [legX, 0.19, 0.12], [1, 1, 1], [0, 0, 0.02]);
  addSphere(worker, 0.14, materials.bootToe, [-legX, 0.17, 0.23], [1.28, 0.45, 0.72]);
  addSphere(worker, 0.14, materials.bootToe, [legX, 0.17, 0.23], [1.28, 0.45, 0.72]);
  addBox(worker, [0.38, 0.046, 0.24], materials.bootToe, [-legX, 0.075, 0.13]);
  addBox(worker, [0.38, 0.046, 0.24], materials.bootToe, [legX, 0.075, 0.13]);

  addUniformDetails(worker, profile, materials);
  addFace(worker, profile, materials);

  return worker;
}

function addHelmet(worker, materials) {
  addMesh(worker, new THREE.SphereGeometry(0.31, 44, 18, 0, Math.PI * 2, 0, Math.PI / 2), materials.yellow, [0, 3.19, 0.02], [1.14, 0.56, 0.92], [0, 0, 0], "helmet");
  addMesh(worker, new THREE.TorusGeometry(0.245, 0.025, 10, 44, Math.PI), materials.yellowDeep, [0, 3.13, 0.225], [1.35, 0.65, 0.34], [Math.PI / 2, 0, 0], "helmet");
  addBox(worker, [0.68, 0.055, 0.16], materials.yellowDeep, [0, 3.115, 0.23], [1, 1, 1], [0, 0, 0], "helmet");
  addBox(worker, [0.04, 0.18, 0.032], materials.yellowDeep, [0, 3.21, 0.24], [1, 1, 1], [0, 0, 0], "helmet");
  addBox(worker, [0.5, 0.034, 0.026], materials.yellowDeep, [0, 3.1, -0.13], [1, 1, 1], [0, 0, 0], "helmet");
}

function addCap(worker, materials) {
  addMesh(worker, new THREE.SphereGeometry(0.29, 38, 14, 0, Math.PI * 2, 0, Math.PI / 2), materials.yellow, [0, 3.16, 0.02], [1.04, 0.43, 0.88], [0, 0, 0], "cap");
  addSphere(worker, 0.12, materials.yellowDeep, [0.1, 3.08, 0.24], [1.8, 0.23, 0.76], [0, 0, 0], "cap");
}

function addGlasses(worker, materials) {
  const torus = new THREE.TorusGeometry(0.074, 0.01, 10, 28);
  addMesh(worker, torus, materials.black, [-0.1, 3.03, 0.3], [1.45, 0.78, 0.35], [0, 0, 0], "glasses");
  addMesh(worker, torus, materials.black, [0.1, 3.03, 0.3], [1.45, 0.78, 0.35], [0, 0, 0], "glasses");
  addBox(worker, [0.09, 0.012, 0.018], materials.black, [0, 3.03, 0.305], [1, 1, 1], [0, 0, 0], "glasses");
  addBox(worker, [0.15, 0.075, 0.012], materials.glass, [-0.1, 3.03, 0.312], [1, 1, 1], [0, 0, 0], "glasses");
  addBox(worker, [0.15, 0.075, 0.012], materials.glass, [0.1, 3.03, 0.312], [1, 1, 1], [0, 0, 0], "glasses");
  addTube(worker, [[-0.18, 3.03, 0.3], [-0.31, 3.02, 0.13]], 0.009, materials.black, "glasses");
  addTube(worker, [[0.18, 3.03, 0.3], [0.31, 3.02, 0.13]], 0.009, materials.black, "glasses");
}

function addFaceShield(worker, materials) {
  addBox(worker, [0.5, 0.038, 0.038], materials.black, [0, 3.16, 0.32], [1, 1, 1], [0, 0, 0], "faceShield");
  addPanel(worker, 0.56, 0.55, materials.visor, [0, 2.94, 0.35], [1, 1, 1], [-0.06, 0, 0], "faceShield");
  addBox(worker, [0.48, 0.018, 0.016], materials.reflective, [0, 3.05, 0.365], [1, 1, 1], [0, 0, 0], "faceShield");
}

function addMask(worker, materials, respirator = false) {
  const gear = respirator ? "respirator" : "mask";
  addSphere(worker, respirator ? 0.145 : 0.125, materials.mask, [0, 2.88, 0.33], [1.18, 0.65, 0.48], [0, 0, 0], gear);
  addTube(worker, [[-0.17, 2.9, 0.32], [-0.28, 2.96, 0.09]], 0.01, materials.rubber, gear);
  addTube(worker, [[0.17, 2.9, 0.32], [0.28, 2.96, 0.09]], 0.01, materials.rubber, gear);
  addBox(worker, [0.22, 0.018, 0.025], materials.rubber, [0, 2.88, 0.43], [1, 1, 1], [0, 0, 0], gear);
  if (respirator) {
    addSphere(worker, 0.065, materials.rubber, [-0.18, 2.86, 0.36], [1, 1, 0.7], [0, 0, 0], gear);
    addSphere(worker, 0.065, materials.rubber, [0.18, 2.86, 0.36], [1, 1, 0.7], [0, 0, 0], gear);
    addCylinder(worker, 0.045, 0.045, 0.07, materials.black, [-0.18, 2.86, 0.41], [1, 1, 1], [Math.PI / 2, 0, 0], gear);
    addCylinder(worker, 0.045, 0.045, 0.07, materials.black, [0.18, 2.86, 0.41], [1, 1, 1], [Math.PI / 2, 0, 0], gear);
  }
}

function addEarmuffs(worker, materials) {
  addTube(worker, [[-0.3, 3.08, 0.03], [-0.22, 3.34, 0.02], [0, 3.42, 0.02], [0.22, 3.34, 0.02], [0.3, 3.08, 0.03]], 0.018, materials.black, "earmuffs");
  addSphere(worker, 0.108, materials.yellow, [-0.335, 3.02, 0.04], [0.75, 1.1, 0.72], [0, 0, 0], "earmuffs");
  addSphere(worker, 0.108, materials.yellow, [0.335, 3.02, 0.04], [0.75, 1.1, 0.72], [0, 0, 0], "earmuffs");
  addSphere(worker, 0.078, materials.rubber, [-0.36, 2.99, 0.075], [0.75, 1, 0.62], [0, 0, 0], "earmuffs");
  addSphere(worker, 0.078, materials.rubber, [0.36, 2.99, 0.075], [0.75, 1, 0.62], [0, 0, 0], "earmuffs");
}

function addVest(worker, materials) {
  addBox(worker, [0.26, 0.86, 0.052], materials.yellow, [-0.16, 2.06, 0.42], [1, 1, 1], [0, 0, -0.035], "vest");
  addBox(worker, [0.26, 0.86, 0.052], materials.yellow, [0.16, 2.06, 0.42], [1, 1, 1], [0, 0, 0.035], "vest");
  addBox(worker, [0.59, 0.054, 0.06], materials.reflective, [0, 2.14, 0.455], [1, 1, 1], [0, 0, 0], "vest");
  addBox(worker, [0.56, 0.054, 0.06], materials.reflective, [0, 1.84, 0.455], [1, 1, 1], [0, 0, 0], "vest");
  addBox(worker, [0.046, 0.76, 0.06], materials.reflective, [-0.21, 2.08, 0.465], [1, 1, 1], [0, 0, -0.02], "vest");
  addBox(worker, [0.046, 0.76, 0.06], materials.reflective, [0.21, 2.08, 0.465], [1, 1, 1], [0, 0, 0.02], "vest");
  addBox(worker, [0.024, 0.86, 0.062], materials.yellowDeep, [0, 2.04, 0.47], [1, 1, 1], [0, 0, 0], "vest");
}

function addCoverall(worker, materials) {
  const coverMat = makeMat(0xcffafe, { transparent: true, opacity: 0.38, roughness: 0.42 });
  addCylinder(worker, 0.49, 0.39, 1.16, coverMat, [0, 2.02, 0.41], [1, 1, 0.18], [0, 0, 0], "coverall");
  addBox(worker, [0.56, 0.046, 0.056], materials.reflective, [0, 1.92, 0.5], [1, 1, 1], [0, 0, 0], "coverall");
  addBox(worker, [0.18, 0.66, 0.045], coverMat, [-0.18, 0.86, 0.28], [1, 1, 1], [0, 0, -0.02], "coverall");
  addBox(worker, [0.18, 0.66, 0.045], coverMat, [0.18, 0.86, 0.28], [1, 1, 1], [0, 0, 0.02], "coverall");
}

function addHarness(worker, materials) {
  addBox(worker, [0.056, 0.94, 0.065], materials.yellow, [-0.18, 2.08, 0.5], [1, 1, 1], [0, 0, -0.27], "harness");
  addBox(worker, [0.056, 0.94, 0.065], materials.yellow, [0.18, 2.08, 0.5], [1, 1, 1], [0, 0, 0.27], "harness");
  addBox(worker, [0.57, 0.056, 0.065], materials.yellow, [0, 1.82, 0.51], [1, 1, 1], [0, 0, 0], "harness");
  addMesh(worker, new THREE.TorusGeometry(0.08, 0.014, 12, 30), materials.black, [0, 1.91, 0.55], [1, 1, 0.3], [0, 0, 0], "harness");
}

function addGloves(worker, materials) {
  addSphere(worker, 0.106, materials.glove, [-0.7, 1.06, 0.18], [1.08, 1.12, 0.8], [0, 0, 0], "gloves");
  addSphere(worker, 0.106, materials.glove, [0.7, 1.06, 0.18], [1.08, 1.12, 0.8], [0, 0, 0], "gloves");
  addBox(worker, [0.18, 0.056, 0.045], materials.black, [-0.68, 1.17, 0.16], [1, 1, 1], [0, 0, -0.08], "gloves");
  addBox(worker, [0.18, 0.056, 0.045], materials.black, [0.68, 1.17, 0.16], [1, 1, 1], [0, 0, 0.08], "gloves");
  [-0.745, -0.705, -0.665].forEach((x) => addCapsule(worker, 0.015, 0.07, materials.glove, [x, 0.99, 0.225], [1, 1, 0.7], [0.2, 0, 0], "gloves"));
  [0.745, 0.705, 0.665].forEach((x) => addCapsule(worker, 0.015, 0.07, materials.glove, [x, 0.99, 0.225], [1, 1, 0.7], [0.2, 0, 0], "gloves"));
}

function addBoots(worker, materials) {
  addBox(worker, [0.38, 0.15, 0.23], materials.bootLeather, [-0.18, 0.2, 0.22], [1, 1, 1], [0, 0, -0.02], "boots");
  addBox(worker, [0.38, 0.15, 0.23], materials.bootLeather, [0.18, 0.2, 0.22], [1, 1, 1], [0, 0, 0.02], "boots");
  addSphere(worker, 0.16, materials.bootToe, [-0.18, 0.18, 0.34], [1.36, 0.44, 0.72], [0, 0, 0], "boots");
  addSphere(worker, 0.16, materials.bootToe, [0.18, 0.18, 0.34], [1.36, 0.44, 0.72], [0, 0, 0], "boots");
  addBox(worker, [0.45, 0.05, 0.27], materials.bootToe, [-0.18, 0.076, 0.23], [1, 1, 1], [0, 0, 0], "boots");
  addBox(worker, [0.45, 0.05, 0.27], materials.bootToe, [0.18, 0.076, 0.23], [1, 1, 1], [0, 0, 0], "boots");
}

function addKneepads(worker, materials) {
  addBox(worker, [0.21, 0.22, 0.064], materials.glove, [-0.17, 0.9, 0.26], [1, 1, 1], [0, 0, -0.03], "kneepads");
  addBox(worker, [0.21, 0.22, 0.064], materials.glove, [0.17, 0.9, 0.26], [1, 1, 1], [0, 0, 0.03], "kneepads");
  addBox(worker, [0.16, 0.025, 0.07], materials.rubber, [-0.17, 0.93, 0.3], [1, 1, 1], [0, 0, -0.03], "kneepads");
  addBox(worker, [0.16, 0.025, 0.07], materials.rubber, [0.17, 0.93, 0.3], [1, 1, 1], [0, 0, 0.03], "kneepads");
}

function addGear(worker, gearKinds, materials) {
  const kinds = new Set(gearKinds);
  if (kinds.has("coverall")) addCoverall(worker, materials);
  if (kinds.has("vest")) addVest(worker, materials);
  if (kinds.has("harness")) addHarness(worker, materials);
  if (kinds.has("boots")) addBoots(worker, materials);
  if (kinds.has("kneepads")) addKneepads(worker, materials);
  if (kinds.has("gloves")) addGloves(worker, materials);
  if (kinds.has("earmuffs")) addEarmuffs(worker, materials);
  if (kinds.has("helmet")) addHelmet(worker, materials);
  if (kinds.has("cap")) addCap(worker, materials);
  if (kinds.has("faceShield")) addFaceShield(worker, materials);
  if (kinds.has("glasses")) addGlasses(worker, materials);
  if (kinds.has("respirator")) addMask(worker, materials, true);
  if (kinds.has("mask")) addMask(worker, materials, false);
}

export function createOzoWorkerScene({ canvas, stage, gearKinds = [] }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xf8fafc, 7.4, 12);

  const camera = new THREE.OrthographicCamera(-2.8, 2.8, 2.1, -1.95, 0.1, 30);
  camera.position.set(0, 1.78, 7.3);
  camera.lookAt(0, 1.78, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xdbeafe, 1.8));
  const key = new THREE.DirectionalLight(0xffffff, 2.75);
  key.position.set(-2.5, 5.4, 4.4);
  key.castShadow = true;
  key.shadow.mapSize.width = 2048;
  key.shadow.mapSize.height = 2048;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 14;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xb6e3ff, 1.0);
  rim.position.set(3.6, 3.1, 3.8);
  scene.add(rim);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4.4), new THREE.ShadowMaterial({ color: 0x64748b, opacity: 0.18 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 0.16);
  floor.receiveShadow = true;
  scene.add(floor);

  const backPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(5.7, 3.5),
    makeMat(0xe2e8f0, { transparent: true, opacity: 0.18, roughness: 0.8, side: THREE.DoubleSide }),
  );
  backPanel.position.set(0, 2, -0.92);
  scene.add(backPanel);

  const root = new THREE.Group();
  scene.add(root);

  const materials = createMaterials();
  const male = addBaseWorker(root, { gender: "male", phase: 0.1 }, -1.02, materials);
  const female = addBaseWorker(root, { gender: "female", phase: 0.9 }, 1.02, materials);
  addGear(male, gearKinds, materials);
  addGear(female, gearKinds, materials);

  const sizeScene = () => {
    const rect = stage.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect.width));
    const height = Math.max(300, Math.floor(rect.height));
    renderer.setSize(width, height, false);
    const aspect = width / height;
    const frustumHeight = width < 520 ? 3.95 : 3.82;
    camera.top = frustumHeight / 2;
    camera.bottom = -frustumHeight / 2;
    camera.left = (-frustumHeight * aspect) / 2;
    camera.right = (frustumHeight * aspect) / 2;
    camera.updateProjectionMatrix();
  };

  const resizeObserver = new ResizeObserver(sizeScene);
  resizeObserver.observe(stage);
  sizeScene();

  let frameId = 0;
  let disposed = false;
  const gearMeshes = [];
  root.traverse((object) => {
    if (object.isMesh && object.userData.gearKind) gearMeshes.push(object);
  });

  const animate = (time) => {
    if (disposed) return;

    root.children.forEach((worker) => {
      worker.rotation.y = Math.sin(time * 0.00065 + worker.userData.phase) * 0.07;
      worker.position.y = 0.02 + Math.sin(time * 0.001 + worker.userData.phase) * 0.008;
    });

    gearMeshes.forEach((mesh) => {
      const progress = Math.min(1, (performance.now() - mesh.userData.startAt) / GEAR_ANIMATION_MS);
      const eased = 1 - Math.pow(1 - progress, 3);
      mesh.scale.copy(mesh.userData.targetScale).multiplyScalar(0.05 + eased * 0.95);
      if (mesh.material) {
        mesh.material.opacity = eased;
      }
    });

    renderer.render(scene, camera);
    frameId = requestAnimationFrame(animate);
  };
  frameId = requestAnimationFrame(animate);

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material.dispose();
        }
      });
      renderer.dispose();
    },
  };
}
