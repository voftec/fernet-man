import * as THREE from "three";

const palette = Object.freeze({
  asphalt: 0x252729, cream: 0xd5b58b, brick: 0x983e2d, plaster: 0x75605b,
  fern: 0x5c2b16, red: 0xbd3924, silver: 0xadb4b8, black: 0x16181a,
  glass: 0x4c91a7, yellow: 0xe6a52f, blue: 0x3c79a7, pink: 0xd2606d,
  wood: 0x9a5a2f, green: 0x273426, white: 0xe8e2d7
});

const materials = Object.fromEntries(Object.entries(palette).map(([name, color]) => [
  name, new THREE.MeshStandardMaterial({
    color, roughness: name === "silver" ? .3 : .85,
    metalness: name === "silver" ? .7 : 0,
    transparent: name === "glass", opacity: name === "glass" ? .8 : 1
  })
]));
const geometries = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 10),
  sphere: new THREE.SphereGeometry(1, 10, 8),
  cone: new THREE.ConeGeometry(1, 1, 8)
};
const mesh = (geometry, material, scale, position = [0, 0, 0]) => {
  const item = new THREE.Mesh(geometry, material);
  item.scale.set(...scale);
  item.position.set(...position);
  item.castShadow = true;
  item.receiveShadow = true;
  return item;
};
const prefabs = new Map();
const register = (name, factory) => {
  const object = factory();
  prefabs.set(name, object);
  return object;
};
const clone = (name) => prefabs.get(name).clone(true);

register("casa", () => {
  const group = new THREE.Group();
  group.add(mesh(geometries.box, materials.cream, [8, 6, 7], [0, 3, 0]));
  for (const x of [-2.5, 0, 2.5]) group.add(mesh(geometries.box, materials.brown ?? materials.fern, [.75, 3, .22], [x, 1.5, -3.6]));
  group.add(mesh(geometries.box, materials.brick, [8.8, .4, 7.8], [0, 6.2, 0]));
  return group;
});
register("apartamento", () => {
  const group = new THREE.Group();
  group.add(mesh(geometries.box, materials.plaster, [7, 13, 8], [0, 6.5, 0]));
  for (let y = 2; y < 12; y += 2.2) for (const x of [-2.2, 0, 2.2])
    group.add(mesh(geometries.box, materials.glass, [.75, .75, .08], [x, y, -4.05]));
  return group;
});
register("kiosco", () => {
  const group = new THREE.Group();
  group.add(mesh(geometries.box, materials.cream, [5.5, 5, 3], [0, 2.5, 0]));
  group.add(mesh(geometries.box, materials.red, [6, .45, 3.4], [0, 5.2, 0]));
  group.add(mesh(geometries.box, materials.glass, [3.5, 2.8, .2], [0, 2.2, -1.55]));
  group.add(mesh(geometries.box, materials.yellow, [4.2, .4, .25], [0, 4.2, -1.7]));
  return group;
});
register("capuchinos", () => {
  const group = new THREE.Group();
  group.add(mesh(geometries.box, materials.brick, [8, 6, 7], [0, 3, 0]));
  group.add(mesh(geometries.box, materials.cream, [2.3, 10, 2.7], [-2.7, 5, 0]));
  group.add(mesh(geometries.box, materials.cream, [1.7, 7.5, 2.3], [2.7, 3.75, 0]));
  group.add(mesh(geometries.cone, materials.brick, [1.4, 3, 1.4], [-2.7, 11.5, 0]));
  group.add(mesh(geometries.cone, materials.brick, [1, 2, 1], [2.7, 9, 0]));
  return group;
});
register("cabildo", () => {
  const group = new THREE.Group();
  group.add(mesh(geometries.box, materials.cream, [8, 5, 7], [0, 2.5, 0]));
  group.add(mesh(geometries.box, materials.brick, [8.8, .4, 7.8], [0, 5.2, 0]));
  for (let x = -3; x <= 3; x += 1.5) group.add(mesh(geometries.box, materials.fern, [.55, 2.6, .25], [x, 2, -3.6]));
  group.add(mesh(geometries.cylinder, materials.brick, [2.4, 2, 2.4], [0, 7, 0]));
  return group;
});
register("tipa", () => {
  const group = new THREE.Group();
  group.add(mesh(geometries.cylinder, materials.wood, [.22, 2.4, .22], [0, 1.2, 0]));
  group.add(mesh(geometries.cylinder, materials.green, [1.15, 1.8, 1.15], [0, 3, 0]));
  group.add(mesh(geometries.cylinder, materials.green, [.8, 1.3, .8], [-.7, 3.5, .15]));
  return group;
});
register("lamp", () => {
  const group = new THREE.Group();
  group.add(mesh(geometries.cylinder, materials.black, [.08, 3.5, .08], [0, 1.75, 0]));
  group.add(mesh(geometries.sphere, materials.yellow, [.24, .24, .24], [0, 3.6, 0]));
  return group;
});

function obstacle(type) {
  const group = new THREE.Group();
  if (type === "car") {
    group.add(mesh(geometries.box, materials.pink, [2.2, .85, 3], [0, .52, 0]));
    group.add(mesh(geometries.box, materials.glass, [1.6, .6, 1.2], [0, 1.25, -.2]));
    group.add(mesh(geometries.cylinder, materials.black, [.34, .18, .34], [-.82, .18, 1.05]));
    group.add(mesh(geometries.cylinder, materials.black, [.34, .18, .34], [.82, .18, 1.05]));
  } else if (type === "person") {
    group.add(mesh(geometries.cylinder, materials.blue, [.32, 1.7, .32], [0, 1.65, 0]));
    group.add(mesh(geometries.sphere, materials.cream, [.38, .38, .38], [0, 2.65, 0]));
  } else if (type === "crate") {
    group.add(mesh(geometries.box, materials.wood, [1.9, 1.9, 1.9], [0, .95, 0]));
    group.add(mesh(geometries.box, materials.cream, [2, .08, .08], [0, 1, -1]));
    group.add(mesh(geometries.box, materials.cream, [.08, 2, .08], [0, 1, -1]));
  } else if (type === "low" || type === "high") {
    const y = type === "low" ? 2 : 3.2;
    group.add(mesh(geometries.box, type === "low" ? materials.yellow : materials.red, [2.5, .65, .55], [0, y, 0]));
    group.add(mesh(geometries.box, materials.black, [.18, y, .5], [-1, y / 2, 0]));
    group.add(mesh(geometries.box, materials.black, [.18, y, .5], [1, y / 2, 0]));
  } else {
    group.add(mesh(geometries.cylinder, materials.black, [1.5, .06, 1.5], [0, .03, 0]));
  }
  return group;
}

function collectible(glass) {
  const group = new THREE.Group();
  if (glass) {
    group.add(mesh(geometries.cylinder, materials.glass, [.6, .8, .6], [0, 1.65, 0]));
    group.add(mesh(geometries.cylinder, materials.fern, [.52, .06, .52], [0, 2.08, 0]));
    group.add(mesh(geometries.cylinder, materials.red, [.35, .18, .35], [0, 1.65, 0]));
  } else {
    group.add(mesh(geometries.cylinder, materials.silver, [.38, 1.15, .38], [0, 1.72, 0]));
    group.add(mesh(geometries.cylinder, materials.red, [.4, .25, .4], [0, 1.98, 0]));
  }
  return group;
}

export const ASSETS = Object.freeze({
  palette,
  makeBuilding(variant = "apartamento") {
    const names = ["casa", "apartamento", "kiosco", "capuchinos", "cabildo"];
    return clone(names.includes(variant) ? variant : "apartamento");
  },
  makeTree: () => clone("tipa"),
  makeLamp: () => clone("lamp"),
  makeObstacle: (type) => obstacle(type),
  makeCollectible: (glass) => collectible(glass),
  makeRoadSegment: () => mesh(geometries.box, materials.lane, [.12, .025, 3.8])
});
