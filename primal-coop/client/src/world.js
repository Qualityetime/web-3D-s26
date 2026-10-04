import * as THREE from 'three';

export function buildWorld(scene, world) {
  scene.background = new THREE.Color(0xa9bba3);
  scene.fog = new THREE.FogExp2(0xa9bba3, 0.018);
  scene.add(new THREE.HemisphereLight(0xd6e5d0, 0x273124, 2.2));
  const sunlight = new THREE.DirectionalLight(0xffe2ae, 3.3);
  sunlight.position.set(-22, 38, -25);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024, 1024);
  sunlight.shadow.camera.left = -40;
  sunlight.shadow.camera.right = 40;
  sunlight.shadow.camera.top = 40;
  sunlight.shadow.camera.bottom = -40;
  sunlight.shadow.camera.near = 1;
  sunlight.shadow.camera.far = 110;
  sunlight.shadow.normalBias = 0.06;
  scene.add(sunlight);

  const groundGeometry = new THREE.PlaneGeometry(world.halfSize * 2, world.halfSize * 2, 64, 64);
  groundGeometry.rotateX(-Math.PI / 2);
  const colors = [];
  const position = groundGeometry.attributes.position;
  const clearing = new THREE.Color(0x827557);
  const forest = new THREE.Color(0x4d6342);
  const color = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const distance = Math.hypot(x, z);
    const blend = THREE.MathUtils.smoothstep(distance, 7, 16);
    const variation = Math.sin(x * 2.11 + z * 1.3) * Math.cos(z * 3.17) * 0.04;
    color.copy(clearing).lerp(forest, blend).multiplyScalar(1 + variation);
    colors.push(color.r, color.g, color.b);
  }
  groundGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const ground = new THREE.Mesh(groundGeometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  ground.receiveShadow = true;
  scene.add(ground);
  const horizon = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshStandardMaterial({ color: 0x5c7050, roughness: 1 }));
  horizon.rotation.x = -Math.PI / 2;
  horizon.position.y = -0.025;
  horizon.receiveShadow = true;
  scene.add(horizon);

  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x554835, roughness: 1 });
  const foliageMaterials = [0x374d35, 0x3f5e3d, 0x516446].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 1 }));
  const trunkGeometry = new THREE.CylinderGeometry(1, 1.2, 1, 7);
  const crownGeometry = new THREE.ConeGeometry(1, 1, 7);
  const treeTransform = new THREE.Object3D();
  const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, world.trees.length);
  world.trees.forEach((tree, index) => {
    treeTransform.position.set(tree.x, tree.height * 0.24, tree.z);
    treeTransform.scale.set(tree.radius / 1.2, tree.height * 0.48, tree.radius / 1.2);
    treeTransform.rotation.set(0, 0, 0);
    treeTransform.updateMatrix();
    trunks.setMatrixAt(index, treeTransform.matrix);
  });
  trunks.castShadow = true;
  scene.add(trunks);
  foliageMaterials.forEach((material, shade) => {
    const trees = world.trees.filter(tree => Math.floor(tree.shade * 3) === shade);
    const crowns = new THREE.InstancedMesh(crownGeometry, material, trees.length * 3);
    trees.forEach((tree, index) => {
      for (let tier = 0; tier < 3; tier++) {
        treeTransform.position.set(tree.x, tree.height * (0.45 + tier * 0.18), tree.z);
        const radius = tree.height * (0.26 - tier * 0.055);
        treeTransform.scale.set(radius, tree.height * 0.48, radius);
        treeTransform.rotation.set(0, tree.shade * Math.PI + tier * 0.3, 0);
        treeTransform.updateMatrix();
        crowns.setMatrixAt(index * 3 + tier, treeTransform.matrix);
      }
    });
    crowns.castShadow = true;
    crowns.receiveShadow = true;
    scene.add(crowns);
  });

  const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x77796d, roughness: 1, flatShading: true });
  const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
  for (const rock of world.rocks) {
    const mesh = new THREE.Mesh(rockGeometry, rockMaterial);
    mesh.position.set(rock.x, rock.height * 0.25, rock.z);
    mesh.scale.set(rock.radius, rock.height * 0.7, rock.radius);
    mesh.rotation.y = rock.rotation;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
  const markerMaterial = new THREE.MeshStandardMaterial({ color: 0x989587, roughness: 1, flatShading: true });
  const markerGeometry = new THREE.CylinderGeometry(0.73, 0.8, 1, 5);
  for (const marker of world.markers) {
    const mesh = new THREE.Mesh(markerGeometry, markerMaterial);
    mesh.scale.y = marker.height;
    mesh.position.set(marker.x, marker.height / 2, marker.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  // A low perimeter rail makes the edge of the movement test map visible.
  const railMaterial = new THREE.MeshStandardMaterial({ color: 0x635940, roughness: 1 });
  const railGeometry = new THREE.BoxGeometry(1, 0.1, 0.1);
  const edge = world.halfSize;
  for (const side of [-1, 1]) {
    const horizontal = new THREE.Mesh(railGeometry, railMaterial);
    horizontal.scale.x = edge * 2;
    horizontal.position.set(0, 0.8, side * edge);
    scene.add(horizontal);
    const vertical = horizontal.clone();
    vertical.rotation.y = Math.PI / 2;
    vertical.position.set(side * edge, 0.8, 0);
    scene.add(vertical);
    for (let offset = -edge; offset <= edge; offset += 6) {
      for (const [x, z] of [[offset, side * edge], [side * edge, offset]]) {
        const post = new THREE.Mesh(trunkGeometry, trunkMaterial);
        post.position.set(x, 0.55, z);
        post.scale.set(0.09, 1.1, 0.09);
        scene.add(post);
      }
    }
  }

  const pebbleGeometry = new THREE.IcosahedronGeometry(1, 0);
  const pebbles = new THREE.InstancedMesh(pebbleGeometry, rockMaterial, 90);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 90; i++) {
    const angle = i * 2.39996;
    const radius = 2 + Math.sqrt(i / 90) * 7;
    dummy.position.set(Math.cos(angle) * radius, 0.06, Math.sin(angle) * radius);
    dummy.scale.set(0.08 + (i % 5) * 0.025, 0.06, 0.12);
    dummy.rotation.y = angle;
    dummy.updateMatrix();
    pebbles.setMatrixAt(i, dummy.matrix);
  }
  pebbles.receiveShadow = true;
  scene.add(pebbles);
}
