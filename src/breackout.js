//Breakout

import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { Scene } from "@babylonjs/core/scene";
import { UniversalCamera, MeshBuilder, Scalar, StandardMaterial, Color3, Color4, TransformNode, KeyboardEventTypes, DefaultRenderingPipeline, ImageProcessingConfiguration, PBRMaterial, ArcRotateCamera, HighlightLayer, MeshExploder, ParticleHelper, SolidParticleSystem, AssetsManager, ParticleSystem, ShadowGenerator, DirectionalLight, SpotLight } from "@babylonjs/core";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";

import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";

import { PhysicsMotionType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { Inspector } from '@babylonjs/inspector';
import { TrailMesh } from '@babylonjs/core/Meshes/trailMesh';

import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Debug/debugLayer"; // Augments the scene with the debug methods
import "@babylonjs/inspector"; // Injects a local ES6 version of the inspector to prevent automatically relying on the none compatible version
import "@babylonjs/loaders/glTF";

import heightMapUrl from "../assets/textures/heightMap.png";


import wallBaseColorUrl from "../assets/textures/Stylized_Sci-fi_Wall_001_basecolor.jpg";
import wallNormalUrl from "../assets/textures/Stylized_Sci-fi_Wall_001_normal.jpg";

import brickBaseColorUrl from "../assets/textures/Ice_001_COLOR.jpg";
import brickNormalUrl from "../assets/textures/Ice_001_NRM.jpg";

import groundBaseColorUrl from "../assets/textures/Metal_Plate_Sci-Fi_001_SD/Metal_Plate_Sci-Fi_001_basecolor.jpg";
import groundNormalUrl from "../assets/textures/Metal_Plate_Sci-Fi_001_SD/Metal_Plate_Sci-Fi_001_normal.jpg";

import particleExplosionUrl from "../assets/particles/systems/particleSystem.json"
import particleExplosionTextureUrl from "../assets/particles/textures/dotParticle.png"

const bricksRows = 7;
const bricksCols = 13;
const brickWidth = 6;
const brickHeight = 2;
const brickPaddingX = 0.5;
const brickPaddingZ = 0.5;

const largeur = (bricksCols * brickWidth);
const profondeur = (bricksRows * brickHeight);
const profondeurWalls = profondeur + 35;

const hauteurWalls = 5;
const epaisseurWalls = 2;

const baseZBall = 20 - profondeurWalls;
const ballRadius = 0.75;
const baseZPaddle = 12 - profondeurWalls;
const offArea = 10 - profondeurWalls;

const WORLD_MIN_X =  -brickWidth + (epaisseurWalls/2) + ballRadius;
const WORLD_MAX_X = (largeur) - (epaisseurWalls/2) - ballRadius;

const WORLD_MIN_Y = -5;
const WORLD_MAX_Y = 5;

const WORLD_MIN_Z = offArea;
const WORLD_MAX_Z = profondeur;

var debugMaterial;
var debugBox;
var explosionParticleSystem;
var shadowGenerator;

class Entity {

  x = 0;
  y = 0;
  z = 0;
  prevX = 0;
  prevY = 0;
  prevZ = 0;

  vx = 0;
  vy = 0;
  vz = 0;

  ax = 0;
  ay = 0;
  az = 0;

  gameObject;

  constructor(x, y, z) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this.gameObject = null;
  }

  updatePosition() {
    this.gameObject.position = new Vector3(this.x, this.y, this.z);
  }

  applyVelocities() {
    this.prevX = this.x;
    this.prevY = this.y;
    this.prevZ = this.z;

    this.x = this.x + this.vx;
    this.y = this.y + this.vy;
    this.z = this.z + this.vz;
  }

}

class Paddle extends Entity {

  constructor(x, y, z) {
    super(x, y, z);

  }

}


class Ball extends Entity {

  #brickManager;
  #trail;

  constructor(x, y, z, brickManager) {
    super(x, y, z);
    this.#brickManager = brickManager;

    var ballMaterial = new StandardMaterial("ballMaterial");
    ballMaterial.diffuseColor = new Color3(1, 1, 1);
    ballMaterial.emmisiveColor = new Color3(1, 1, 1);
    //ballMaterial.bumpTexture = new Texture(rockTextureNormalUrl);


    const options = {
      segments: 16,
      diameter: ballRadius * 2
    };

    // Our built-in 'sphere' shape.
    this.gameObject = MeshBuilder.CreateSphere("ball", options);
    this.gameObject.receiveShadows = true;
    shadowGenerator.addShadowCaster(this.gameObject);

    // Affect a material
    this.gameObject.material = ballMaterial;
    this.updatePosition();

    this.#trail = new TrailMesh('ball trail', this.gameObject, brickManager.scene, 0.2, 30, true);
    var trailMaterial = new StandardMaterial('sourceMat', brickManager.scene);
    var color = new Color3(0, 1, 0);

    trailMaterial.emissiveColor =
      trailMaterial.diffuseColor = color;
    trailMaterial.specularColor = new Color3(0, 0, 0);
    this.#trail.material = trailMaterial;


  }

  launch(vx, vy, vz) {
    this.vx = vx;
    this.vy = vy;
    this.vz = vz;
    this.isAlive = true;
  }

  update() {

    this.applyVelocities();

    //Walls collisions
    if ((this.x > WORLD_MAX_X) || (this.x < WORLD_MIN_X))
      this.vx = -this.vx;

    if ((this.y > WORLD_MAX_Y) || (this.y < WORLD_MIN_Y))
      this.vy = -this.vy;

    if ((this.z > WORLD_MAX_Z) || (this.z < WORLD_MIN_Z))
      this.vz = -this.vz;

    //Debug
    let xpos = Math.floor((this.x + brickWidth / 2) / brickWidth);
    let zpos = Math.floor((this.z + brickHeight / 2) / brickHeight);
    debugBox.position = new Vector3(xpos * brickWidth, 0, zpos * brickHeight);
    debugBox.size = 2;

    //Bricks collisions
    if (this.#brickManager.getBrickAt(this.x, this.y, this.z)) {
      let bBothTestFailed = true;
      //On verifie d'ou on venait
      let brickAtXminus = this.#brickManager.getBrickAt(this.prevX, this.y, this.z);
      let brickAtZminus = this.#brickManager.getBrickAt(this.x, this.y, this.prevZ);
      if (brickAtXminus == 0) {
        this.vx = -this.vx;
        bBothTestFailed = false;
      }
      if (brickAtZminus == 0) {
        this.vz = -this.vz;
        bBothTestFailed = false;
      }
      if (bBothTestFailed)
        this.vz = -this.vz;


      this.#brickManager.destroyBrickAt(this.x, this.y, this.z);
    }

    this.updatePosition();

  }
}

var brickColors = [];
var brickMaterials = [];

class BrickObj extends Entity {

  type = 0;
  bAlive = true;
  #explosionParticleSystem

  constructor(index, type, x, y, z) {
    super(x, y, z);
    this.type = Scalar.Clamp(Math.floor(type), 0, 3);


    const options = {
      width: brickWidth - brickPaddingX,
      height: 2,
      depth: brickHeight - brickPaddingZ,
      wrap: true,
    };
    //this.y = options.height/2;

    // Our built-in 'sphere' shape.
    this.gameObject = MeshBuilder.CreateBox(`brick${index}`, options);
    this.gameObject.receiveShadows = true;
    shadowGenerator.addShadowCaster(this.gameObject, true);

    this.gameObject.enableEdgesRendering();
    this.gameObject.edgesWidth = 10;
    this.gameObject.edgesColor = new Color4(1, 0, 1, 1);

    this.#explosionParticleSystem = explosionParticleSystem.clone(`exp${index}`);
    this.#explosionParticleSystem.worldOffset = new Vector3(this.x, this.y, this.z);
    // this.#explosionParticleSystem.targetStopDuration = 5;

    /* var hightLightLayer = new HighlightLayer("hightLightLayer");
     hightLightLayer.outerGlow = false;
     hightLightLayer.addMesh(this.gameObject, brickColors[this.type]);
     var  alpha = 0;
     this.gameObject.getScene().registerBeforeRender(() => {
       alpha += 0.05;
     
       hightLightLayer.blurHorizontalSize = 0.5 + Math.cos(alpha) * 0.5 ;
       hightLightLayer.blurVerticalSize = 0.5 + Math.sin(alpha) * 0.5;
     });
 */

    this.updatePosition();

    // Move the sphere upward 1/2 its height
    //this.gameObject.diffuseColor = new Color4(1, 1, 1, 0.5);
    this.gameObject.material = brickMaterials[this.type];
    this.gameObject.material.emissiveColor = brickColors[this.type];
    this.gameObject.receiveShadows = true;
  }

  setVisible(bVisible) {
    this.gameObject.setEnabled(bVisible);
  }

  explode() {
    this.#explosionParticleSystem.start();
  }


}

class BrickManager {

  #scene;

  #ball;
  #bricks = new Array(bricksRows * bricksCols);
  #iLiveBricks = 0;

  constructor(scene) {
    this.#scene = scene;

    brickColors = [
      new Color3(1, 1, 0),
      new Color3(1, 0, 1),
      new Color3(0, 1, 1),
      new Color3(1, 1, 1)
    ];

    brickMaterials = [
      new StandardMaterial("brickMat0"),
      new StandardMaterial("brickMat1"),
      new StandardMaterial("brickMat2"),
      new StandardMaterial("brickMat3"),
    ];
    for (var mat of brickMaterials) {

      mat.diffuseTexture = new Texture(brickBaseColorUrl);
      mat.diffuseTexture.uScale = 1;
      mat.diffuseTexture.vScale = 1;

      mat.emissiveTexture = new Texture(brickBaseColorUrl);
      mat.emissiveTexture.uScale = 1;
      mat.emissiveTexture.vScale = 1;

      mat.bumpTexture = new Texture(brickNormalUrl);
      mat.bumpTexture.uScale = 1;
      mat.bumpTexture.vScale = 1;
    }

    this.init();
  }

  init() {

    this.#iLiveBricks = 0;
    for (let j = 0; j < bricksRows; j++) {
      for (let i = 0; i < bricksCols; i++) {
        let index = j * bricksCols + i;
        let x = i * brickWidth;
        let y = 0;
        let z = j * brickHeight;

        let uneBrique = new BrickObj(index, j / 2, x, y, z);


        this.#bricks[index] = uneBrique;
        this.#iLiveBricks++;
      }
    }
  }

  reset() {
    this.#iLiveBricks = 0;
    for (let brick of this.#bricks) {
      brick.bAlive = true;
      brick.setVisible(true);
      this.#iLiveBricks++;
    }

  }

  update() {

  }

  isLevelFinished() {
    return (this.#iLiveBricks == 0);
  }

  getBrickAt(x, y, z) {
    let xpos = Math.floor((x + brickWidth / 2) / brickWidth);
    let zpos = Math.floor((z + brickHeight / 2) / brickHeight);
    if (xpos >= 0 && xpos < bricksCols && zpos >= 0 && zpos < bricksRows) {
      let index = zpos * bricksCols + xpos;
      if (index >= 0 && index < this.#bricks.length)
        return this.#bricks[index].bAlive;
    }
    return false;
  }

  destroyBrickAt(x, y, z) {
    let xpos = Math.floor((x + brickWidth / 2) / brickWidth);
    let zpos = Math.floor((z + brickHeight / 2) / brickHeight);
    let index = zpos * bricksCols + xpos;
    if (index >= 0 && index < this.#bricks.length && this.#bricks[index].bAlive) {
      this.#bricks[index].bAlive = false;

      this.#bricks[index].setVisible(false);
      this.#bricks[index].explode();
      this.#iLiveBricks--;

      var that = this.#bricks[index];

      /*ParticleHelper.CreateAsync("explosion").then((set) => {

        set.systems.forEach(s => {
            s.disposeOnStop = true;
            s.worldOffset = new Vector3(that.x, that.y, that.z);
          
        });
        set.start();
    });*/


    }
  }

  draw() {
    for (let j = 0; j < bricksRows; j++) {
      for (let i = 0; i < bricksCols; i++) {
        let index = j * bricksCols + i;
        let brickAt = this.#bricks[index];
        if (brickAt.type == 1) {
          let x = brickAt.x;
          let y = brickAt.y;
          let z = brickAt.z;
        }
      }
    }
  }


}

const States = Object.freeze({
  STATE_NONE: 0,
  STATE_INIT: 1,
  STATE_LOADING: 2,
  STATE_RUNNING: 3,
  STATE_GAME_OVER: 4,
  STATE_END: 5,
});

class BreackOut {
  static name = "BreackOut";
  #canvas;
  #engine;
  #scene;
  #assetsManager;
  #camera;
  #light;
  #shadowGenerator;
  #hightLightLayer;

  #ground;
  #skySphere;

  #ball;
  #walls;

  #brickManager;
  #bInspector = false;
  #inputController;


  #state = States.STATE_NONE;


  constructor(canvas, engine) {
    this.#canvas = canvas;
    this.#engine = engine;
  }

  async start() {
    await this.init();
    this.loop();
    this.end();
  }

  async init() {
    // Create our first scene.
    this.#scene = new Scene(this.#engine);
    this.#scene.clearColor = Color3.Black();

    await this.initPS();

    // Add the highlight layer.
    this.#hightLightLayer = new HighlightLayer("hightLightLayer", this.#scene);
    //this.#hightLightLayer.innerGlow = false;

    // This creates and positions a free camera (non-mesh)
    this.#camera = new UniversalCamera(
      "camera1",
      new Vector3((bricksCols * brickWidth) / 2, 60, -65),
      this.#scene
    );
    //this.#camera = new ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 3, 10,new Vector3((bricksCols * brickWidth) / 2, 80, -60), this.#scene);


    // This targets the camera to scene origin
    this.#camera.setTarget(new Vector3((bricksCols * brickWidth) / 2, 0, -20));

    // This attaches the camera to the canvas
    //    this.#camera.attachControl(this.#canvas, true);

    // Set up new rendering pipeline
    var pipeline = new DefaultRenderingPipeline("default", true, this.#scene, [this.#camera]);
    this.#scene.imageProcessingConfiguration.toneMappingEnabled = true;
    this.#scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
    this.#scene.imageProcessingConfiguration.exposure = 3;
    pipeline.glowLayerEnabled = true
    pipeline.glowLayer.intensity = 0.75

    debugMaterial = new StandardMaterial("debugMaterial", this.#scene);
    debugMaterial.emissiveColor = Color3.Red();
    debugMaterial.wireframe = true;
    debugBox = MeshBuilder.CreateBox("debugBox", { size: ballRadius * 2 });
    debugBox.material = debugMaterial;
    debugBox.setEnabled(false);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    /*this.#light = new HemisphericLight(
      "light1",
      new Vector3(0, 1, 0),
      this.#scene
    );*/
    
    this.#light = new DirectionalLight(
      "light",
      new Vector3(-1, -10, -1),
      this.#scene
    );
    this.#light.intensity = 0.8;
    this.#light.position = new Vector3(20, 40, 20);

    var light0 = new HemisphericLight("light0", new Vector3(0, 1, 0), this.#scene);
    light0.intensity = 0.25;



    this.#shadowGenerator = shadowGenerator = new ShadowGenerator(512, this.#light);
    this.#shadowGenerator.useExponentialShadowMap = true;

    this.#shadowGenerator.setDarkness(0.4);

    // Our built-in 'ground' shape.
    /*    this.#ground = MeshBuilder.CreateGround(
          "ground1",
          { width: 128, height: 128, subdivisions: 2 },
          this.#scene
        );*/
    this.#ground = MeshBuilder.CreateGroundFromHeightMap("ground", heightMapUrl, {
      width: 256,
      height: 256,
      subdivisions: 1024,
      minHeight: 0,
      maxHeight: 8,
      updatable: false,
      /*      onReady: function (mesh) {
               new PhysicsAggregate(
                    mesh,
                    PhysicsShapeType.MESH,
                    { mass: 0, restitution: 0.1, friction: 10.0 },
                    scene
                );
            },*/
    }, this.#scene);
    this.#ground.position = new Vector3(30, -10, 0);
    this.#ground.receiveShadows = true;

    var groundMaterial = new StandardMaterial("groundMaterial");
    groundMaterial.diffuseTexture = new Texture(groundBaseColorUrl);
    groundMaterial.diffuseTexture.vScale = 3;
    groundMaterial.diffuseTexture.uScale = 3;

    

    groundMaterial.bumpTexture = new Texture(groundNormalUrl);
    groundMaterial.bumpTexture.vScale = 3;
    groundMaterial.bumpTexture.uScale = 3;

    // Affect a material
    this.#ground.material = groundMaterial;
    
    this.buildWalls();


    var skyMaterial = new GridMaterial("skyMaterial");
    skyMaterial.majorUnitFrequency = 10;
    skyMaterial.minorUnitVisibility = 0.5;
    skyMaterial.gridRatio = 3;
    skyMaterial.mainColor = new Color3(0, 0.05, 0.2);
    skyMaterial.lineColor = new Color3(0, 1.0, 1.0);
    skyMaterial.backFaceCulling = false;

    /*    this.#skySphere = MeshBuilder.CreateSphere("skySphere", {diameter : 300, segments: 32}, this.#scene);
        this.#skySphere.material = skyMaterial;
    */
    this.#inputController = new InputController(this.#scene);
    this.#brickManager = new BrickManager(this.#scene);
    this.#ball = new Ball(largeur/2, 0, baseZBall, this.#brickManager);
    
    this.#ball.launch(0.25, 0, 0.5);
  }

  initPS() {
    return new Promise((resolve) => {

      // Asset manager for loading texture and particle system
      this.#assetsManager = new AssetsManager(this.#scene);
      const particleTexture = this.#assetsManager.addTextureTask("explosion texture", particleExplosionTextureUrl)
      const particleExplosion = this.#assetsManager.addTextFileTask("explosion", particleExplosionUrl);

      // load all tasks
      this.#assetsManager.load();

      // after all tasks done, set up particle system
      this.#assetsManager.onFinish = (tasks) => {
        console.log("tasks successful", tasks);

        // prepare to parse particle system files
        const particleJSON = JSON.parse(particleExplosion.text);
        explosionParticleSystem = ParticleSystem.Parse(particleJSON, this.#scene, "", true);

        // set particle texture
        explosionParticleSystem.particleTexture = particleTexture.texture;
        explosionParticleSystem.emitter = new Vector3(0, 0, 0);
        //var sphereEmitter = explosionParticleSystem.createSphereEmitter(1.0);
        resolve(true);
      }

    });


  }

  loop() {
    // Render every frame
    const divFps = document.getElementById("fps");
    this.#engine.runRenderLoop(() => {

      this.#inputController.update();

      //Update paddle

      //Update ball
      this.#ball.update();

      //Update bricks
      this.#brickManager.update();
      if (this.#brickManager.isLevelFinished()) {
        //..??
        this.#brickManager.reset();
        this.#ball.launch(0.25, 0, 0.5);
      }

      //Render : (auto)

      //Debug
      if (this.#inputController.actions["KeyD"]) {
        this.#bInspector = !this.#bInspector;
        if (this.#bInspector) {
          debugBox.setEnabled(true);
          Inspector.Show(this.#scene, { embedMode: true });
        }
        else {
          debugBox.setEnabled(false);
          Inspector.Hide();
        }
      }

      //Fin update 
      this.#inputController.endupdate();

      //Affichage FPS
      divFps.innerHTML = this.#engine.getFps().toFixed() + " fps";
      this.#scene.render();


    });
  }

  end() { }

  buildWalls() {

    var wallMaterial = new StandardMaterial("wallMaterial", this.#scene);
    wallMaterial.diffuseTexture = new Texture(wallBaseColorUrl);
    wallMaterial.diffuseTexture.uScale = largeur / 5;
    wallMaterial.diffuseTexture.vScale = 5 / 5;

    wallMaterial.bumpTexture = new Texture(wallNormalUrl);
    wallMaterial.bumpTexture.uScale = largeur / 5;
    wallMaterial.bumpTexture.vScale = 5 / 5;
    //wallMaterial.ambientTexture = new Texture(wallAmbientOcclusionUrl);


    this.#walls = new TransformNode("walls", this.#scene);
    var lWall = MeshBuilder.CreateBox("tWall", { width: profondeurWalls, height: hauteurWalls, depth: epaisseurWalls }, this.#scene);
    lWall.rotation.y = -Math.PI / 2;
    lWall.position.x = -brickWidth;
    lWall.position.z = (profondeur + epaisseurWalls * 2.5) - (profondeurWalls / 2);

    var rWall = MeshBuilder.CreateBox("tWall", { width: profondeurWalls, height: hauteurWalls, depth: epaisseurWalls }, this.#scene);
    rWall.rotation.y = Math.PI / 2;
    rWall.position.x = largeur;
    rWall.position.z = (profondeur + epaisseurWalls * 2.5) - (profondeurWalls / 2);


    var tWall = MeshBuilder.CreateBox("tWall", { width: (largeur + brickWidth), height: hauteurWalls, depth: epaisseurWalls }, this.#scene);
    tWall.position = new Vector3((largeur - brickWidth) / 2, 0, profondeur + (epaisseurWalls * 2));
    lWall.setParent(this.#walls);
    rWall.setParent(this.#walls);
    tWall.setParent(this.#walls);
    lWall.receiveShadows = true;
    this.#shadowGenerator.addShadowCaster(lWall);
    rWall.receiveShadows = true;
    this.#shadowGenerator.addShadowCaster(rWall);
    tWall.receiveShadows = true;
    this.#shadowGenerator.addShadowCaster(tWall);
    /*    lWall.checkCollisions = true;
        rWall.checkCollisions = true;
        tWall.checkCollisions = true;
    */
    lWall.material = wallMaterial;
    tWall.material = wallMaterial;
    rWall.material = wallMaterial;

    this.#hightLightLayer.addMesh(lWall, Color3.Green());
    this.#hightLightLayer.addMesh(tWall, Color3.Green());
    this.#hightLightLayer.addMesh(rWall, Color3.Green());

  }

}

class InputController {

  #scene;
  inputMap = {};
  actions = {};

  constructor(scene) {
    this.#scene = scene;

    this.#scene.onKeyboardObservable.add((kbInfo) => {
      switch (kbInfo.type) {
        case KeyboardEventTypes.KEYDOWN:
          this.inputMap[kbInfo.event.code] = true;
          console.log(`KEY DOWN: ${kbInfo.event.code} / ${kbInfo.event.key}`);
          break;
        case KeyboardEventTypes.KEYUP:
          this.inputMap[kbInfo.event.code] = false;
          this.actions[kbInfo.event.code] = true;
          console.log(`KEY UP: ${kbInfo.event.code} / ${kbInfo.event.key}`);
          break;
      }
    });
  }

  update() {
    //Gestion des actions (keydown / keyup -> Action)
  }

  endupdate() {
    this.actions = {};

  }
}

export default BreackOut;
