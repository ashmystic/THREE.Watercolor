/**
 * THREE.Watercolor Fantasy Nature Scene Demo
 * Features: Terrain, Skybox, Clouds, Mushroom Temple, Trees, Mushrooms, Altars
 */

// Global variables
let scene, camera, renderer, composer;
let controls;
let cloudGroup,
  crystals = [];
let animationId;

// Initialize the scene
function init() {
  // Scene setup
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

  // Camera setup
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(30, 25, 30);
  camera.lookAt(0, 0, 0);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById("canvas-container").appendChild(renderer.domElement);

  // Orbit controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 15;
  controls.maxDistance = 100;
  controls.maxPolarAngle = Math.PI / 2.1;

  // Lighting
  setupLighting();

  // Create scene elements
  createSkybox();
  createGround();
  createClouds();
  createMushroomTemple();
  createTrees();
  createMushrooms();
  createAltars();

  // Setup watercolor post-processing
  setupWatercolorEffect();

  // Event listeners
  window.addEventListener("resize", onWindowResize);

  // Hide loading screen
  document.getElementById("loading").classList.add("hidden");

  // Start animation
  animate();
}

// Lighting setup
function setupLighting() {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // Directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xfff8dc, 0.8);
  directionalLight.position.set(50, 80, 30);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.left = -60;
  directionalLight.shadow.camera.right = 60;
  directionalLight.shadow.camera.top = 60;
  directionalLight.shadow.camera.bottom = -60;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 200;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);

  // Hemisphere light for sky gradient
  const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x6b8e23, 0.4);
  scene.add(hemisphereLight);
}

// Create skybox
function createSkybox() {
  const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
  const skyMaterial = new THREE.MeshBasicMaterial({
    color: 0x87ceeb,
    side: THREE.BackSide,
    fog: false,
  });

  // Create gradient effect using vertex colors
  const colors = skyGeometry.attributes.position.array;
  const colorAttribute = new Float32Array(colors.length);

  for (let i = 0; i < colors.length; i += 3) {
    const y = colors[i + 1];
    const t = (y + 500) / 1000; // Normalize to 0-1

    // Gradient from horizon (lighter) to zenith (deeper blue)
    const horizonColor = new THREE.Color(0xb0d4f1);
    const zenithColor = new THREE.Color(0x4a90d9);
    const color = horizonColor.lerp(zenithColor, t);

    colorAttribute[i] = color.r;
    colorAttribute[i + 1] = color.g;
    colorAttribute[i + 2] = color.b;
  }

  skyGeometry.setAttribute(
    "color",
    new THREE.BufferAttribute(colorAttribute, 3)
  );
  skyMaterial.vertexColors = true;

  const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(skyMesh);
}

// Create ground with varied terrain
function createGround() {
  const groundRadius = 40;
  const segments = 64;
  const groundGeometry = new THREE.CircleGeometry(groundRadius, segments);

  // Add height variation
  const positions = groundGeometry.attributes.position.array;
  const colors = new Float32Array(positions.length);

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const distance = Math.sqrt(x * x + y * y);

    // Height variation using noise-like function
    const noise =
      (Math.sin(x * 0.3) + Math.cos(y * 0.3)) * 0.5 +
      (Math.sin(x * 0.7) + Math.cos(y * 0.5)) * 0.3;
    positions[i + 2] = noise * 0.8;

    // Color variation - grass and dirt
    const grassColor = new THREE.Color(0x5d8a3a);
    const dirtColor = new THREE.Color(0x8b7355);
    const darkerGrass = new THREE.Color(0x4a6b2f);

    // Mix colors based on position and noise
    let color;
    const mixFactor = (Math.sin(x * 0.5 + y * 0.7) + 1) * 0.5;
    const noiseFactor = (noise + 1) * 0.5;

    if (mixFactor > 0.7) {
      color = dirtColor;
    } else if (noiseFactor > 0.6) {
      color = darkerGrass;
    } else {
      color = grassColor;
    }

    colors[i] = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;
  }

  groundGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  groundGeometry.computeVertexNormals();

  const groundMaterial = new THREE.MeshLambertMaterial({
    vertexColors: true,
    flatShading: false,
  });

  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
}

// Create floating clouds
function createClouds() {
  cloudGroup = new THREE.Group();

  for (let i = 0; i < 15; i++) {
    const cloud = createCloud();
    const angle = (i / 15) * Math.PI * 2;
    const radius = 30 + Math.random() * 40;

    cloud.position.x = Math.cos(angle) * radius;
    cloud.position.y = 15 + Math.random() * 15;
    cloud.position.z = Math.sin(angle) * radius;
    cloud.scale.setScalar(0.8 + Math.random() * 0.6);

    cloudGroup.add(cloud);
  }

  scene.add(cloudGroup);
}

// Create individual cloud
function createCloud() {
  const cloudGroup = new THREE.Group();
  const cloudMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.7,
  });

  // Create cloud from multiple spheres
  for (let i = 0; i < 5; i++) {
    const geometry = new THREE.SphereGeometry(1 + Math.random(), 8, 8);
    const puff = new THREE.Mesh(geometry, cloudMaterial);
    puff.position.x = (Math.random() - 0.5) * 3;
    puff.position.y = (Math.random() - 0.5) * 1;
    puff.position.z = (Math.random() - 0.5) * 2;
    puff.scale.setScalar(0.8 + Math.random() * 0.4);
    cloudGroup.add(puff);
  }

  return cloudGroup;
}

// Create mushroom temple
function createMushroomTemple() {
  const templeGroup = new THREE.Group();
  templeGroup.position.set(0, 0, 0);

  // First floor - cylinder
  const baseGeometry = new THREE.CylinderGeometry(6, 6.5, 8, 32);
  const baseMaterial = new THREE.MeshPhongMaterial({
    color: 0xd4a574,
    shininess: 10,
  });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = 4;
  base.castShadow = true;
  base.receiveShadow = true;
  templeGroup.add(base);

  // Second floor - dome
  const domeGeometry = new THREE.SphereGeometry(
    5,
    32,
    16,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  );
  const domeMaterial = new THREE.MeshPhongMaterial({
    color: 0xc85a54,
    shininess: 30,
  });
  const dome = new THREE.Mesh(domeGeometry, domeMaterial);
  dome.position.y = 8;
  dome.castShadow = true;
  templeGroup.add(dome);

  // Vesica piscis door
  const door = createVesicaPiscisDoor();
  door.position.set(0, 2.5, 6.5);
  templeGroup.add(door);

  // Stained glass windows on first floor
  const windowPositions = [
    { angle: Math.PI / 2, color: 0x3498db },
    { angle: Math.PI, color: 0xe74c3c },
    { angle: -Math.PI / 2, color: 0xf39c12 },
  ];

  windowPositions.forEach((wp) => {
    const window = createStainedGlassWindow(0.8);
    window.position.x = Math.cos(wp.angle) * 6.3;
    window.position.y = 5;
    window.position.z = Math.sin(wp.angle) * 6.3;
    window.lookAt(0, 5, 0);
    window.children[0].material.color.setHex(wp.color);
    templeGroup.add(window);
  });

  // Stained glass windows on second floor (dome)
  const domeWindowPositions = [
    { angle: 0, color: 0x9b59b6 },
    { angle: (Math.PI * 2) / 3, color: 0x1abc9c },
    { angle: (Math.PI * 4) / 3, color: 0xe67e22 },
  ];

  domeWindowPositions.forEach((wp) => {
    const window = createStainedGlassWindow(0.6);
    window.position.x = Math.cos(wp.angle) * 4.5;
    window.position.y = 9;
    window.position.z = Math.sin(wp.angle) * 4.5;
    window.lookAt(0, 9, 0);
    window.children[0].material.color.setHex(wp.color);
    templeGroup.add(window);
  });

  scene.add(templeGroup);
}

// Create vesica piscis door
function createVesicaPiscisDoor() {
  const doorGroup = new THREE.Group();

  // Create vesica piscis shape using two intersecting circles
  const shape = new THREE.Shape();
  const radius = 1.5;

  // Create the vesica piscis by drawing two arcs
  shape.absarc(-radius / 2, 0, radius, -Math.PI / 3, Math.PI / 3, false);
  shape.absarc(
    radius / 2,
    0,
    radius,
    (Math.PI * 2) / 3,
    (Math.PI * 4) / 3,
    false
  );

  const extrudeSettings = {
    depth: 0.3,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.1,
    bevelSegments: 3,
  };

  const doorGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const doorMaterial = new THREE.MeshPhongMaterial({
    color: 0x6b4423,
    shininess: 20,
  });

  const door = new THREE.Mesh(doorGeometry, doorMaterial);
  door.castShadow = true;
  doorGroup.add(door);

  // Door frame
  const frameGeometry = new THREE.TorusGeometry(1.8, 0.15, 8, 32);
  const frameMaterial = new THREE.MeshPhongMaterial({
    color: 0x8b6914,
    shininess: 50,
  });
  const frame = new THREE.Mesh(frameGeometry, frameMaterial);
  frame.rotation.y = Math.PI / 2;
  frame.position.z = 0.15;
  doorGroup.add(frame);

  return doorGroup;
}

// Create stained glass window
function createStainedGlassWindow(size = 1) {
  const windowGroup = new THREE.Group();

  const windowGeometry = new THREE.CircleGeometry(size, 32);
  const windowMaterial = new THREE.MeshPhongMaterial({
    color: 0x3498db,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
    emissive: 0x3498db,
    emissiveIntensity: 0.3,
    shininess: 100,
  });

  const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
  windowGroup.add(windowMesh);

  // Window frame
  const frameGeometry = new THREE.TorusGeometry(size, 0.08, 8, 32);
  const frameMaterial = new THREE.MeshPhongMaterial({
    color: 0x8b6914,
    shininess: 50,
  });
  const frame = new THREE.Mesh(frameGeometry, frameMaterial);
  windowGroup.add(frame);

  return windowGroup;
}

// Create trees
function createTrees() {
  // Deciduous trees
  for (let i = 0; i < 8; i++) {
    const tree = createDeciduousTree();
    const angle = Math.random() * Math.PI * 2;
    const distance = 15 + Math.random() * 15;

    tree.position.x = Math.cos(angle) * distance;
    tree.position.z = Math.sin(angle) * distance;
    tree.position.y = 0;
    tree.scale.setScalar(0.8 + Math.random() * 0.5);

    scene.add(tree);
  }

  // Pine trees
  for (let i = 0; i < 6; i++) {
    const tree = createPineTree();
    const angle = Math.random() * Math.PI * 2;
    const distance = 18 + Math.random() * 12;

    tree.position.x = Math.cos(angle) * distance;
    tree.position.z = Math.sin(angle) * distance;
    tree.position.y = 0;
    tree.scale.setScalar(0.7 + Math.random() * 0.6);

    scene.add(tree);
  }
}

// Create deciduous tree
function createDeciduousTree() {
  const treeGroup = new THREE.Group();

  // Trunk
  const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
  const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3520 });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 2;
  trunk.castShadow = true;
  treeGroup.add(trunk);

  // Foliage (multiple spheres)
  const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });

  const positions = [
    { x: 0, y: 4.5, z: 0, scale: 2.2 },
    { x: -0.8, y: 4, z: 0.5, scale: 1.6 },
    { x: 0.7, y: 4.2, z: -0.6, scale: 1.8 },
    { x: 0, y: 5.5, z: 0, scale: 1.4 },
  ];

  positions.forEach((pos) => {
    const geometry = new THREE.SphereGeometry(pos.scale, 8, 8);
    const foliage = new THREE.Mesh(geometry, foliageMaterial);
    foliage.position.set(pos.x, pos.y, pos.z);
    foliage.castShadow = true;
    treeGroup.add(foliage);
  });

  return treeGroup;
}

// Create pine tree
function createPineTree() {
  const treeGroup = new THREE.Group();

  // Trunk
  const trunkGeometry = new THREE.CylinderGeometry(0.25, 0.4, 5, 8);
  const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 2.5;
  trunk.castShadow = true;
  treeGroup.add(trunk);

  // Conical foliage layers
  const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x1a4d2e });

  const layers = [
    { y: 3, radius: 2, height: 2.5 },
    { y: 4.5, radius: 1.5, height: 2 },
    { y: 5.8, radius: 1, height: 1.5 },
    { y: 6.8, radius: 0.6, height: 1.2 },
  ];

  layers.forEach((layer) => {
    const geometry = new THREE.ConeGeometry(layer.radius, layer.height, 8);
    const cone = new THREE.Mesh(geometry, foliageMaterial);
    cone.position.y = layer.y;
    cone.castShadow = true;
    treeGroup.add(cone);
  });

  return treeGroup;
}

// Create mushrooms scattered on ground
function createMushrooms() {
  for (let i = 0; i < 20; i++) {
    const mushroom = createMushroom();
    const angle = Math.random() * Math.PI * 2;
    const distance = 8 + Math.random() * 25;

    mushroom.position.x = Math.cos(angle) * distance;
    mushroom.position.z = Math.sin(angle) * distance;
    mushroom.position.y = 0;
    mushroom.scale.setScalar(0.3 + Math.random() * 0.4);
    mushroom.rotation.y = Math.random() * Math.PI * 2;

    scene.add(mushroom);
  }
}

// Create individual mushroom
function createMushroom() {
  const mushroomGroup = new THREE.Group();

  // Stem
  const stemGeometry = new THREE.CylinderGeometry(0.15, 0.2, 1, 8);
  const stemMaterial = new THREE.MeshLambertMaterial({ color: 0xf0e6d2 });
  const stem = new THREE.Mesh(stemGeometry, stemMaterial);
  stem.position.y = 0.5;
  stem.castShadow = true;
  mushroomGroup.add(stem);

  // Cap
  const capGeometry = new THREE.SphereGeometry(
    0.6,
    16,
    16,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  );
  const capMaterial = new THREE.MeshLambertMaterial({ color: 0xc85a54 });
  const cap = new THREE.Mesh(capGeometry, capMaterial);
  cap.position.y = 1;
  cap.castShadow = true;
  mushroomGroup.add(cap);

  // White spots on cap
  const spotGeometry = new THREE.CircleGeometry(0.1, 8);
  const spotMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });

  for (let i = 0; i < 5; i++) {
    const spot = new THREE.Mesh(spotGeometry, spotMaterial);
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.4;
    spot.position.x = Math.cos(angle) * radius;
    spot.position.y = 1.2 + Math.random() * 0.1;
    spot.position.z = Math.sin(angle) * radius;
    spot.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    mushroomGroup.add(spot);
  }

  return mushroomGroup;
}

// Create altars with crystals
function createAltars() {
  const altarPositions = [
    { angle: 0, distance: 25 },
    { angle: (Math.PI * 2) / 3, distance: 25 },
    { angle: (Math.PI * 4) / 3, distance: 25 },
    { angle: Math.PI / 3, distance: 28 },
    { angle: Math.PI, distance: 28 },
  ];

  altarPositions.forEach((pos) => {
    const altar = createAltar();
    altar.position.x = Math.cos(pos.angle) * pos.distance;
    altar.position.z = Math.sin(pos.angle) * pos.distance;
    altar.position.y = 0;
    scene.add(altar);
  });
}

// Create individual altar
function createAltar() {
  const altarGroup = new THREE.Group();

  // Multi-tiered base (rectangular prisms)
  const baseTiers = [
    { width: 2.5, height: 0.3, depth: 2.5 },
    { width: 2.2, height: 0.3, depth: 2.2 },
    { width: 1.9, height: 0.3, depth: 1.9 },
  ];

  let currentY = 0;
  baseTiers.forEach((tier) => {
    const geometry = new THREE.BoxGeometry(tier.width, tier.height, tier.depth);
    const material = new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      shininess: 30,
    });
    const block = new THREE.Mesh(geometry, material);
    block.position.y = currentY + tier.height / 2;
    block.castShadow = true;
    block.receiveShadow = true;
    altarGroup.add(block);
    currentY += tier.height;
  });

  // Greek column using LatheGeometry
  const columnProfile = [];
  const columnHeight = 4;
  const baseRadius = 0.5;

  // Column profile points (base to top)
  columnProfile.push(new THREE.Vector2(baseRadius * 1.2, 0)); // Base
  columnProfile.push(new THREE.Vector2(baseRadius * 1.1, 0.2));
  columnProfile.push(new THREE.Vector2(baseRadius, 0.4));

  // Fluted shaft
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const y = 0.4 + t * (columnHeight - 1);
    const r = baseRadius + Math.sin(t * Math.PI) * 0.08; // Slight entasis
    columnProfile.push(new THREE.Vector2(r, y));
  }

  // Capital
  columnProfile.push(new THREE.Vector2(baseRadius * 1.15, columnHeight - 0.3));
  columnProfile.push(new THREE.Vector2(baseRadius * 1.3, columnHeight - 0.2));
  columnProfile.push(new THREE.Vector2(baseRadius * 1.2, columnHeight));

  const columnGeometry = new THREE.LatheGeometry(columnProfile, 16);
  const columnMaterial = new THREE.MeshPhongMaterial({
    color: 0xf5f5dc,
    shininess: 40,
  });

  const column = new THREE.Mesh(columnGeometry, columnMaterial);
  column.position.y = currentY;
  column.castShadow = true;
  altarGroup.add(column);

  currentY += columnHeight;

  // Multi-tiered top (rectangular prisms)
  const topTiers = [
    { width: 2, height: 0.25, depth: 2 },
    { width: 1.7, height: 0.25, depth: 1.7 },
    { width: 1.4, height: 0.2, depth: 1.4 },
  ];

  topTiers.forEach((tier) => {
    const geometry = new THREE.BoxGeometry(tier.width, tier.height, tier.depth);
    const material = new THREE.MeshPhongMaterial({
      color: 0xd4a574,
      shininess: 30,
    });
    const block = new THREE.Mesh(geometry, material);
    block.position.y = currentY + tier.height / 2;
    block.castShadow = true;
    altarGroup.add(block);
    currentY += tier.height;
  });

  // Glowing crystal
  const crystal = createGlowingCrystal();
  crystal.position.y = currentY + 1.5;
  crystal.userData.baseY = currentY + 1.5;
  crystal.userData.floatOffset = Math.random() * Math.PI * 2;
  crystals.push(crystal);
  altarGroup.add(crystal);

  // Point light for crystal glow
  const crystalLight = new THREE.PointLight(
    crystal.children[0].material.color,
    1.5,
    5
  );
  crystalLight.position.y = currentY + 1.5;
  altarGroup.add(crystalLight);
  crystal.userData.light = crystalLight;

  return altarGroup;
}

// Create glowing crystal
function createGlowingCrystal() {
  const crystalGroup = new THREE.Group();

  // Random crystal color
  const colors = [0x9b59b6, 0x3498db, 0x1abc9c, 0xe74c3c, 0xf39c12, 0x00ffff];
  const color = colors[Math.floor(Math.random() * colors.length)];

  // Crystal geometry (octahedron modified)
  const geometry = new THREE.OctahedronGeometry(0.5, 0);
  const material = new THREE.MeshPhongMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.6,
    shininess: 100,
    transparent: true,
    opacity: 0.9,
  });

  const crystal = new THREE.Mesh(geometry, material);
  crystal.castShadow = true;
  crystalGroup.add(crystal);

  return crystalGroup;
}

// Setup watercolor post-processing effect
function setupWatercolorEffect() {
  // Load paper texture
  const loader = new THREE.TextureLoader();
  loader.load(
    "textures/paper.jpg",
    function (paperTexture) {
      // Create composer
      composer = new THREE.EffectComposer(renderer);

      // Add render pass
      const renderPass = new THREE.RenderPass(scene, camera);
      composer.addPass(renderPass);

      // Add watercolor pass
      const watercolorPass = new THREE.WatercolorPass(paperTexture);
      watercolorPass.renderToScreen = true;

      // Adjust watercolor parameters for nice effect
      watercolorPass.uniforms["scale"].value = 0.025;
      watercolorPass.uniforms["threshold"].value = 0.6;
      watercolorPass.uniforms["darkening"].value = 2.0;
      watercolorPass.uniforms["pigment"].value = 1.3;

      composer.addPass(watercolorPass);

      console.log("Watercolor effect initialized");
    },
    undefined,
    function (error) {
      console.error("Error loading paper texture:", error);
      console.log("Rendering without watercolor effect");
    }
  );
}

// Animation loop
function animate() {
  animationId = requestAnimationFrame(animate);

  // Update controls
  controls.update();

  // Animate clouds (slow rotation)
  if (cloudGroup) {
    cloudGroup.rotation.y += 0.0002;
  }

  // Animate crystals (floating motion)
  const time = Date.now() * 0.001;
  crystals.forEach((crystal) => {
    const offset = crystal.userData.floatOffset;
    const floatAmount = Math.sin(time + offset) * 0.3;
    crystal.position.y = crystal.userData.baseY + floatAmount;
    crystal.rotation.y += 0.01;

    // Update light position
    if (crystal.userData.light) {
      crystal.userData.light.position.y = crystal.position.y;
    }
  });

  // Render
  if (composer) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (composer) {
    composer.setSize(window.innerWidth, window.innerHeight);
  }
}

// Initialize when page loads
window.addEventListener("load", init);

// Cleanup on page unload
window.addEventListener("unload", () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  if (renderer) {
    renderer.dispose();
  }
});
