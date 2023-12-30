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


import wallBaseColorUrl from "../assets/textures/Metal_Plate_011_SD/Metal_Plate_011_basecolor.jpg";
import wallNormalUrl from "../assets/textures/Metal_Plate_011_SD/Metal_Plate_011_normal.jpg";
import wallAmbientUrl from "../assets/textures/Metal_Plate_011_SD/Metal_Plate_011_ambientOcclusion.jpg";

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
import { AdvancedDynamicTexture, Button, Control, TextBlock } from "@babylonjs/gui";

import "./levels";
import { levelsDef } from "./levels";

const bricksRows = 16;
const bricksCols = 13;
const brickWidth = 6;
const brickHeight = 2.5;
const brickPaddingX = 0.5;
const brickPaddingZ = 0.5;

let bricksType = [];


const largeur = (bricksCols * brickWidth);
const profondeur = (bricksRows * brickHeight);
const profondeurWalls = profondeur + 45;

const hauteurWalls = 5;
const epaisseurWalls = 2;

const BALL_SPEED_FACTOR = 1.7;

const baseZBall = -30;
const ballRadius = 0.75;
const paddleWidth = 9;
const paddleRadius = 0.6;
const baseZPaddle = baseZBall - paddleRadius*2 ;
const offArea = baseZPaddle - paddleRadius*8;

const WORLD_MIN_X = -brickWidth + (epaisseurWalls / 2) + ballRadius;
const WORLD_MAX_X = (largeur) - (epaisseurWalls / 2) - ballRadius;


const PADDLE_MIN_X = (WORLD_MIN_X + paddleWidth / 2) - ballRadius;
const PADDLE_MAX_X = (WORLD_MAX_X - paddleWidth / 2) + ballRadius;


const WORLD_MIN_Y = -5;
const WORLD_MAX_Y = 5;

const WORLD_MIN_Z = offArea;
const WORLD_MAX_Z = profondeur;

const BALL_LAUNCH_VX = 0.15;
const BALL_LAUNCH_VZ = 0.5;

const StartButtonMeshTarget = "Object_351";
//const StartButtonMeshTarget = "panel_plate.001_140";

let debugMaterial;
let debugBox;
let explosionParticleSystem;
let shadowGenerator;


const START_LIVES = 3;
const MAX_LIVES = 5;
let nbLives = START_LIVES;
let currentScore = 0;
let currentHighScore = 0;
let currentLevel = 1;

let gameState;
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

  applyVelocities(factor) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.prevZ = this.z;

    factor = factor || 1;
  
    this.x = this.x + (this.vx * factor);
    this.y = this.y + (this.vy * factor);
    this.z = this.z + (this.vz * factor);
    
  }

}

class Paddle extends Entity {

  #inputController;

  constructor(x, y, z, inputController) {
    super(x, y, z);

    this.#inputController = inputController;
    this.gameObject = new MeshBuilder.CreateCapsule("capsule", { radius: paddleRadius, capSubdivisions: 6, subdivisions: 6, tessellation: 36, height: paddleWidth, orientation: Vector3.Left() });
    shadowGenerator.addShadowCaster(this.gameObject);

    let trailMaterial = new StandardMaterial('reactMat');
    let color = new Color3(0.2, 0.4, 1);

    trailMaterial.emissiveColor = color;
    trailMaterial.diffuseColor = color;
    trailMaterial.specularColor = new Color3(1, 1, 1);


    let lReact = new MeshBuilder.CreateCylinder("lReact", { height: paddleRadius + 0.2, diameter: paddleRadius * 3.0 });
    lReact.position.x = -paddleWidth / 3;
    lReact.rotation.z = -Math.PI / 2;

    lReact.material = trailMaterial;
    lReact.setParent(this.gameObject);

    let rReact = new MeshBuilder.CreateCylinder("rReact", { height: paddleRadius + 0.2, diameter: paddleRadius * 3.0 });
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
    const DRAG_FORCE = 0.7;
    const PADDLE_ACC_X = 0.7;
    const MAX_VELOCITY = 10;

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
    if (this.x > PADDLE_MAX_X)
      this.x = PADDLE_MAX_X;
    else if (this.x < PADDLE_MIN_X)
      this.x = PADDLE_MIN_X;

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

    this.applyVelocities(BALL_SPEED_FACTOR);

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

      let brickAtBall = this.#brickManager.isBrickAtRowCol(brickCol, brickRow);
      if (brickAtBall) {
        let bBothTestFailed = true;
        //On verifie d'ou on venait
        let prevBrickCol = this.#brickManager.getBrickCol(this.prevX);
        let prevBrickRow = this.#brickManager.getBrickRow(this.prevZ);

        if (prevBrickCol != brickCol) {
          let brickAtXminus = this.#brickManager.isBrickAtRowCol(prevBrickCol, brickRow);

          if (!brickAtXminus) {
            this.vx = -this.vx;
            bBothTestFailed = false;
          }
        }
        if (prevBrickRow != brickRow) {
          let brickAtZminus = this.#brickManager.isBrickAtRowCol(brickCol, prevBrickRow);

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
      this.z = this.#paddle.z + paddleRadius;
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
    this.type = Scalar.Clamp(Math.floor(type), -1, 6);

    if (this.type < 0 || model == null) {
      this.bAlive = false;
    }
    else {
      // Our built-in 'sphere' shape.
      this.gameObject = model.createInstance(`brick${index}`);
      this.gameObject.setParent(parent);
      //this.gameObject.receiveShadows = true;
      shadowGenerator.addShadowCaster(this.gameObject, true);


      this.#explosionParticleSystem = explosionParticleSystem.clone(`exp${index}`);
      this.#explosionParticleSystem.worldOffset = new Vector3(this.x, this.y, this.z);
      // this.#explosionParticleSystem.targetStopDuration = 5; 

      this.updatePosition();
    }

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
        color: new Color3(0.0, 1, 0.0),
        material: new StandardMaterial("brickMat0"),
      },
      {
        model: MeshBuilder.CreateBox(`brick1`, options),
        color: new Color3(0.1, 0.0, 1.0),
        material: new StandardMaterial("brickMat1"),
      },
      {
        model: MeshBuilder.CreateBox(`brick2`, options),
        color: new Color3(0.0, 0.0, 1),
        material: new StandardMaterial("brickMat2"),
      },
      {
        model: MeshBuilder.CreateBox(`brick3`, options),
        color: new Color3(0.0, 1, 1),
        material: new StandardMaterial("brickMat3"),
      },
      {
        model: MeshBuilder.CreateBox(`brick4`, options),
        color: new Color3(1, 0.0, 0.0),
        material: new StandardMaterial("brickMat4"),
      },
      {
        model: MeshBuilder.CreateBox(`brick5`, options),
        color: new Color3(0.25, 0.25, 0.25),
        material: new StandardMaterial("brickMat5"),
      },
      {
        model: MeshBuilder.CreateBox(`brick6`, options),
        color: new Color3(1, 1, 1),
        material: new StandardMaterial("brickMat6"),
      },
      {
        model: MeshBuilder.CreateBox(`brick7`, options),
        color: new Color3(1, 0.5, 0),
        material: new StandardMaterial("brickMat6"),
      }
    ];

    this.#parent = new TransformNode("bricks");

    for (let brickType of bricksType) {
      brickType.model.receiveShadows = false;
      brickType.model.isVisible = false;

      brickType.material.diffuseTexture = new Texture(wallBaseColorUrl);
            /*
      brickType.material.diffuseTexture = new Texture(brickBaseColorUrl);
      brickType.material.diffuseTexture.uScale = 1;
      brickType.material.diffuseTexture.vScale = 1;*/
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

    this.loadLevel();
  }

  reset() {
    this.#bricks = [];
    this.#iLiveBricks = 0;
  }

  loadLevel() {
    this.reset();

    //Load level
    let levelToLoad = currentLevel;
    if (levelToLoad > levelsDef.length)
      levelToLoad = levelsDef.length;

    let currentLevelMatrix = levelsDef[levelToLoad-1];

    for (let j = 0; j < bricksRows; j++) {
      for (let i = 0; i < bricksCols; i++) {
        let index = j * bricksCols + i;
        let x = i * brickWidth;
        let y = 0;
        let z = j * brickHeight;
        let car = currentLevelMatrix[(bricksRows-1)-j].charAt(i);
        if (car === " ") {
          let uneBrique = new BrickObj(index, -1, x, y, z, null, this.#parent);
          this.#bricks[index] = uneBrique;
          this.#bricks[index].bAlive = false;
        }
        else {

          let type;
          try {
            type = parseInt(car, 10);
          } catch(e) {
            type = 0;
          }
  
          let model = bricksType[type].model;
          let uneBrique = new BrickObj(index, type, x, y, z, model, this.#parent);
  
  
          this.#bricks[index] = uneBrique;
          this.#bricks[index].bAlive = true;
          this.#iLiveBricks++;
        }
      }
    }          
/*
      for (let j = 0; j < bricksRows; j++) {
        for (let i = 0; i < bricksCols; i++) {
          let index = j * bricksCols + i;
          let brick = this.#bricks[index];
          brick.bAlive = true;
          brick.setVisible(true);
          this.#iLiveBricks++;
          }
      }*/
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
        return this.#bricks[index];
    }
    return null;
  }

  isBrickAtRowCol(xpos, zpos) {
    if (xpos >= 0 && xpos < bricksCols && zpos >= 0 && zpos < bricksRows) {
      let index = zpos * bricksCols + xpos;
      if (index >= 0 && index < this.#bricks.length)
        return this.#bricks[index].bAlive;
    }
    return false;
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

      //var that = this.#bricks[index];

      /*ParticleHelper.CreateAsync("explosion").then((set) => {

        set.systems.forEach(s => {
            s.disposeOnStop = true;
            s.worldOffset = new Vector3(that.x, that.y, that.z);
          
        });
        set.start();
    });*/

      currentScore += 10 * (this.#bricks[index].type + 1);
    }

  }

  draw() {


  }


}

const States = Object.freeze({
  STATE_NONE: 0,
  STATE_INIT: 10,
  STATE_LOADING: 20,
  STATE_PRE_INTRO: 22,
  STATE_MENU: 25,
  STATE_START_INTRO: 28,
  STATE_INTRO: 30,
  STATE_START_GAME: 35,
  STATE_LAUNCH: 40,
  STATE_RUNNING: 50,
  STATE_PAUSE: 60,
  STATE_LOOSE: 70,
  STATE_GAME_OVER: 80,
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
  #bPause;

  #ground;
  #skySphere;

  #paddle;
  #ball;
  #walls;

  #brickManager;
  #bInspector = false;
  #inputController;

  #myMeshes = [];
  #menuUiTexture;
  #gameUI;

  #cameraStartPosition = new Vector3(-257, 566, -620);
  #cameraMenuPosition = new Vector3(-199, 88, -360);

  #cameraGamePosition = new Vector3(38.95, 106.82, -41);
  #cameraGameTarget = new Vector3(39.665, 10, -12);

  constructor(canvas, engine) {
    this.#canvas = canvas;
    this.#engine = engine;
  }

  async start() {
    await this.init();
    this.loadMenuGUI();
    this.loadGameUI();
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
    this.gotoMenuCamera();
    // This attaches the camera to the canvas
    //this.#camera.attachControl(this.#canvas, true);



    // Set up new rendering pipeline
    var pipeline = new DefaultRenderingPipeline("default", true, this.#scene, [this.#camera]);

    pipeline.glowLayerEnabled = true;
    pipeline.glowLayer.intensity = 0.45;
    pipeline.glowLayer.blurKernelSize = 22;
    pipeline.glowLayer.ldrMerge = true;
    

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


    changeGameState(States.STATE_PRE_INTRO);
    this.launchPreIntroAnimation(() => {
      changeGameState(States.STATE_MENU);
    });


  }

  launchGameOverAnimation(callback) {

    const startFrame = 0;
    const endFrame = 400;
    const frameRate = 60;

    var animationcamera = new Animation(
      "GameOverAnimation",
      "position",
      frameRate,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    var keys = [];
    keys.push({
      frame: startFrame,
      value: this.#camera.position.clone(),
      // outTangent: new Vector3(1, 0, 0)
    });
    keys.push({
      frame: endFrame / 2,
      value: new Vector3(39, 177, -550),
    });
    keys.push({
      frame: endFrame,
      // inTangent: new Vector3(-1, 0, 0),
      value: this.#cameraMenuPosition,
    });
    animationcamera.setKeys(keys);

    //------------------TARGET
    var animationcameraTarget = new Animation(
      "GameOverAnimationTarget",
      "target",
      frameRate,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    var keysTarget = [];
    keysTarget.push({
      frame: startFrame,
      value: this.#camera.target.clone(),
      // outTangent: new Vector3(1, 0, 0)
    });
    keysTarget.push({
      frame: endFrame,
      // inTangent: new Vector3(-1, 0, 0),
      value: this.getTargetMenuPosition().clone(),
    });
    animationcameraTarget.setKeys(keysTarget);

    this.#camera.animations = [];
    this.#camera.animations.push(animationcamera);
    this.#camera.animations.push(animationcameraTarget);

    this.#scene.beginAnimation(this.#camera, startFrame, endFrame, false, 1, callback);
  }

  launchGameStartAnimation(callback) {

    const startFrame = 0;
    const endFrame = 400;
    const frameRate = 60;

    var animationcamera = new Animation(
      "GameStartAnimation",
      "position",
      frameRate,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    var keys = [];
    keys.push({
      frame: startFrame,
      value: this.#camera.position.clone(),
      // outTangent: new Vector3(1, 0, 0)
    });
    keys.push({
      frame: endFrame / 2,
      value: new Vector3(39, 177, -550),
    });
    keys.push({
      frame: endFrame,
      // inTangent: new Vector3(-1, 0, 0),
      value: this.#cameraGamePosition,
    });
    animationcamera.setKeys(keys);

    //------------------TARGET
    var animationcameraTarget = new Animation(
      "GameStartAnimationTarget",
      "target",
      frameRate,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    var keysTarget = [];
    keysTarget.push({
      frame: startFrame,
      value: this.#camera.target.clone(),
      // outTangent: new Vector3(1, 0, 0)
    });
    keysTarget.push({
      frame: endFrame,
      // inTangent: new Vector3(-1, 0, 0),
      value: this.#cameraGameTarget,
    });

    animationcameraTarget.setKeys(keysTarget);



    this.#camera.animations = [];
    this.#camera.animations.push(animationcamera);
    this.#camera.animations.push(animationcameraTarget);

    this.#scene.beginAnimation(this.#camera, startFrame, endFrame, false, 1, callback);
  }

  launchPreIntroAnimation(callback) {

    const frameRate = 60;
    const startFrame = 0;
    const endFrame = 600;

    var animationcamera = new Animation(
      "PreIntroAnimation",
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
      frame: endFrame / 3,
      value: new Vector3(39, 177, -550),
    });
    keys.push({
      frame: 2 * endFrame / 3,
      // inTangent: new Vector3(-1, 0, 0),
      value: new Vector3(240, 107, -353),
    });
    keys.push({
      frame: endFrame,
      // inTangent: new Vector3(-1, 0, 0),
      value: this.#cameraMenuPosition,
    });
    animationcamera.setKeys(keys);

    //------------------TARGET
    var animationcameraTarget = new Animation(
      "PreIntroAnimationTarget",
      "target",
      frameRate,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    var keysTarget = [];
    keysTarget.push({
      frame: startFrame,
      value: this.#camera.target.clone(),
      // outTangent: new Vector3(1, 0, 0)
    });
    keysTarget.push({
      frame: endFrame,
      // inTangent: new Vector3(-1, 0, 0),
      value: this.getTargetMenuPosition().clone(),
    });

    animationcameraTarget.setKeys(keysTarget);


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
        { position: new Vector3(124, -224.68, -92.87), scaling: new Vector3(-200, 200, 200) },
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
      this.updateAllText();

      if (gameState == States.STATE_PRE_INTRO) {



      }
      else if (gameState == States.STATE_MENU) {



      }
      else if (gameState == States.STATE_START_INTRO) {
        //this.#camera.setTarget(this.#cameraGameTarget);
        changeGameState(States.STATE_INTRO);
        this.launchGameStartAnimation(() => {
          Engine.audioEngine.unlock();
          this.showGameUI(true);
          changeGameState(States.STATE_START_GAME);
        });
      }
      else if (gameState == States.STATE_INTRO) {
        //RAS
      }
      else if (gameState == States.STATE_START_GAME) {
        changeGameState(States.STATE_LAUNCH);
      }
      else if (gameState == States.STATE_LAUNCH) {
        this.#ball.launch(BALL_LAUNCH_VX, 0, BALL_LAUNCH_VZ);
        changeGameState(States.STATE_RUNNING);
      }
      else if (gameState == States.STATE_LOOSE) {
        if (nbLives > 0) {
          nbLives--;
          this.updateTextLives();
          this.#ball.reset();
          this.#ball.launch(BALL_LAUNCH_VX, 0, BALL_LAUNCH_VZ);
          changeGameState(States.STATE_RUNNING);
        }
        else {
          this.resetGame();
          this.showGameUI(false);
          changeGameState(States.STATE_GAME_OVER);
        }
      }
      else if (gameState == States.STATE_GAME_OVER) {
        this.launchGameOverAnimation(() => {
          changeGameState(States.STATE_MENU);
        });
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
          
          currentLevel++;
          currentScore+= 100;
          this.#brickManager.loadLevel();
          this.#ball.launch(0.25, 0, 0.5);
        }
        if (this.#inputController.actions["KeyP"]) {
          this.#bPause = true;
          changeGameState(States.STATE_PAUSE);
        }

      }
      else if (gameState == States.STATE_PAUSE) {
        if (this.#inputController.actions["KeyP"]) {
          this.#bPause = false;
          changeGameState(States.STATE_RUNNING);
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

  resetGame() {
    currentLevel = 1;
    this.#brickManager.loadLevel();
    this.#ball.reset();
    //this.#ball.launch(BALL_LAUNCH_VX, 0, BALL_LAUNCH_VZ);
    nbLives = START_LIVES;    
    if (currentScore > currentHighScore)
      currentHighScore = currentScore;
    currentScore = 0;
  }

  end() { }

  buildWalls() {

    var wallMaterial = new StandardMaterial("wallMaterial", this.#scene);
    wallMaterial.diffuseTexture = new Texture(wallBaseColorUrl);
    wallMaterial.diffuseColor = new Color3(0.25, 0.25, 0.75);
    wallMaterial.diffuseTexture.uScale = 5;
    wallMaterial.diffuseTexture.vScale = 0.5;

    wallMaterial.emissiveColor = new Color3(0.05, 0.05, 0.1);

    wallMaterial.bumpTexture = new Texture(wallNormalUrl);
    wallMaterial.bumpTexture.uScale = 5;
    wallMaterial.bumpTexture.vScale = 0.5;

    wallMaterial.ambientTexture = new Texture(wallAmbientUrl);
    wallMaterial.ambientTexture.uScale = 5;
    wallMaterial.ambientTexture.vScale = 0.5;

    this.#walls = new TransformNode("walls", this.#scene);
    var lWall = MeshBuilder.CreateBox("lWall", { width: profondeurWalls, height: hauteurWalls, depth: epaisseurWalls, wrap: true }, this.#scene);
    lWall.rotation.y = -Math.PI / 2;
    lWall.position.x = -brickWidth;
    lWall.position.z = (profondeur + epaisseurWalls * 2.5) - (profondeurWalls / 2);

    var rWall = MeshBuilder.CreateBox("rWall", { width: profondeurWalls, height: hauteurWalls, depth: epaisseurWalls, wrap: true }, this.#scene);
    rWall.rotation.y = Math.PI / 2;
    rWall.position.x = largeur;
    rWall.position.z = (profondeur + epaisseurWalls * 2.5) - (profondeurWalls / 2);


    var tWall = MeshBuilder.CreateBox("tWall", { width: (largeur + brickWidth), height: hauteurWalls, depth: epaisseurWalls, wrap: true }, this.#scene);
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
        mesh.computeWorldMatrix(true);
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

    this.#menuUiTexture.rootContainer.isVisible = true;
  }
  hideGUI() {
    this.#menuUiTexture.rootContainer.isVisible = false;
  }
  gotoMenuCamera() {
    this.#camera.position = this.#cameraMenuPosition.clone();
    this.#camera.setTarget(this.getTargetMenuPosition());
  }
  getTargetMenuPosition() {
    let guiParent = this.#scene.getNodeByName(StartButtonMeshTarget);
    return guiParent.getAbsolutePosition();
  }

  gotoGameCamera() {
    this.#camera.position = this.#cameraGamePosition.clone();
    this.#camera.setTarget(this.#cameraGameTarget);
  }

  loadMenuGUI() {
    // GUI
    let guiParent = this.#scene.getNodeByName(StartButtonMeshTarget);
    this.#camera.setTarget(guiParent.getAbsolutePosition());

    var startGameButton = MeshBuilder.CreatePlane("startGameButton", { width: 10, depth: 10 });
    startGameButton.scaling = new Vector3(3.5, 20, 10);
    startGameButton.position = new Vector3(-259, 87, -361.3);
    startGameButton.rotation.x = Math.PI / 8;
    startGameButton.rotation.y = -Math.PI / 2;

    this.#menuUiTexture = AdvancedDynamicTexture.CreateForMesh(startGameButton);

    var button1 = Button.CreateSimpleButton("but1", "START");
    button1.width = 0.2;
    button1.height = 0.8;
    button1.color = "white";
    button1.fontSize = 64;
    button1.background = "";
    button1.onPointerUpObservable.add(() => {
      if (gameState == States.STATE_MENU)
        //this.hideGUI();
        changeGameState(States.STATE_START_INTRO);
    });
    this.#menuUiTexture.addControl(button1);
    this.gotoMenuCamera();
    this.showGUI();

  }

  loadGameUI() {
    this.textScale = 1;
    let fontSize = 22 * this.textScale;
    let spacing = 150 * this.textScale;

    this.#gameUI = AdvancedDynamicTexture.CreateFullscreenUI("gameUI");

    //Score
    this.textScore = new TextBlock();
    this.textScore.color = "white";
    this.textScore.fontSize = fontSize;
    this.textScore.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.textScore.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.textScore.left = -spacing * 3;
    this.textScore.top = 20;
    this.#gameUI.addControl(this.textScore);

    // Level
    this.textLevel = new TextBlock();
    this.textLevel.color = "white";
    this.textLevel.fontSize = fontSize;
    this.textLevel.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.textLevel.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
    this.textLevel.left = -spacing;
    this.textLevel.top = 20;
    this.#gameUI.addControl(this.textLevel);

    // High score
    this.textHigh = new TextBlock();
    this.textHigh.color = "white";
    this.textHigh.fontSize = fontSize;
    this.textHigh.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.textHigh.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
    this.textHigh.left = spacing * 3;
    this.textHigh.top = 20;
    this.#gameUI.addControl(this.textHigh);
    
    // Lives
    this.textLives = new TextBlock("Score");
    this.textLives.color = "white";
    this.textLives.fontSize = fontSize;
    
    //this.textLives.fontFamily = '"Press Start 2P"';
    this.textLives.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.textLives.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.textLives.left = spacing;
    this.textLives.top = 20;
    this.#gameUI.addControl(this.textLives);
    this.showGameUI(false);
    
    this.updateAllText();
    window.onresize = () => {
      this.getCanvasSize();
      this.fixTextScale();
    }    
  }
  showGameUI(bActive) {
    this.#gameUI.rootContainer.isVisible = bActive;
  }
  updateAllText() {
    this.updateTextLives();
    this.updateTextScore();
    this.updateTextHighScore();
    this.updateTextLevel();
  }
  updateTextLives() {
    this.textLives.text = `Vies : ${nbLives}`;
  }
  updateTextScore() {
    this.textScore.text = `Score : ${currentScore}`;
  }
  updateTextHighScore() {
    this.textHigh.text = `High Score : ${currentHighScore}`;
  }
  
  updateTextLevel() {
    this.textLevel.text = `Lvl : ${currentLevel}`;
  }

  
  getCanvasSize() {
    this.canvasWidth = document.querySelector("canvas").width;
    this.canvasHeight = document.querySelector("canvas").height;
  }

  fixTextScale() {
    this.textScale = Math.min(1, this.canvasWidth / 1280);
    let fontSize = 22 * this.textScale;
    let spacing = 150 * this.textScale;
    this.textLives.fontSize = fontSize;
    this.textLives.left = spacing;
    this.textScore.fontSize = fontSize;
    this.textLevel.fontSize = fontSize;
    this.textHigh.fontSize = fontSize;
    this.textScore.left = -spacing * 3;
    this.textLevel.left = -spacing;
    this.textHigh.left = spacing * 3;
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
