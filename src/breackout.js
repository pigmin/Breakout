//Breakout

import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder, Scalar, StandardMaterial, Color3, Color4, TransformNode, KeyboardEventTypes, DefaultRenderingPipeline, ImageProcessingConfiguration, PBRMaterial, ArcRotateCamera, HighlightLayer, AssetsManager, ParticleSystem, ShadowGenerator, DirectionalLight, Sound, Animation, Engine, FlyCamera } from "@babylonjs/core";
import { PhysicsShapeType, PhysicsMotionType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";

import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";


import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { Inspector } from '@babylonjs/inspector';
import { TrailMesh } from '@babylonjs/core/Meshes/trailMesh';

import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Debug/debugLayer"; // Augments the scene with the debug methods
import "@babylonjs/inspector"; // Injects a local ES6 version of the inspector to prevent automatically relying on the none compatible version
import "@babylonjs/loaders/glTF";


import wallBaseColorUrl from "../assets/textures/Metal_Plate_Sci-Fi_001_SD/Metal_Plate_Sci-Fi_001_basecolor.jpg";
import wallNormalUrl from "../assets/textures/Metal_Plate_Sci-Fi_001_SD/Metal_Plate_Sci-Fi_001_normal.jpg";
import wallAmbientUrl from "../assets/textures/Metal_Plate_Sci-Fi_001_SD/Material_1414.jpg";

import brickBaseColorUrl from "../assets/textures/Ice_001_COLOR.jpg";
//import brickNormalUrl from "../assets/textures/Ice_001_NRM.jpg";

/*import groundBaseColorUrl from "../assets/textures/Metal_Plate_Sci-Fi_001_SD/Metal_Plate_Sci-Fi_001_basecolor.jpg";
import groundNormalUrl from "../assets/textures/Metal_Plate_Sci-Fi_001_SD/Metal_Plate_Sci-Fi_001_normal.jpg";
*/
import particleExplosionUrl from "../assets/particles/systems/particleSystem.json"
import particleExplosionTextureUrl from "../assets/particles/textures/dotParticle.png"

import musicUrl from "../assets/musics/Eric Cubizolle - Andromeda.mp3";
//import boingSoundUrl from "../assets/sounds/446100__justinvoke__bounce.wav";
import brickTouchedSoundUrl1 from "../assets/sounds/Arkanoid SFX (7).wav";
import brickTouchedSoundUrl2 from "../assets/sounds/Arkanoid SFX (8).wav";
import paddleTouchedSoundUrl from "../assets/sounds/Arkanoid SFX (6).wav";
import looseSoundUrl from "../assets/sounds/Arkanoid SFX (2).wav";


import roomModelUrl from "../assets/models/secret_area-52__room.glb";

import flareParticleTextureUrl from "../assets/particles/textures/Flare.png";
import { AdvancedDynamicTexture, Button } from "@babylonjs/gui";

const bricksRows = 7;
const bricksCols = 13;
const brickWidth = 6;
const brickHeight = 2;
const brickPaddingX = 0.5;
const brickPaddingZ = 0.5;

const affectationTypeByRow = [0, 1, 2, 3, 4, 5, 6];
let bricksType = [];


const largeur = (bricksCols * brickWidth);
const profondeur = (bricksRows * brickHeight);
const profondeurWalls = profondeur + 45;

const hauteurWalls = 5;
const epaisseurWalls = 2;

const baseZBall = 20 - profondeurWalls;
const ballRadius = 0.75;
const baseZPaddle = 18 - profondeurWalls;
const paddleWidth = 8;
const paddleRadius = 0.6;
const offArea = 10 - profondeurWalls;

const WORLD_MIN_X = -brickWidth + (epaisseurWalls / 2) + ballRadius;
const WORLD_MAX_X = (largeur) - (epaisseurWalls / 2) - ballRadius;

const WORLD_MIN_Y = -5;
const WORLD_MAX_Y = 5;

const WORLD_MIN_Z = offArea;
const WORLD_MAX_Z = profondeur;

const BALL_LAUNCH_VX = 0.15;
const BALL_LAUNCH_VZ = 0.5;

const StartButtonMeshTarget = "Cube.061_177";
//const StartButtonMeshTarget = "panel_plate.001_140";

var debugMaterial;
var debugBox;
var explosionParticleSystem;
var shadowGenerator;

var gameState;
function changeGameState(newState) {
  gameState = newState;
}

let SoundsFX = Object.freeze({
  BRICK1: 0,
  BRICK2: 1,
  PADDLE: 2,
  LOOSE: 3,
})

let soundsRepo = [];
function playSound(soundIndex) {
  soundsRepo[soundIndex].play();
}

function getRandomInt(max) {
  return Math.round(Math.random() * max);
}

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

  #inputController;

  constructor(x, y, z, inputController) {
    super(x, y, z);

    this.#inputController = inputController;
    this.gameObject = new MeshBuilder.CreateCapsule("capsule", { radius: paddleRadius, capSubdivisions: 6, subdivisions: 6, tessellation: 36, height: paddleWidth, orientation: Vector3.Left() });
    shadowGenerator.addShadowCaster(this.gameObject);

    var trailMaterial = new StandardMaterial('reactMat');
    var color = new Color3(0.2, 0.4, 1);

    trailMaterial.emissiveColor = color;
    trailMaterial.diffuseColor = color;
    trailMaterial.specularColor = new Color3(1, 1, 1);


    var lReact = new MeshBuilder.CreateCylinder("lReact", { height: paddleRadius + 0.2, diameter: paddleRadius * 3.0 });
    lReact.position.x = -paddleWidth / 3;
    lReact.rotation.z = -Math.PI / 2;

    lReact.material = trailMaterial;
    lReact.setParent(this.gameObject);

    var rReact = new MeshBuilder.CreateCylinder("rReact", { height: paddleRadius + 0.2, diameter: paddleRadius * 3.0 });
    rReact.position.x = paddleWidth / 3;
    rReact.rotation.z = -Math.PI / 2;
    rReact.material = trailMaterial;
    rReact.setParent(this.gameObject);


    var paddleMaterial = new StandardMaterial("paddleMaterial");
    //var paddleTexture 
    paddleMaterial.diffuseColor = new Color3(1, 1, 1.0);
    paddleMaterial.emmisiveColor = new Color3(1, 1, 1.0);
    //ballMaterial.bumpTexture = new Texture(rockTextureNormalUrl);


    this.createParticles(lReact, "lReact", new Vector3(0, -1, 0));
    this.createParticles(rReact, "rReact", new Vector3(0, 1, 0));

    this.updatePosition();
  }

  createParticles(react, name, direction) {

    // Create a particle system
    const particleSystem = new ParticleSystem(name, 2000);
    //Texture of each particle
    particleSystem.particleTexture = new Texture(flareParticleTextureUrl);
    // Where the particles come from
    particleSystem.emitter = react; // the starting object, the emitter
    particleSystem.minEmitBox = new Vector3(0, -0.5, -0.5); // Starting all from
    particleSystem.maxEmitBox = new Vector3(0, 0.5, 0.5); // To...
    // Colors of all particles
    particleSystem.color1 = new Color4(0.8, 0.8, 1.0, 1.0);
    particleSystem.color2 = new Color4(0.5, 0.5, 1.0, 1.0);
    particleSystem.colorDead = new Color4(0, 0, 0.2, 0.0);
    // Size of each particle (random between...
    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.51;
    // Life time of each particle (random between...
    particleSystem.minLifeTime = 0.5;
    particleSystem.maxLifeTime = 2;
    // Emission rate
    particleSystem.emitRate = 2000;
    // Blend mode : BLENDMODE_ONEONE, or BLENDMODE_STANDARD
    particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE;
    // Set the gravity of all particles
    particleSystem.gravity = new Vector3(0, 0, 0);
    // Direction of each particle after it has been emitted
    particleSystem.direction1 = direction;
    particleSystem.direction2 = Vector3.Zero();
    // Angular speed, in radians
    particleSystem.minAngularSpeed = 0;
    particleSystem.maxAngularSpeed = Math.PI;
    // Speed
    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 5;
    particleSystem.updateSpeed = 0.05;
    // Start the particle system
    particleSystem.start();
  }

  checkInput() {

    const MIN_P_VELOCITY = 0.05;
    const DRAG_FORCE = 0.8;
    const PADDLE_ACC_X = 0.2;
    const MAX_VELOCITY = 7;

    if (Math.abs(this.vx) > MIN_P_VELOCITY)
      this.vx = this.vx * DRAG_FORCE;
    else
      this.vx = 0;

    if (this.#inputController.inputMap["ArrowLeft"]) {
      this.vx -= PADDLE_ACC_X;
      if (this.vx < -MAX_VELOCITY)
        this.vx = -MAX_VELOCITY;
    }
    else if (this.#inputController.inputMap["ArrowRight"]) {
      this.vx += PADDLE_ACC_X;
      if (this.vx > MAX_VELOCITY)
        this.vx = MAX_VELOCITY;
    }
  }

  update() {

    this.applyVelocities();

    //Walls collisions
    if (this.x > (WORLD_MAX_X - paddleWidth / 2))
      this.x = (WORLD_MAX_X - paddleWidth / 2);
    else if (this.x < (WORLD_MIN_X + paddleWidth / 2))
      this.x = (WORLD_MIN_X + paddleWidth / 2);

    this.updatePosition();

  }

}


class Ball extends Entity {

  #brickManager;
  #paddle;
  #trail;

  constructor(x, y, z, brickManager, paddle) {
    super(x, y, z);
    this.#brickManager = brickManager;
    this.#paddle = paddle;

    var ballMaterial = new StandardMaterial("ballMaterial");
    ballMaterial.diffuseColor = new Color3(1, 1, 1);
    ballMaterial.emmisiveColor = new Color3(0.6, 1, 0.6);
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

    trailMaterial.emissiveColor = color;
    trailMaterial.diffuseColor = color;
    trailMaterial.specularColor = new Color3(1, 1, 1);
    this.#trail.material = trailMaterial;


  }

  launch(vx, vy, vz) {
    this.vx = vx;
    this.vy = vy;
    this.vz = vz;
    this.isAlive = true;
  }

  reset() {
    this.x = this.#paddle.x;
    this.y = 0;
    this.z = baseZBall;
  }

  update() {

    this.applyVelocities();

    //Walls collisions
    if ((this.x > WORLD_MAX_X) || (this.x < WORLD_MIN_X)) {
      this.vx = -this.vx;
      //playSound(SoundsFX.BOING);
    }

    if ((this.y > WORLD_MAX_Y) || (this.y < WORLD_MIN_Y)) {
      this.vy = -this.vy;
      //playSound(SoundsFX.BOING);
    }

    if ((this.z > WORLD_MAX_Z)) {
      //playSound(SoundsFX.BOING);
      this.vz = -this.vz;
    }
    else if (this.z < WORLD_MIN_Z) {
      this.isAlive = false;
      changeGameState(States.STATE_LOOSE);
      playSound(SoundsFX.LOOSE);
    }

    if (this.isAlive) {

      //Debug
      let xpos = Math.floor((this.x + brickWidth / 2) / brickWidth);
      let zpos = Math.floor((this.z + brickHeight / 2) / brickHeight);
      debugBox.position = new Vector3(xpos * brickWidth, 0, zpos * brickHeight);
      debugBox.size = 2;

      //Bricks collisions
      let brickCol = this.#brickManager.getBrickCol(this.x);
      let brickRow = this.#brickManager.getBrickRow(this.z);

      let brickAtBall = this.#brickManager.getBrickAtRowCol(brickCol, brickRow);
      if (brickAtBall) {
        let bBothTestFailed = true;
        //On verifie d'ou on venait
        let prevBrickCol = this.#brickManager.getBrickCol(this.prevX);
        let prevBrickRow = this.#brickManager.getBrickRow(this.prevZ);

        if (prevBrickCol != brickCol) {
          let brickAtXminus = this.#brickManager.getBrickAtRowCol(prevBrickCol, brickRow);

          if (!brickAtXminus) {
            this.vx = -this.vx;
            bBothTestFailed = false;
          }
        }
        if (prevBrickRow != brickRow) {
          let brickAtZminus = this.#brickManager.getBrickAtRowCol(brickCol, prevBrickRow);

          if (!brickAtZminus) {
            this.vz = -this.vz;
            bBothTestFailed = false;
          }
        }

        if (bBothTestFailed)
          this.vz = -this.vz;


        this.#brickManager.destroyBrickAt(this.x, this.y, this.z);
        console.log(getRandomInt(1) + SoundsFX.BRICK1);
        playSound(getRandomInt(1) + SoundsFX.BRICK1);
      }

      //Check collisions avec paddle
      this.checkPaddleCollision();
    }

    this.updatePosition();

  }

  checkPaddleCollision() {
    let lx = this.x - ballRadius;
    let rx = this.x + ballRadius;

    let plx = this.#paddle.x - paddleWidth / 2;
    let prx = this.#paddle.x + paddleWidth / 2;

    let dz = Math.sqrt((this.z - this.#paddle.z) * (this.z - this.#paddle.z));
    if (this.isAlive && this.z < (this.#paddle.z + paddleRadius) && dz < 1 && (lx >= plx && rx <= prx)) {
      this.vz = -this.vz;
      let distanceFromPaddle = this.x - this.#paddle.x;
      this.vx = distanceFromPaddle * 0.1;
      playSound(SoundsFX.PADDLE);
    }

  }
}




class BrickObj extends Entity {

  type = 0;
  bAlive = true;
  #explosionParticleSystem

  constructor(index, type, x, y, z, model, parent) {
    super(x, y, z);
    this.type = Scalar.Clamp(Math.floor(type), 0, 3);

    // Our built-in 'sphere' shape.
    this.gameObject = model.createInstance(`brick${index}`);
    this.gameObject.setParent(parent);
    //this.gameObject.receiveShadows = true;
    shadowGenerator.addShadowCaster(this.gameObject, true);


    this.#explosionParticleSystem = explosionParticleSystem.clone(`exp${index}`);
    this.#explosionParticleSystem.worldOffset = new Vector3(this.x, this.y, this.z);
    // this.#explosionParticleSystem.targetStopDuration = 5; 

    this.updatePosition();

    // Move the sphere upward 1/2 its height
    //this.gameObject.diffuseColor = new Color4(1, 1, 1, 0.5);    
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

  #parent;
  #ball;
  #bricks = new Array(bricksRows * bricksCols);
  #iLiveBricks = 0;

  constructor(scene) {
    this.#scene = scene;

    const options = {
      width: brickWidth - brickPaddingX,
      height: 2,
      depth: brickHeight - brickPaddingZ,
      wrap: true,
    };

    bricksType = [
      {
        model: MeshBuilder.CreateBox(`brick0`, options),
        color: new Color3(0.4, 0.5, 0.9),
        material: new StandardMaterial("brickMat0"),
      },
      {
        model: MeshBuilder.CreateBox(`brick1`, options),
        color: new Color3(0.3, 0.6, 0.9),
        material: new StandardMaterial("brickMat1"),
      },
      {
        model: MeshBuilder.CreateBox(`brick2`, options),
        color: new Color3(0, 1, 1),
        material: new StandardMaterial("brickMat2"),
      },
      {
        model: MeshBuilder.CreateBox(`brick3`, options),
        color: new Color3(0.3, 0.7, 0.5),
        material: new StandardMaterial("brickMat3"),
      },
      {
        model: MeshBuilder.CreateBox(`brick4`, options),
        color: new Color3(0.9, 0.8, 0.3),
        material: new StandardMaterial("brickMat4"),
      },
      {
        model: MeshBuilder.CreateBox(`brick5`, options),
        color: new Color3(0.9, 0.5, 0.2),
        material: new StandardMaterial("brickMat5"),
      },
      {
        model: MeshBuilder.CreateBox(`brick6`, options),
        color: new Color3(1, 0.4, 0.4),
        material: new StandardMaterial("brickMat6"),
      }
    ];

    this.#parent = new TransformNode("bricks");

    for (let brickType of bricksType) {
      brickType.model.receiveShadows = false;
      brickType.model.isVisible = false;

      brickType.material.diffuseTexture = new Texture(brickBaseColorUrl);
      brickType.material.diffuseTexture.uScale = 1;
      brickType.material.diffuseTexture.vScale = 1;
      brickType.material.diffuseColor = brickType.color;

      /*brickType.material.emissiveTexture = new Texture(brickNormalUrl);
      brickType.material.emissiveTexture.uScale = 1;
      brickType.material.emissiveTexture.vScale = 1;
      */
      brickType.material.emissiveColor = brickType.color;

      brickType.model.material = brickType.material;
    }


    /*brickMaterial.bumpTexture = new Texture(brickNormalUrl);
    brickMaterial.bumpTexture.uScale = 1;
    brickMaterial.bumpTexture.vScale = 1;
*/
    this.init();
  }

  init() {


    //this.y = options.height/2;

    this.#iLiveBricks = 0;
    for (let j = 0; j < bricksRows; j++) {
      for (let i = 0; i < bricksCols; i++) {
        let index = j * bricksCols + i;
        let x = i * brickWidth;
        let y = 0;
        let z = j * brickHeight;
        let type = affectationTypeByRow[j];

        let model = bricksType[type].model;
        let uneBrique = new BrickObj(index, type, x, y, z, model, this.#parent);


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

  getBrickCol(x) {
    return Math.floor((x + brickWidth / 2) / brickWidth);
  }

  getBrickRow(z) {
    return Math.floor((z + brickHeight / 2) / brickHeight);
  }

  getBrickAtRowCol(xpos, zpos) {
    if (xpos >= 0 && xpos < bricksCols && zpos >= 0 && zpos < bricksRows) {
      let index = zpos * bricksCols + xpos;
      if (index >= 0 && index < this.#bricks.length)
        return this.#bricks[index].bAlive;
    }
    return null;
  }

  getBrickAt(x, y, z) {
    let xpos = Math.floor((x + brickWidth / 2) / brickWidth);
    let zpos = Math.floor((z + brickHeight / 2) / brickHeight);
    if (xpos >= 0 && xpos < bricksCols && zpos >= 0 && zpos < bricksRows) {
      let index = zpos * bricksCols + xpos;
      if (index >= 0 && index < this.#bricks.length)
        return this.#bricks[index].bAlive;
    }
    return null;
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

      //var that = this.#bricks[index];

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


  }


}

const States = Object.freeze({
  STATE_NONE: 0,
  STATE_INIT: 10,
  STATE_LOADING: 20,
  STATE_MENU: 25,
  STATE_START_INTRO: 28,
  STATE_INTRO: 30,
  STATE_START_GAME: 35,
  STATE_LAUNCH: 40,
  STATE_RUNNING: 50,
  STATE_LOOSE: 55,
  STATE_GAME_OVER: 60,
  STATE_END: 100,
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
  #music;

  #ground;
  #skySphere;

  #paddle;
  #ball;
  #walls;

  #brickManager;
  #bInspector = false;
  #inputController;

  #myMeshes = [];
  #guiTexture;

  #cameraStartPosition = new Vector3(-257, 566, -620);
  #cameraMenuPosition = new Vector3(-103, 21, -3);

  #cameraGamePosition = new Vector3(39, 75, -57);
  #cameraGameTarget = new Vector3((bricksCols * brickWidth) / 2, 0, -20);

  constructor(canvas, engine) {
    this.#canvas = canvas;
    this.#engine = engine;
  }

  async start() {
    await this.init();
    await this.loadGUI();
    this.loop();
    this.end();
  }

  async init() {
    // Create our first scene.
    this.#scene = new Scene(this.#engine);
    this.#scene.clearColor = Color3.Black();

    await this.loadAssets();

    // Add the highlight layer.
    this.#hightLightLayer = new HighlightLayer("hightLightLayer", this.#scene);
    //this.#hightLightLayer.innerGlow = false;

    // This creates and positions a free camera (non-mesh)
    /*this.#camera = new UniversalCamera(
      "camera1",
      new Vector3((bricksCols * brickWidth) / 2, 60, -65),
      this.#scene
    );*/
    this.#camera = new ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 3, 10, this.#cameraMenuPosition, this.#scene);
  /*  this.#camera  = new FlyCamera(
      "FlyCamera",
      new Vector3(0, 5, -50),
      this.#scene
    );
*/
    // This targets the camera to scene origin
    this.#camera.setTarget(new Vector3((bricksCols * brickWidth) / 2, 0, -20));

    // This attaches the camera to the canvas
    //this.#camera.attachControl(this.#canvas, true);



    // Set up new rendering pipeline
    var pipeline = new DefaultRenderingPipeline("default", true, this.#scene, [this.#camera]);
    this.#scene.imageProcessingConfiguration.toneMappingEnabled = true;
    this.#scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
    this.#scene.imageProcessingConfiguration.exposure = 3;
    pipeline.glowLayerEnabled = true;
    pipeline.glowLayer.intensity = 0.25;

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
    light0.position = new Vector3(0, 100, 0);
    light0.intensity = 0.8;



    this.#shadowGenerator = shadowGenerator = new ShadowGenerator(512, this.#light);
    //this.#shadowGenerator.useExponentialShadowMap = true;
    //this.#shadowGenerator.usePercentageCloserFiltering = true;
    this.#shadowGenerator.setDarkness(0.4);

    /*
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
                },*//*
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
*/
    this.buildWalls();


    var skyMaterial = new GridMaterial("skyMaterial");
    skyMaterial.majorUnitFrequency = 10;
    skyMaterial.minorUnitVisibility = 0.5;
    skyMaterial.gridRatio = 3;
    skyMaterial.mainColor = new Color3(0, 0.05, 0.2);
    skyMaterial.lineColor = new Color3(0, 1.0, 1.0);
    skyMaterial.backFaceCulling = false;

    this.#music = new Sound("music", musicUrl, this.#scene, null, { loop: true, autoplay: true });

    this.#skySphere = MeshBuilder.CreateSphere("skySphere", { diameter: 3000, segments: 32 }, this.#scene);
    this.#skySphere.material = skyMaterial;

    this.#inputController = new InputController(this.#scene);
    this.#brickManager = new BrickManager(this.#scene);
    this.#paddle = new Paddle(largeur / 2, 0, baseZPaddle, this.#inputController);
    this.#ball = new Ball(this.#paddle.x, 0, baseZBall, this.#brickManager, this.#paddle);


    changeGameState(States.STATE_MENU);

  }



  launchCameraAnimation(callback) {

    const startFrame = 0;
    const endFrame = 400;
    const frameRate = 60;

    var animationcamera = new Animation(
      "myAnimationcamera",
      "position",
      frameRate,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    // console.log(animationcamera);
    var keys = [];

    keys.push({
      frame: startFrame,
      value: this.#cameraStartPosition,
      // outTangent: new Vector3(1, 0, 0)
    });

    keys.push({
      frame: endFrame / 2,
      value: new Vector3(39, 177, -550),
    });

    keys.push({
      frame: endFrame,
      // inTangent: new Vector3(-1, 0, 0),
      value: new Vector3(39, 75, -57),
    });

    animationcamera.setKeys(keys);

    this.#camera.animations = [];
    this.#camera.animations.push(animationcamera);

    this.#scene.beginAnimation(this.#camera, startFrame, endFrame, false, 1, callback);
  }

  loadAssets() {
    return new Promise((resolve) => {

      // Asset manager for loading texture and particle system
      this.#assetsManager = new AssetsManager(this.#scene);
      const particleTexture = this.#assetsManager.addTextureTask("explosion texture", particleExplosionTextureUrl)
      const particleExplosion = this.#assetsManager.addTextFileTask("explosion", particleExplosionUrl);
      //      const boingSoundData = this.#assetsManager.addBinaryFileTask("boingSound", boingSoundUrl);
      const brickTouchedSoundData1 = this.#assetsManager.addBinaryFileTask("brickTouchedSound1", brickTouchedSoundUrl1);
      const brickTouchedSoundData2 = this.#assetsManager.addBinaryFileTask("brickTouchedSound2", brickTouchedSoundUrl2);
      const paddleTouchedSoundData = this.#assetsManager.addBinaryFileTask("paddleTouchedSound", paddleTouchedSoundUrl);
      const looseSoundData = this.#assetsManager.addBinaryFileTask("looseSound", looseSoundUrl);


      this.LoadEntity(
        "room",
        "",
        "",
        roomModelUrl,
        this.#assetsManager,
        this.#myMeshes,
        0,
        { position: new Vector3(-73.11, -224.68, -92.87), scaling: new Vector3(200, 200, 200) },
        this.#scene,
        this.#shadowGenerator
      );

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

        //soundsRepo[SoundsFX.BOING] = new Sound("boingSound", boingSoundData.data, this.#scene);
        soundsRepo[SoundsFX.BRICK1] = new Sound("brickTouchedSound1", brickTouchedSoundData1.data, this.#scene);
        soundsRepo[SoundsFX.BRICK2] = new Sound("brickTouchedSound2", brickTouchedSoundData2.data, this.#scene);
        soundsRepo[SoundsFX.PADDLE] = new Sound("paddleTouchedSound", paddleTouchedSoundData.data, this.#scene);
        soundsRepo[SoundsFX.LOOSE] = new Sound("looseSound", looseSoundData.data, this.#scene);
        resolve(true);
      }

    });


  }

  loop() {
    // Render every frame
    const divFps = document.getElementById("fps");
    this.#engine.runRenderLoop(() => {

      this.#inputController.update();

      if (gameState == States.STATE_MENU) {



      }
      else if (gameState == States.STATE_START_INTRO) {
        this.#camera.setTarget(this.#cameraGameTarget);
        changeGameState(States.STATE_INTRO);
        this.launchCameraAnimation(() => {
          changeGameState(States.STATE_LAUNCH);
        });
      }
      else if (gameState == States.STATE_INTRO) {
        //RAS
      }
      else if (gameState == States.STATE_START_GAME) {
        Engine.audioEngine.unlock();
        changeGameState(States.STATE_LAUNCH);
      }
      else if (gameState == States.STATE_LAUNCH) {
        this.#ball.launch(BALL_LAUNCH_VX, 0, BALL_LAUNCH_VZ);
        changeGameState(States.STATE_RUNNING);
      }
      else if (gameState == States.STATE_LOOSE) {
        this.#ball.reset();
        this.#ball.launch(BALL_LAUNCH_VX, 0, BALL_LAUNCH_VZ);
        changeGameState(States.STATE_RUNNING);
      }
      else if (gameState == States.STATE_RUNNING) {

        //Update paddle
        this.#paddle.checkInput();
        this.#paddle.update();

        //Update ball
        this.#ball.update();

        //Update bricks
        this.#brickManager.update();
        if (this.#brickManager.isLevelFinished()) {
          //..??
          this.#brickManager.reset();
          this.#ball.launch(0.25, 0, 0.5);
        }
      }

      //Render : (auto)

      //Debug
      if (this.#inputController.actions["KeyD"]) {
        this.#bInspector = !this.#bInspector;
        if (this.#bInspector) {
          debugBox.setEnabled(true);
          Inspector.Show(this.#scene, { embedMode: true });
          console.log(this.#camera);
          this.#camera.attachControl(this.#canvas, true);

        }
        else {
          debugBox.setEnabled(false);
          Inspector.Hide();
          this.#camera.detachControl();
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
    wallMaterial.diffuseTexture.uScale = 5;
    wallMaterial.diffuseTexture.vScale = 5 / 5;

    wallMaterial.bumpTexture = new Texture(wallNormalUrl);
    wallMaterial.bumpTexture.uScale = 5;
    wallMaterial.bumpTexture.vScale = 5 / 5;

    wallMaterial.ambientTexture = new Texture(wallAmbientUrl);
    wallMaterial.ambientTexture.uScale = 5;
    wallMaterial.ambientTexture.vScale = 5 / 5;

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
    /*
        this.#hightLightLayer.addMesh(lWall, new Color3(0.35, 0.35, 0.7));
        this.#hightLightLayer.addMesh(tWall, new Color3(0.35, 0.35, 0.7));
        this.#hightLightLayer.addMesh(rWall, new Color3(0.35, 0.35, 0.7));
    */
  }

  LoadEntity(
    name,
    meshNameToLoad,
    url,
    file,
    manager,
    meshArray,
    entity_number,
    props,
    scene,
    shadowGenerator,
    bAddPhysics
  ) {
    const meshTask = manager.addMeshTask(name, meshNameToLoad, url, file);

    meshTask.onSuccess = function (task) {
      const parent = task.loadedMeshes[0];
      /*      const obj = parent.getChildMeshes()[0];
            obj.setParent(null);
            parent.dispose();*/

      meshArray[entity_number] = parent;
      meshArray[entity_number].position = Vector3.Zero();
      meshArray[entity_number].rotation = Vector3.Zero();

      if (props) {
        if (props.scaling) {
          meshArray[entity_number].scaling.copyFrom(props.scaling);
        }
        if (props.position) {
          meshArray[entity_number].position.copyFrom(props.position);
        }
      }

      if (shadowGenerator)
        shadowGenerator.addShadowCaster(parent);
      parent.receiveShadows = true;
      for (let mesh of parent.getChildMeshes()) {
        mesh.receiveShadows = true;
      }
      if (bAddPhysics === true) {
        new PhysicsAggregate(
          parent,
          PhysicsShapeType.MESH,
          { mass: 1, restitution: 0.88 },
          scene
        );
      }
    };
    meshTask.onError = function (e) {
      console.log(e);
    };
  }

  showGUI() {
    // GUI
    
    this.#guiTexture.rootContainer.isVisible = true;
  }
  hideGUI() {
    this.#guiTexture.rootContainer.isVisible = false;
  }
  gotoMenuCamera() {
    let guiParent = this.#scene.getNodeByName(StartButtonMeshTarget); 
    this.#camera.position = this.#cameraMenuPosition;
    this.#camera.setTarget(guiParent.getAbsolutePosition());       
  }

  gotoGameCamera() {
    this.#camera.position = this.#cameraGamePosition;
    this.#camera.setTarget(this.#cameraGameTarget);
  }

  async loadGUI() {
        // GUI
        let guiParent = this.#scene.getNodeByName(StartButtonMeshTarget); 
        this.#camera.setTarget(guiParent.getAbsolutePosition());

        var startGameButton = MeshBuilder.CreateBox("startGameButton", {size:20});

        startGameButton.position = guiParent.getAbsolutePosition();
        startGameButton.rotation.x = -Math.PI/2;

    this.#guiTexture = AdvancedDynamicTexture.CreateForMesh(startGameButton);

    var button1 = Button.CreateSimpleButton("but1", "START");
    button1.width = 5;
    button1.height = 5;
    button1.color = "white";
    button1.fontSize = 50;
    button1.background = "";
    button1.onPointerUpObservable.add(() => {
        this.hideGUI();
        changeGameState(States.STATE_START_INTRO);
    });
    this.#guiTexture.addControl(button1);
    this.gotoMenuCamera();
    this.showGUI();

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
