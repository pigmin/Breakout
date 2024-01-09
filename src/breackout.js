//Breakout

import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder, Scalar, StandardMaterial, Color3, Color4, TransformNode, KeyboardEventTypes, DefaultRenderingPipeline, ArcRotateCamera, HighlightLayer, AssetsManager, ParticleSystem, ShadowGenerator, DirectionalLight, Sound, Animation, Engine, GamepadManager, VideoTexture } from "@babylonjs/core";



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

import bonusBaseColorUrl from "../assets/textures/Ice_001_COLOR.jpg";

import paddleBaseColorUrl from "../assets/textures/Metal_Plate_017_basecolor.jpg";
import paddleNormalUrl from "../assets/textures/Metal_Plate_017_normal.jpg";

import groundBaseColorUrl from "../assets/textures/Metal_Plate_Sci-Fi_001_SD/Metal_Plate_Sci-Fi_001_basecolor.jpg";
import groundNormalUrl from "../assets/textures/Metal_Plate_Sci-Fi_001_SD/Metal_Plate_Sci-Fi_001_normal.jpg";

import particleExplosionUrl from "../assets/particles/systems/particleSystem.json"
import particleExplosionTextureUrl from "../assets/particles/textures/dotParticle.png"

import screenVideoTextureUrl from "../assets/textures/Future Crew - Second Reality (360p no SOUND).mp4";

import musicUrl1 from "../assets/musics/2ND_PM.mp3";
/*import musicUrl2 from "../assets/musics/Eric Cubizolle - Andromeda.mp3";
import musicUrl3 from "../assets/musics/Eric Cubizolle - Kain.mp3";
*/

//import boingSoundUrl from "../assets/sounds/446100__justinvoke__bounce.wav";
import brickTouchedSoundUrl1 from "../assets/sounds/Arkanoid SFX (7).wav";
import brickTouchedSoundUrl2 from "../assets/sounds/Arkanoid SFX (8).wav";
import hardBrickTouchedSoundUrl from "../assets/sounds/hard_brick.mp3";
import paddleTouchedSoundUrl from "../assets/sounds/Arkanoid SFX (6).wav";
import looseSoundUrl from "../assets/sounds/Arkanoid SFX (2).wav";

import bonusLifeSoundUrl from "../assets/sounds/Arkanoid SFX (9).wav";
import bonusGrowSoundUrl from "../assets/sounds/Arkanoid SFX (4).wav";


import roomModelUrl from "../assets/models/secret_area-52__room.glb";
import monitorModelUrl from "../assets/models/old_monitor_with_screen.glb";

import flareParticleTextureUrl from "../assets/particles/textures/Flare.png";
import { AdvancedDynamicTexture, Button, Control, TextBlock } from "@babylonjs/gui";


import { levelsDef } from "./levels";

const BRICKS_ROWS = 25;
const BRICKS_COLS = 13;
const BRICK_WIDTH = (18.0 / 3.0);
const BRICK_DEPTH = (7.0 / 3.0);
const BRICK_PADDING_X = (1.0 / 3.0);
const BRICK_PADDING_Z = (1.0 / 3.0);

let bricksTypeDef = [];


const GAME_AREA_WIDTH = (BRICKS_COLS * BRICK_WIDTH);
const GAME_AREA_DEPTH = (BRICKS_ROWS * BRICK_DEPTH);
const WALLS_DEPTH = GAME_AREA_DEPTH + 45;

const WALLS_HEIGHT = 5;
const WALLS_THICKNESS = 2;

const BALL_SPEED_FACTOR = 2.2;

const MIN_P_VELOCITY = 0.2;
const DRAG_FORCE = 0.6;
const PADDLE_ACC_X = 0.7;
const MAX_VELOCITY = 14;


const BASE_Z_BALL = -30;
const BALL_RADIUS = 0.75;
const PADDLE_WIDTH = (30 / 3.0);
const PADDLE_RADIUS = ((5 / 2) / 3.0);
const BASE_Z_PADDLE = BASE_Z_BALL - PADDLE_RADIUS * 2;
const OFF_AREA = BASE_Z_PADDLE - PADDLE_RADIUS * 32;

const WORLD_MIN_X = -BRICK_WIDTH + (WALLS_THICKNESS / 2) + BALL_RADIUS;
const WORLD_MAX_X = (GAME_AREA_WIDTH) - (WALLS_THICKNESS / 2) - BALL_RADIUS;


const WORLD_MIN_Y = -5;
const WORLD_MAX_Y = 5;

const WORLD_MIN_Z = OFF_AREA;
const WORLD_MAX_Z = GAME_AREA_DEPTH;

const BALL_LAUNCH_VX = 0.15;
const BALL_LAUNCH_VZ = 0.5;

const BONUS_VX = 0;
const BONUS_VZ = -0.5;

const START_LIVES = 6;
const MAX_LIVES = 12;

const START_BUTTON_MESH_TARGET = "Object_351";
//const StartButtonMeshTarget = "panel_plate.001_140";

let explosionParticleSystem;
let shadowGenerator;


let nbLives = START_LIVES;
let currentScore = 0;
let currentHighScore = 0;
let currentLevel = 1;
let lastLevel = levelsDef.length;

let gameState;
function changeGameState(newState) {
  gameState = newState;
}

let SoundsFX = Object.freeze({
  BRICK1: 0,
  BRICK2: 1,
  HARD_BRICK: 2,
  PADDLE: 3,
  LOOSE: 4,
  BONUS_LIFE: 5,
  BONUS_GROW: 6,
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

  setPosition(x, y, z) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this.updatePosition();
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
  #scene;
  #temporaryGrowFactor;
  #temporaryGrowEndTime;

  #paddleMinX = (WORLD_MIN_X + PADDLE_WIDTH / 2) - BALL_RADIUS;
  #paddleMaxX = (WORLD_MAX_X - PADDLE_WIDTH / 2) + BALL_RADIUS;


  constructor(x, y, z, inputController, scene) {
    super(x, y, z);

    this.#scene = scene;
    this.#inputController = inputController;
    this.gameObject = new MeshBuilder.CreateCapsule("capsule", { radius: PADDLE_RADIUS, capSubdivisions: 8, subdivisions: 1, tessellation: 8, height: PADDLE_WIDTH, orientation: Vector3.Left() });
    shadowGenerator.addShadowCaster(this.gameObject);

    let trailMaterial = new StandardMaterial('reactMat');

    //trailMaterial.emissiveColor = new Color3(0.2, 0, 0);
    trailMaterial.diffuseColor = new Color3(1, 0, 0);
    trailMaterial.specularColor = new Color3(0.9, 0.6, 0.6);


    let lReact = new MeshBuilder.CreateCylinder("lReact", { height: PADDLE_RADIUS + 0.6, diameter: PADDLE_RADIUS * 2.5 });
    lReact.position.x = -PADDLE_WIDTH / 3;
    lReact.rotation.z = -Math.PI / 2;

    lReact.material = trailMaterial;
    lReact.setParent(this.gameObject);

    let rReact = new MeshBuilder.CreateCylinder("rReact", { height: PADDLE_RADIUS + 0.6, diameter: PADDLE_RADIUS * 2.5 });
    rReact.position.x = PADDLE_WIDTH / 3;
    rReact.rotation.z = -Math.PI / 2;
    rReact.material = trailMaterial;
    rReact.setParent(this.gameObject);


    var paddleMaterial = new StandardMaterial("paddleMaterial");
    var paddleTexture = new Texture(paddleBaseColorUrl);
    var paddleNormalTexture = new Texture(paddleNormalUrl);
    paddleMaterial.diffuseTexture = paddleTexture;
    paddleMaterial.bumpTexture = paddleNormalTexture;

    paddleMaterial.diffuseColor = new Color3(1, 1, 1.0);
    paddleMaterial.emissiveColor = new Color3(0.345, 0.345, 0.354);
    //ballMaterial.bumpTexture = new Texture(rockTextureNormalUrl);

    this.gameObject.material = paddleMaterial;

    this.createParticles(lReact, "lReact", new Vector3(0, -1, 0));
    this.createParticles(rReact, "rReact", new Vector3(0, 1, 0));

    this.#temporaryGrowFactor = 1.0;
    this.#temporaryGrowEndTime = 0;


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


    if (Math.abs(this.vx) > MIN_P_VELOCITY)
      this.vx = this.vx * DRAG_FORCE;
    else
      this.vx = 0;


    console.log(this.#inputController.xpos);
    if (this.#inputController.inputMap["ArrowLeft"] || this.#inputController.moveX < 0) {
      this.vx -= PADDLE_ACC_X;
      if (this.vx < -MAX_VELOCITY)
        this.vx = -MAX_VELOCITY;
    }
    else if (this.#inputController.inputMap["ArrowRight"] || this.#inputController.moveX > 0) {
      this.vx += PADDLE_ACC_X;
      if (this.vx > MAX_VELOCITY)
        this.vx = MAX_VELOCITY;
    }
  }

  update() {

    if (this.#temporaryGrowEndTime > 0 && this.#temporaryGrowEndTime < performance.now())
      this.grow(false);

    this.applyVelocities();

    //Walls collisions
    if (this.x > this.#paddleMaxX)
      this.x = this.#paddleMaxX;
    else if (this.x < this.#paddleMinX)
      this.x = this.#paddleMinX;

    this.updatePosition();

  }

  getLeftX() {
    return this.x - (PADDLE_WIDTH * this.#temporaryGrowFactor) / 2;
  }

  getRightX() {
    return this.x + (PADDLE_WIDTH * this.#temporaryGrowFactor) / 2;
  }

  grow(bGrowing) {

    if (bGrowing) {
      //animate to grow
      this.#temporaryGrowFactor = 1.5;

      if (this.#temporaryGrowEndTime == 0)
        this.growAnimation(false);

      this.#temporaryGrowEndTime = performance.now() + 20000;
    }
    else {
      this.#temporaryGrowEndTime = 0;
      this.#temporaryGrowFactor = 1.0;
      this.growAnimation(true);
    }
    // this.gameObject.scaling.x = this.#temporaryGrowFactor;
    //On recalcule les min/max
    this.#paddleMinX = (WORLD_MIN_X + (PADDLE_WIDTH * this.#temporaryGrowFactor) / 2) - BALL_RADIUS;
    this.#paddleMaxX = (WORLD_MAX_X - (PADDLE_WIDTH * this.#temporaryGrowFactor) / 2) + BALL_RADIUS;
  }

  reset() {
    //glue 
    this.grow(false);
  }


  growAnimation(bReverse) {

    const startFrame = 0;
    const endFrame = 60;
    const frameRate = 60;

    var animation = new Animation(
      "GrowingAnimation",
      "scaling.x",
      frameRate,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    var keys = [];
    keys.push({
      frame: startFrame,
      value: 1
    });
    keys.push({
      frame: endFrame,
      value: this.#temporaryGrowFactor,
    });
    animation.setKeys(keys);

    this.gameObject.animations = [];
    this.gameObject.animations.push(animation);

    if (bReverse)
      this.#scene.beginAnimation(this.gameObject, endFrame, startFrame, false, 1);
    else
      this.#scene.beginAnimation(this.gameObject, startFrame, endFrame, false, 1);
  }

}


class Ball extends Entity {

  #brickManager;
  #bonusManager;
  #paddle;
  #trail;
  #comboTouch;
  #currentTurbo;
  #lastDateTouch;
  #temporarySpeedFactor;
  #temporarySlowEndTime;
  
  constructor(x, y, z, brickManager, paddle, bonusManager, bHide) {
    super(x, y, z);
    this.#brickManager = brickManager;
    this.#paddle = paddle;
    this.#bonusManager = bonusManager;
    this.#comboTouch = 0;
    this.#currentTurbo = 0;
    this.#lastDateTouch = 0;
    this.#temporarySpeedFactor = 1.0;
    this.#temporarySlowEndTime = 0;

    var ballMaterial = new StandardMaterial("ballMaterial");
    ballMaterial.diffuseColor = new Color3(1, 1, 1);
    ballMaterial.emmisiveColor = new Color3(0.6, 1, 0.6);
    //ballMaterial.bumpTexture = new Texture(rockTextureNormalUrl);


    const options = {
      segments: 16,
      diameter: BALL_RADIUS * 2
    };

    // Our built-in 'sphere' shape.
    this.gameObject = MeshBuilder.CreateSphere("ball", options);
    this.gameObject.receiveShadows = false;
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

    if (bHide)
      this.setVisible(false);

  }
  setVisible(bVisible) {
    this.gameObject.setEnabled(bVisible);
    this.#trail.setEnabled(bVisible);
  }

  destroy() {
    this.gameObject.dispose();
  }

  launch(vx, vy, vz) {
    this.#comboTouch = 0;
    this.#currentTurbo = 0;
    this.#lastDateTouch = 0;
    this.vx = vx;
    this.vy = vy;
    this.vz = vz;
    this.setVisible(true);
    this.#temporarySpeedFactor = 1.0;
    this.isAlive = true;
  }

  reset() {
    this.#comboTouch = 0;
    this.#currentTurbo = 0;
    this.#lastDateTouch = 0;
    this.x = this.#paddle.x;
    this.y = 0;
    this.z = BASE_Z_BALL;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.#temporarySpeedFactor = 1.0;
    this.isAlive = false;
    this.updatePosition();
  }

  slowDown(bSlowDown) {
    if (bSlowDown) {

      this.#temporarySlowEndTime = performance.now() + 5000;
      this.#temporarySpeedFactor = 0.5;
    }
    else {
      this.#temporarySlowEndTime = 0;
      this.#temporarySpeedFactor = 1.0;
    }
  }

  glue() {

  }


  update() {

    if (this.#temporarySlowEndTime > 0 && this.#temporarySlowEndTime < performance.now())
      this.slowDown(false);

    this.applyVelocities(this.#temporarySpeedFactor * (BALL_SPEED_FACTOR + this.#currentTurbo));

    //Walls collisions
    if (this.x > WORLD_MAX_X) {
      this.x = WORLD_MAX_X;
      this.vx = -this.vx;
      //playSound(SoundsFX.BOING);
    }
    else if (this.x < WORLD_MIN_X) {
      this.x = WORLD_MIN_X;
      this.vx = -this.vx;
    }

    //Future use (bouncing ball ?)
    if ((this.y > WORLD_MAX_Y) || (this.y < WORLD_MIN_Y)) {
      this.vy = -this.vy;
      //playSound(SoundsFX.BOING);
    }

    if ((this.z > WORLD_MAX_Z)) {
      //playSound(SoundsFX.BOING);
      this.z = WORLD_MAX_Z;
      this.vz = -this.vz;
    }
    else if (this.z < WORLD_MIN_Z) {
      this.isAlive = false;
      playSound(SoundsFX.LOOSE);
    }

    if (this.isAlive) {

      //Bricks collisions, col/row based, todo : pixel based more accurate
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


        let brickDestroyed = this.#brickManager.touchBrickAt(this.x, this.y, this.z);
        let currentDate = performance.now();
        let delta = currentDate - this.#lastDateTouch;
        this.#lastDateTouch = currentDate;
        if (delta > 0 && delta < 2000) {
          this.#comboTouch++;
          this.#currentTurbo = Math.min(this.#comboTouch / 20, 2.5);
        }
        else
          this.#comboTouch = 0;

        //Bonus ?
        if (brickDestroyed) {
          playSound(getRandomInt(1) + SoundsFX.BRICK1);
          this.#bonusManager.randomLaunch(this.x, this.y, this.z);
        }
        else {
          playSound(SoundsFX.HARD_BRICK);
        }

      }

      //Check collisions avec paddle
      this.checkPaddleCollision();
    }

    this.updatePosition();

    return this.isAlive;
  }

  checkPaddleCollision() {
    let lx = this.x - BALL_RADIUS;
    let rx = this.x + BALL_RADIUS;

    let plx = this.#paddle.getLeftX();
    let prx = this.#paddle.getRightX();

    let dz = Math.sqrt((this.z - this.#paddle.z) * (this.z - this.#paddle.z));
    if (this.isAlive && this.z < (this.#paddle.z + PADDLE_RADIUS) && dz < 1 && (lx <= prx && rx >= plx)) {
      this.#comboTouch = 0;
      this.vz = -this.vz;
      this.z = this.#paddle.z + PADDLE_RADIUS;
      let distanceFromPaddle = (this.x - this.#paddle.x);
      this.vx = distanceFromPaddle * 0.12;
      playSound(SoundsFX.PADDLE);
    }

  }
}


class BallsManager {

  #paddle;
  #brickManager;
  #bonusManager;

  #parent;
  #balls = [];
  #iLiveBalls = 0;


  constructor(paddle, brickManager, bonusManager) {
    this.#paddle = paddle;
    this.#brickManager = brickManager;
    this.#bonusManager = bonusManager;

    
    let ball1 = new Ball(this.#paddle.x, 0, BASE_Z_BALL, this.#brickManager, this.#paddle, this.#bonusManager, false);
    let ball2 = new Ball(this.#paddle.x, 0, BASE_Z_BALL, this.#brickManager, this.#paddle, this.#bonusManager, true);
    let ball3 = new Ball(this.#paddle.x, 0, BASE_Z_BALL, this.#brickManager, this.#paddle, this.#bonusManager, true);

    this.#balls.push(ball1);
    this.#balls.push(ball2);
    this.#balls.push(ball3);
    

  }
  positionMainBallAtPaddle() {
    this.#balls[0].x = this.#paddle.x;
  }

  launchMainBall(vx, vy, vz) {
    this.#iLiveBalls = 1;
    this.#balls[0].launch(vx, vy, vz);
  }

  reset() {
    this.#iLiveBalls = 0;
    for (let i = 0; i < this.#balls.length; i++) {
      let ball = this.#balls[i];
      ball.reset();
      if (i == 0)
        ball.setVisible(true);
      else
        ball.setVisible(false);
    }
  }

  slowDown(bSlowDown) {
    for (let ball of this.#balls) 
      ball.slowDown(bSlowDown);
  }

  glue() {
    for (let ball of this.#balls) 
      ball.glue();
      
  }

  bonusMultiBalls() {

    let bPair = false;
    let activeBall = 0;
    for (let i = 0; i < this.#balls.length; i++) {
      if (this.#balls[i].isAlive) {
        activeBall = this.#balls[i];
        break;
      }
    }

    for (let i = 0; i < this.#balls.length; i++) {
      let ball = this.#balls[i];

      if (!ball.isAlive) {
        ball.x = activeBall.x;
        ball.y = activeBall.y;
        ball.z = activeBall.z;
        if (bPair)
          ball.launch(-BALL_LAUNCH_VX, 0, BALL_LAUNCH_VZ);
        else
          ball.launch(BALL_LAUNCH_VX, 0, BALL_LAUNCH_VZ);

        bPair = !bPair;
      }
    }
  }


  update(bPlaying) {
    this.#iLiveBalls = 0;
    for (let ball of this.#balls) {
      if (ball.update())
        this.#iLiveBalls++;
    }
    
    if (bPlaying && this.#iLiveBalls == 0)
        changeGameState(States.STATE_LOOSE);

  }
 

}


const BONUS_RADIUS = 1.2;
const BONUS_HEIGHT = 5;

let bonusesTypeDef = [];

class BonusObj extends Entity {

  #paddle;
  type = 0;
  isAlive = true;
  isTouched = false;
  #explosionParticleSystem
  #amountRotZ;
  #amountRotX;

  constructor(index, bonusType, x, y, z, parent, paddle) {
    super(x, y, z);

    this.#paddle = paddle;
    this.type = bonusType.type;
    this.isAlive = true;
    this.isTouched = false;
    this.score = bonusType.score;
    this.callback = bonusType.callback;

    // Our built-in 'sphere' shape.
    this.gameObject = bonusType.model.createInstance(`bonusInstance${index}`);
    this.gameObject.rotation = new Vector3(Math.PI / 12, Math.PI / 8, Math.PI / 2);
    this.gameObject.setParent(parent);
    //this.gameObject.receiveShadows = true;
    shadowGenerator.addShadowCaster(this.gameObject, true);

    this.updatePosition();
  }

  destroy() {
    this.gameObject.dispose();
  }

  launch(vx, vy, vz) {
    this.vx = vx;
    this.vy = vy;
    this.vz = vz;
    this.isAlive = true;
    this.isTouched = false;
    this.#amountRotX = Scalar.RandomRange(0.05, 0.25);
    this.#amountRotZ = Scalar.RandomRange(-0.05, 0.05);
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.isAlive = false;
    this.isTouched = false;
    this.updatePosition();
  }


  setVisible(bVisible) {
    this.gameObject.setEnabled(bVisible);
  }


  update() {


    if (this.isAlive) {


      this.applyVelocities();
      this.gameObject.rotation.x += this.#amountRotX;
      this.gameObject.rotation.z += this.#amountRotZ;

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
        //playSound(SoundsFX.LOOSE);
      }


      if (this.isAlive) {

        //Check collisions avec paddle
        this.checkPaddleCollision();
      }
    }

    this.updatePosition();

    return this.isAlive;
  }

  takeBonus() {
    this.isAlive = false;
    this.isTouched = false;
  }

  checkPaddleCollision() {
    let lx = this.x - BONUS_HEIGHT / 2;
    let rx = this.x + BONUS_HEIGHT / 2;

    let plx = this.#paddle.getLeftX();
    let prx = this.#paddle.getRightX();

    let dz = Math.sqrt((this.z - this.#paddle.z) * (this.z - this.#paddle.z));
    if (this.isAlive && dz < 1 && (lx <= prx && rx >= plx)) {
      //BONUS !!
      this.isTouched = true;
      //playSound(SoundsFX.PADDLE);
    }

  }

}

class BonusManager {

  #scene;
  #paddle;

  #parent;
  #ballsManager;
  #bonuses = [];
  #iLiveBonuses = 0;

  constructor(scene, paddle) {
    this.#scene = scene;
    this.#paddle = paddle;

    const options = {
      height: BONUS_HEIGHT,
      radius: BONUS_RADIUS,
    };

    bonusesTypeDef = [
      {
        model: MeshBuilder.CreateCapsule(`bonusModel0`, options),
        color: new Color3(0.0, 1, 0.0),                   //VERT
        material: new StandardMaterial("bonusMat0"),
        score: 10,
        probability: 5,
        callback: this.bonusSlow.bind(this)
      },
      {
        model: MeshBuilder.CreateCapsule(`bonusModel1`, options),
        color: new Color3(1, 0.0, 1.0),                   //VIOLET
        material: new StandardMaterial("bonusMat1"),
        score: 10,
        probability: 5,
        callback: this.bonusLife.bind(this)
      },
      {
        model: MeshBuilder.CreateCapsule(`bonusModel2`, options),
        color: new Color3(0.0, 0.4, 1),                   //BLEU FONCE
        material: new StandardMaterial("bonusMat2"),
        score: 10,
        probability: 5,
        callback: this.bonusGrow.bind(this)
      },
      {
         model: MeshBuilder.CreateCapsule(`bonusModel3`, options),
         color: new Color3(1, 1, 0),                       //JAUNE VIF
         material: new StandardMaterial("bonusMat3"),
         score: 10,
         probability: 5,
         callback: this.bonusMultiBalls.bind(this)
       },
     /*  {
         model: MeshBuilder.CreateCapsule(`bonusModel4`, options),
         color: new Color3(1, 0.0, 0.0),                 //ROUGE
         material: new StandardMaterial("bonusMat4"),
         score: 10,
         probability: 5,
         callback: this.noBonus.bind(this)
       },
       {
         model: MeshBuilder.CreateCapsule(`bonusModel5`, options),
         color: new Color3(1, 1, 1),                     //BLANC
         material: new StandardMaterial("bonusMat5"),
         score: 10,
         probability: 5,
         callback: this.noBonus.bind(this)
       },
       {
         model: MeshBuilder.CreateCapsule(`bonusModel6`, options),
         color: new Color3(1, 0.6, 0),                   //ORANGE
         material: new StandardMaterial("bonusMat6"),
         score: 10,
         probability: 5,
         callback: this.noBonus.bind(this)
       },
       {
         model: MeshBuilder.CreateCapsule(`bonusModel7`, options),
         color: new Color3(0, 1.0, 1.0),               //TURQUOISE
         material: new StandardMaterial("bonusMat7"),
         score: 10,
         probability: 5,
         callback: this.noBonus.bind(this)
       },
       {
         model: MeshBuilder.CreateCapsule(`bonusModel8`, options),
         color: new Color3(0.7, 0.7, 0.0),               //JAUNE FONCE
         material: new StandardMaterial("bonusMat8"),
         score: 10,
         probability: 5,
         callback: this.noBonus.bind(this)
       }*/
    ];

    this.#parent = new TransformNode("bonuses");

    for (let bonusesType of bonusesTypeDef) {
      bonusesType.model.receiveShadows = false;
      bonusesType.model.isVisible = false;

      bonusesType.material.diffuseTexture = new Texture(bonusBaseColorUrl);
      /*
brickType.material.diffuseTexture = new Texture(brickBaseColorUrl);
brickType.material.diffuseTexture.uScale = 1;
brickType.material.diffuseTexture.vScale = 1;*/
      bonusesType.material.diffuseColor = bonusesType.color;

      /*brickType.material.emissiveTexture = new Texture(brickNormalUrl);
      brickType.material.emissiveTexture.uScale = 1;
      brickType.material.emissiveTexture.vScale = 1;
      */
      bonusesType.material.emissiveColor = bonusesType.color;

      bonusesType.model.material = bonusesType.material;
    }


    /*brickMaterial.bumpTexture = new Texture(brickNormalUrl);
    brickMaterial.bumpTexture.uScale = 1;
    brickMaterial.bumpTexture.vScale = 1;
*/
    this.init();
  }

  setBallsManager(ballMgr) {
    this.#ballsManager = ballMgr;
  }

  noBonus() {
    console.log("bonus todo");
  }

  bonusSlow() {
    this.#ballsManager.slowDown(true);
  }

  bonusGrow() {
    this.#paddle.grow(true);
    playSound(SoundsFX.BONUS_GROW);

  }

  bonusLife() {
    if (nbLives < MAX_LIVES) {
      nbLives++;
      playSound(SoundsFX.BONUS_LIFE);
    }
  }

  bonusMultiBalls() {
    this.#ballsManager.bonusMultiBalls();
  }

  init() {


  }

  reset() {
    for (let i = 0; i < this.#bonuses.length; i++) {
      let bonus = this.#bonuses[i];
      if (bonus) {
        bonus.isAlive = false;
        if (bonus.gameObject) {
          bonus.setVisible(false);
          bonus.gameObject.dispose();
        }
      }
    }
    this.#bonuses = [];
    this.#iLiveBonuses = 0;
  }

  loadLevel() {
    this.reset();

  }

  randomLaunch(x, y, z) {

    //35 %
    if (getRandomInt(100) < 305) {
      this.launch(x, y, z);
    }

  }

  launch(x, y, z) {

    //Random for now but need to add some coeff based on levels or brick type
    let type = getRandomInt(bonusesTypeDef.length - 1);
    //    let type = getRandomInt(bonusesTypeDef.length - 1);

    let unBonus = new BonusObj(this.#iLiveBonuses, bonusesTypeDef[type], x, y, z, this.#parent, this.#paddle)

    this.#bonuses.push(unBonus);
    this.#iLiveBonuses++;

    unBonus.launch(BONUS_VX, 0, BONUS_VZ);
  }

  update() {

    for (let bonus of this.#bonuses) {
      if (bonus.isAlive) {
        bonus.update();
        if (bonus.isTouched) {
          bonus.takeBonus();
          //On applique
          bonus.callback();
          //...
        }
      }
    }
    let filteredArray = [];
    for (let bonus of this.#bonuses) {
      if (bonus.isAlive)
        filteredArray.push(bonus);
      else {
        //On supprime
        bonus.destroy();
        this.#iLiveBonuses--;
      }
    }
    this.#bonuses = filteredArray;

  }

  draw() {


  }


}




class BrickObj extends Entity {

  type = 0;
  isAlive = true;
  life = 1;
  #explosionParticleSystem
  #scene;

  constructor(index, brickTypeObj, x, y, z, parent, scene) {
    super(x, y, z);

    this.#scene = scene;

    if (brickTypeObj == null) {
      this.isAlive = false;
    }
    else {
      this.type = brickTypeObj.type;
      this.life = brickTypeObj.life;
      this.score = brickTypeObj.score;
      // Our built-in 'sphere' shape.
      this.gameObject = brickTypeObj.model.createInstance(`brick${index}`);
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
    if (this.gameObject)
      this.gameObject.setEnabled(bVisible);
  }

  /**
   * 
   * @returns true if brick is destroyed
   */
  touch() {
    if (this.isAlive) {
      if (this.life > 0) {
        this.life--;
        if (this.life == 0)
          return true;
      }
    }
    return false;
  }

  explode() {
    this.#explosionParticleSystem.start();


    const startFrame = 0;
    const endFrame = 60;
    const frameRate = 60;

    var animationUp = new Animation(
      "explodingAnimation",
      "position",
      frameRate,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    var keys = [];
    keys.push({
      frame: startFrame,
      value: this.gameObject.position.clone()
    });
    keys.push({
      frame: endFrame,
      value: new Vector3(this.gameObject.position.x + Scalar.RandomRange(-30, 30), this.gameObject.position.y + Scalar.RandomRange(100, 150), this.gameObject.position.z + Scalar.RandomRange(-120, 20))
    });
    animationUp.setKeys(keys);

    var animationRoll = new Animation(
      "explodingAnimation",
      "rotation",
      frameRate,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    keys = [];
    keys.push({
      frame: startFrame,
      value: this.gameObject.rotation.clone()
    });
    keys.push({
      frame: endFrame,
      value: new Vector3(Math.PI / 2 + Scalar.RandomRange(0, Math.PI / 2), Scalar.RandomRange(Math.PI / 2, Math.PI), Math.PI / 2 + Scalar.RandomRange(Math.PI / 4, Math.PI / 2))
    });
    animationRoll.setKeys(keys);


    this.#scene.beginDirectAnimation(this.gameObject, [animationUp, animationRoll], 0, endFrame, false, 1, () => {
      this.setVisible(false);
    });
    //

  }


}

class BrickManager {

  #scene;

  #parent;
  #bricks = new Array(BRICKS_ROWS * BRICKS_COLS);
  #iLiveBricks = 0;

  constructor(scene) {
    this.#scene = scene;

    const options = {
      width: BRICK_WIDTH - BRICK_PADDING_X,
      height: 2,
      depth: BRICK_DEPTH - BRICK_PADDING_Z,
      wrap: true,
    };

    bricksTypeDef = [
      {
        model: MeshBuilder.CreateBox(`brickModel0`, options),
        color: new Color3(0.0, 1, 0.0),                   //VERT
        material: new StandardMaterial("brickMat0"),
        life: 1,
        score: 10,
      },
      {
        model: MeshBuilder.CreateBox(`brickModel1`, options),
        color: new Color3(1, 0.0, 1.0),                   //VIOLET
        material: new StandardMaterial("brickMat1"),
        life: 1,
        score: 10,
      },
      {
        model: MeshBuilder.CreateBox(`brickModel2`, options),
        color: new Color3(0.0, 0.4, 1),                   //BLEU FONCE
        material: new StandardMaterial("brickMat2"),
        life: 1,
        score: 10,
      },
      {
        model: MeshBuilder.CreateBox(`brickModel3`, options),
        color: new Color3(1, 1, 0),                       //JAUNE VIF
        material: new StandardMaterial("brickMat3"),
        life: 1,
        score: 10,
      },
      {
        model: MeshBuilder.CreateBox(`brickModel4`, options),
        color: new Color3(1, 0.0, 0.0),                 //ROUGE
        material: new StandardMaterial("brickMat4"),
        life: 1,
        score: 10,
      },
      {
        model: MeshBuilder.CreateBox(`brickModel5`, options),
        color: new Color3(1, 1, 1),                     //BLANC
        material: new StandardMaterial("brickMat5"),
        life: 1,
        score: 10,
      },
      {
        model: MeshBuilder.CreateBox(`brickModel6`, options),
        color: new Color3(1, 0.6, 0),                   //ORANGE
        material: new StandardMaterial("brickMat6"),
        life: 1,
        score: 10,
      },
      {
        model: MeshBuilder.CreateBox(`brickModel7`, options),
        color: new Color3(0, 1.0, 1.0),               //TURQUOISE
        material: new StandardMaterial("brickMat7"),
        life: 1,
        score: 10,
      },
      {
        model: MeshBuilder.CreateBox(`brickModel8`, options),
        color: new Color3(0.7, 0.7, 0.0),               //JAUNE FONCE
        material: new StandardMaterial("brickMat8"),
        life: 1,
        score: 10,
      },
      {
        model: MeshBuilder.CreateBox(`brickModel9`, options),
        color: new Color3(0.6, 0.6, 0.6),             //GRIS
        material: new StandardMaterial("brickMat9"),
        life: 2,
        score: 20,
      }
    ];

    this.#parent = new TransformNode("bricks");

    for (let brickType of bricksTypeDef) {
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
    for (let i = 0; i < this.#bricks.length; i++) {
      let brick = this.#bricks[i];
      if (brick) {
        brick.isAlive = false;
        if (brick.gameObject) {
          brick.setVisible(false);
          brick.gameObject.dispose();
        }
      }
    }
    this.#bricks = [];
    this.#iLiveBricks = 0;
  }

  loadLevel() {
    this.reset();

    //Load level
    let levelToLoad = currentLevel;
    if (levelToLoad > lastLevel)
      levelToLoad = lastLevel;

    let currentLevelMatrix = levelsDef[levelToLoad - 1];

    for (let j = 0; j < BRICKS_ROWS; j++) {
      for (let i = 0; i < BRICKS_COLS; i++) {
        let index = j * BRICKS_COLS + i;
        let x = i * BRICK_WIDTH;
        let y = 0;
        let z = j * BRICK_DEPTH;
        let car = currentLevelMatrix[(BRICKS_ROWS - 1) - j].charAt(i);
        if (car === " ") {
          let uneBrique = new BrickObj(index, null, x, y, z, this.#parent, this.#scene);
          this.#bricks[index] = uneBrique;
          this.#bricks[index].isAlive = false;
        }
        else {

          let type;
          try {
            type = parseInt(car, 10);
          } catch (e) {
            type = 0;
          }

          type = Scalar.Clamp(Math.round(type), 0, (bricksTypeDef.length - 1));
          let uneBrique = new BrickObj(index, bricksTypeDef[type], x, y, z, this.#parent, this.#scene);

          
          this.#bricks[index] = uneBrique;
          this.#bricks[index].isAlive = true;
          //On la cache par defaut pour l'anim
          this.#bricks[index].setVisible(false);

          this.#iLiveBricks++;
        }
      }
    }
    /*
          for (let j = 0; j < bricksRows; j++) {
            for (let i = 0; i < bricksCols; i++) {
              let index = j * bricksCols + i;
              let brick = this.#bricks[index];
              brick.isAlive = true;
              brick.setVisible(true);
              this.#iLiveBricks++;
              }
          }*/
  }


  launchNewLevelAnimation(callback) {

    const frameRate = 60;
    const startFrame = 0;
    const endFrame = 60;

    let callbackFuncSet = false;
    for (let j = 0; j < BRICKS_ROWS; j++) {
      for (let i = 0; i < BRICKS_COLS; i++) {
        let index = j * BRICKS_COLS + i;
        let x = i * BRICK_WIDTH;
        let y = 0;
        let z = j * BRICK_DEPTH;

        if (this.#bricks[index].gameObject) {
          var brickFallingAnim = new Animation("brickFalling", "position", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
          var motionKeys = [];
          //modelCredits.text = "Happy Holidays"; 
          motionKeys.push({ frame: startFrame, value: new Vector3(x+Scalar.RandomRange(-10, 10), Scalar.RandomRange(80, 200), z+Scalar.RandomRange(10, 30)) });
          motionKeys.push({ frame: endFrame, value: new Vector3(x, y, z) });
          brickFallingAnim.setKeys(motionKeys);

          this.#bricks[index].setVisible(true);
          if (!callbackFuncSet) {
            this.#scene.beginDirectAnimation(this.#bricks[index].gameObject, [brickFallingAnim], startFrame, endFrame, false, 1, callback);
            callbackFuncSet = true;
          }
          else
            this.#scene.beginDirectAnimation(this.#bricks[index].gameObject, [brickFallingAnim], startFrame, endFrame, false, 1);
        }
      }
    }

  }



  update() {
    //Update anims of exploding bricks ? or use animation ?
  }

  isLevelFinished() {
    return (this.#iLiveBricks == 0);
  }

  getBrickCol(x) {
    return Math.floor((x + BRICK_WIDTH / 2) / BRICK_WIDTH);
  }

  getBrickRow(z) {
    return Math.floor((z + BRICK_DEPTH / 2) / BRICK_DEPTH);
  }

  getBrickAtRowCol(xpos, zpos) {
    if (xpos >= 0 && xpos < BRICKS_COLS && zpos >= 0 && zpos < BRICKS_ROWS) {
      let index = zpos * BRICKS_COLS + xpos;
      if (index >= 0 && index < this.#bricks.length)
        return this.#bricks[index];
    }
    return null;
  }

  isBrickAtRowCol(xpos, zpos) {
    if (xpos >= 0 && xpos < BRICKS_COLS && zpos >= 0 && zpos < BRICKS_ROWS) {
      let index = zpos * BRICKS_COLS + xpos;
      if (index >= 0 && index < this.#bricks.length)
        return this.#bricks[index].isAlive;
    }
    return false;
  }

  getBrickAt(x, y, z) {
    let xpos = Math.floor((x + BRICK_WIDTH / 2) / BRICK_WIDTH);
    let zpos = Math.floor((z + BRICK_DEPTH / 2) / BRICK_DEPTH);
    if (xpos >= 0 && xpos < BRICKS_COLS && zpos >= 0 && zpos < BRICKS_ROWS) {
      let index = zpos * BRICKS_COLS + xpos;
      if (index >= 0 && index < this.#bricks.length)
        return this.#bricks[index].isAlive;
    }
    return false;
  }

  touchBrickAt(x, y, z) {
    let ret = false;

    let xpos = Math.floor((x + BRICK_WIDTH / 2) / BRICK_WIDTH);
    let zpos = Math.floor((z + BRICK_DEPTH / 2) / BRICK_DEPTH);
    let index = zpos * BRICKS_COLS + xpos;
    if (index >= 0 && index < this.#bricks.length && this.#bricks[index].isAlive) {

      if (this.#bricks[index].touch()) {

        this.#bricks[index].isAlive = false;

        //this.#bricks[index].setVisible(false);
        this.#bricks[index].explode();
        this.#iLiveBricks--;
        currentScore += this.#bricks[index].score;

        ret = true;
      }

    }
    return ret;

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
  STATE_NEW_LEVEL: 45,
  STATE_LEVEL_WELDING: 50,
  STATE_LEVEL_READY: 55,
  STATE_RUNNING: 60,
  STATE_PAUSE: 70,
  STATE_LOOSE: 80,
  STATE_GAME_OVER: 90,
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
  #musics = [];
  #bPause;

  #ground;
  #skySphere;

  #paddle;
  #walls;
  
  #brickManager;
  #ballsManager;
  #bonusManager;
  #inputController;
  #bInspector = false;

  #myMeshes = [];
  #menuUiTexture;
  #gameUI;
  #creditsUI;

  #timeToLaunch = 0;
  #cameraStartPosition = new Vector3(-257, 566, -620);
  #cameraMenuPosition = new Vector3(-199, 88, -360);

  #cameraGamePosition = new Vector3(36.01, 127.25, -41.91);
  #cameraGameTarget = new Vector3(35, 15.71, -5.89);

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
    pipeline.glowLayer.intensity = 0.35;
    pipeline.glowLayer.blurKernelSize = 16;
    pipeline.glowLayer.ldrMerge = true;


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

    this.#ground = MeshBuilder.CreateGround("ground", {
      width: 89,
      height: 110,
      subdivisions: 64,
      updatable: false,
    }, this.#scene);
    this.#ground.position = new Vector3(36, -3.2, 6);
    this.#ground.receiveShadows = true;

    var groundMaterial = new StandardMaterial("groundMaterial");
    groundMaterial.diffuseTexture = new Texture(groundBaseColorUrl);
    groundMaterial.diffuseColor = new Color3(0.094, 0.224, 0.710)
    groundMaterial.diffuseTexture.vScale = 3;
    groundMaterial.diffuseTexture.uScale = 3;

    groundMaterial.specularColor = new Color3(0.188, 0.204, 0.424)

    groundMaterial.bumpTexture = new Texture(groundNormalUrl);
    groundMaterial.bumpTexture.vScale = 3;
    groundMaterial.bumpTexture.uScale = 3;
    /*
        groundMaterial.ambientTexture = new Texture(groundAmbientUrl);
        groundMaterial.ambientTexture.vScale = 3;
        groundMaterial.ambientTexture.uScale = 3;
    */
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

    this.#musics[0] = new Sound("music0", musicUrl1, this.#scene, null, { loop: true, autoplay: true, volume: 0.4 });
    /*  this.#musics[1] = new Sound("music1", musicUrl2, this.#scene, null, { loop: true, autoplay: false });
      this.#musics[2] = new Sound("music2", musicUrl3, this.#scene, null, { loop: true, autoplay: false });
      this.#musics[3] = new Sound("music3", musicUrl4, this.#scene, null, { loop: true, autoplay: false });
      this.#musics[4] = new Sound("music4", musicUrl5, this.#scene, null, { loop: true, autoplay: false });
      this.#musics[5] = new Sound("music5", musicUrl6, this.#scene, null, { loop: true, autoplay: false });
      this.#musics[6] = new Sound("music6", musicUrl7, this.#scene, null, { loop: true, autoplay: false });
      this.#musics[7] = new Sound("music7", musicUrl8, this.#scene, null, { loop: true, autoplay: false });
      */
    this.#musics

    this.#skySphere = MeshBuilder.CreateSphere("skySphere", { diameter: 3000, segments: 32 }, this.#scene);
    this.#skySphere.material = skyMaterial;

    this.#inputController = new InputController(this.#engine, this.#scene, this.#canvas);
    this.#brickManager = new BrickManager(this.#scene);

    this.#paddle = new Paddle(GAME_AREA_WIDTH / 2, 0, BASE_Z_PADDLE, this.#inputController, this.#scene);
    this.#bonusManager = new BonusManager(this.#scene, this.#paddle);



    this.#ballsManager = new BallsManager(this.#paddle, this.#brickManager, this.#bonusManager);

    //Ok it*s ugly but it's only a game not a nuclear plant !
    this.#bonusManager.setBallsManager(this.#ballsManager);

    changeGameState(States.STATE_PRE_INTRO);
    this.launchCreditsAnimation(() => {
      this.#creditsUI.rootContainer.isVisible = false;
    });
    this.launchPreIntroAnimation(() => {
      changeGameState(States.STATE_MENU);
    });


  }

  launchGameOverAnimation(callback) {

    const startFrame = 0;
    const endFrame = 300;
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
      outTangent: new Vector3(1, 0, 0)
    });
    keys.push({
      frame: endFrame / 2,
      value: new Vector3(39, 177, -550),
    });
    keys.push({
      frame: endFrame,
      inTangent: new Vector3(-1, 0, 0),
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
      outTangent: new Vector3(1, 0, 0)
    });
    keysTarget.push({
      frame: endFrame,
      inTangent: new Vector3(-1, 0, 0),
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
    const endFrame = 300;
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
      outTangent: new Vector3(1, 0, 0)
    });
    keys.push({
      frame: endFrame / 2,
      value: new Vector3(39, 177, -550),
    });
    keys.push({
      frame: endFrame,
      inTangent: new Vector3(-1, 0, 0),
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
      outTangent: new Vector3(1, 0, 0)
    });
    keysTarget.push({
      frame: endFrame,
      inTangent: new Vector3(-1, 0, 0),
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
    const endFrame = 500;

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
      outTangent: new Vector3(1, 0, 0)
    });
    keys.push({
      frame: endFrame / 3,
      value: new Vector3(39, 177, -550),
    });
    keys.push({
      frame: 2 * endFrame / 3,
      inTangent: new Vector3(-1, 0, 0),
      value: new Vector3(240, 107, -353),
    });
    keys.push({
      frame: endFrame,
      inTangent: new Vector3(-1, 0, 0),
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
      outTangent: new Vector3(1, 0, 0)
    });
    keysTarget.push({
      frame: endFrame,
      inTangent: new Vector3(-1, 0, 0),
      value: this.getTargetMenuPosition().clone(),
    });

    animationcameraTarget.setKeys(keysTarget);


    this.#camera.animations = [];
    this.#camera.animations.push(animationcamera);

    this.#scene.beginAnimation(this.#camera, startFrame, endFrame, false, 1, callback);
  }


  launchCreditsAnimation(callback) {

    const frameRate = 60;
    const startFrame = 0;
    const endFrame = 500;

    this.#creditsUI = AdvancedDynamicTexture.CreateFullscreenUI("creditsUI");
    // Text label
    let modelCredits = new TextBlock("modelCredits");
    modelCredits.text = "3D model 'Secret Area-52 || Room' by dark_igorek";
    modelCredits.fontSize = "16px";
    modelCredits.fontFamily = "Courier New";
    modelCredits.color = "#aaaaaa";
    modelCredits.height = "52px";
    modelCredits.top = "-200px";
    modelCredits.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    modelCredits.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.#creditsUI.addControl(modelCredits);

    // Text label
    let musicCredits = new TextBlock("musicCredits");
    musicCredits.text = 'Unreal II main theme by Purple Motion Skaven from "Unreal ][ - The 2nd Reality | Future Crew ⭐ Assembly \'93"';
    musicCredits.fontSize = "16px";
    musicCredits.fontFamily = "Courier New";
    musicCredits.color = "#bbbbbb";
    musicCredits.height = "52px";
    musicCredits.top = "-300px";
    musicCredits.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    musicCredits.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.#creditsUI.addControl(musicCredits);


    // Text label
    let codingCredits = new TextBlock("codingCredits");
    codingCredits.text = "Code by Olivier Arguimbau alias Pigmin 👽";
    codingCredits.fontSize = "20px";
    codingCredits.fontFamily = "Courier New";
    codingCredits.color = "#ffffff";
    codingCredits.height = "52px";
    codingCredits.top = "-400px";
    codingCredits.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    codingCredits.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.#creditsUI.addControl(codingCredits);



    var modelCreditsMotion = new Animation("modelCreditsMotion", "top", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    var modelCreditsMotionKeys = [];
    //modelCredits.text = "Happy Holidays"; 
    modelCreditsMotionKeys.push({ frame: startFrame, value: -200 });
    modelCreditsMotionKeys.push({ frame: endFrame*0.3, value: 50 });
    modelCreditsMotionKeys.push({ frame: endFrame*0.9, value: 50 });
    modelCreditsMotionKeys.push({ frame: endFrame, value: -200 });
    modelCreditsMotion.setKeys(modelCreditsMotionKeys);

    this.#scene.beginDirectAnimation(modelCredits, [modelCreditsMotion], startFrame, endFrame, false, 1, callback);

    var musicCreditsMotion = new Animation("musicCreditsMotion", "top", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    var musicCreditsMotionKeys = [];
    //musicCredits.text = "Happy Holidays"; 
    musicCreditsMotionKeys.push({ frame: startFrame, value: -300 });
    musicCreditsMotionKeys.push({ frame: endFrame*0.3, value: 200 });
    musicCreditsMotionKeys.push({ frame: endFrame*0.9, value: 200 });
    musicCreditsMotionKeys.push({ frame: endFrame, value: -300 });
    musicCreditsMotion.setKeys(musicCreditsMotionKeys);

    this.#scene.beginDirectAnimation(musicCredits, [musicCreditsMotion], startFrame, endFrame, false, 1, callback);

    var codingCreditsMotion = new Animation("codingCreditsMotion", "top", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    var codingCreditsMotionKeys = [];
    //codingCredits.text = "Happy Holidays"; 
    codingCreditsMotionKeys.push({ frame: startFrame, value: -400 });
    codingCreditsMotionKeys.push({ frame: endFrame*0.3, value: 350 });
    codingCreditsMotionKeys.push({ frame: endFrame*0.9, value: 350 });
    codingCreditsMotionKeys.push({ frame: endFrame, value: -400 });
    codingCreditsMotion.setKeys(codingCreditsMotionKeys);

    this.#scene.beginDirectAnimation(codingCredits, [codingCreditsMotion], startFrame, endFrame, false, 1, callback);



  }

  launchNewLevelAnimation(callback) {
    this.#brickManager.launchNewLevelAnimation(callback);
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
      const hardBrickTouchedSoundData = this.#assetsManager.addBinaryFileTask("hardBrickTouchedSound", hardBrickTouchedSoundUrl);

      const paddleTouchedSoundData = this.#assetsManager.addBinaryFileTask("paddleTouchedSound", paddleTouchedSoundUrl);
      const looseSoundData = this.#assetsManager.addBinaryFileTask("looseSound", looseSoundUrl);
      const bonusLifeSoundData = this.#assetsManager.addBinaryFileTask("bonusLife", bonusLifeSoundUrl);
      const bonusGrowSoundData = this.#assetsManager.addBinaryFileTask("bonusGrow", bonusGrowSoundUrl);


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


      this.LoadEntity(
        "monitor",
        "",
        "",
        monitorModelUrl,
        this.#assetsManager,
        this.#myMeshes,
        1,
        { position: new Vector3(130, -20.95, 30), scaling: new Vector3(-35, 35, 35), rotation: new Vector3(0, Math.PI + 0.2, 0) },
        this.#scene,
        this.#shadowGenerator,
        (mesh) => {
          let screenMat = this.#scene.getMaterialByName("Screen");
          screenMat.emissiveTexture = null;
          screenMat.albedoColor = new Color3(1, 1, 1);
          screenMat.emissiveColor = new Color3(0, 0, 0);
          screenMat.albedoTexture = new VideoTexture("vidtex", screenVideoTextureUrl, this.#scene);
        }
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
        soundsRepo[SoundsFX.BRICK1] = new Sound("brickTouched1", brickTouchedSoundData1.data, this.#scene);
        soundsRepo[SoundsFX.BRICK2] = new Sound("brickTouched2", brickTouchedSoundData2.data, this.#scene);
        soundsRepo[SoundsFX.HARD_BRICK] = new Sound("hardBrickTouched", hardBrickTouchedSoundData.data, this.#scene);

        soundsRepo[SoundsFX.PADDLE] = new Sound("paddleTouched", paddleTouchedSoundData.data, this.#scene);
        soundsRepo[SoundsFX.LOOSE] = new Sound("looseSound", looseSoundData.data, this.#scene);
        soundsRepo[SoundsFX.BONUS_LIFE] = new Sound("bonusLife", bonusLifeSoundData.data, this.#scene);
        soundsRepo[SoundsFX.BONUS_GROW] = new Sound("bonusGrow", bonusGrowSoundData.data, this.#scene);

        resolve(true);
      }

    });


  }

  loop() {
    // Render every frame
    const divFps = document.getElementById("fps");
    this.#engine.runRenderLoop(() => {

      const now = performance.now();

      this.#inputController.update();
      this.updateAllText();

      if (gameState == States.STATE_PRE_INTRO) {
        //RAS
      }
      else if (gameState == States.STATE_MENU) {
        if (this.#inputController.actions["Space"]) {
          if (gameState == States.STATE_MENU)
            changeGameState(States.STATE_START_INTRO);
        }
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
        changeGameState(States.STATE_NEW_LEVEL);
      }
      else if (gameState == States.STATE_LAUNCH) {
        //Update paddle
        this.#paddle.checkInput();
        this.#paddle.update();
        this.#ballsManager.positionMainBallAtPaddle();
        //Not a real update
        this.#ballsManager.update(false);

        //Update bonuses
        this.#bonusManager.update();

        if (now > this.#timeToLaunch) {
          this.#ballsManager.launchMainBall(BALL_LAUNCH_VX, 0, BALL_LAUNCH_VZ);
          changeGameState(States.STATE_RUNNING);
        }
      }
      else if (gameState == States.STATE_NEW_LEVEL) {
        //Random music
        /*        let musicId = getRandomInt(this.#musics.length-1);
                this.#musics[musicId].play()*/

        this.#ballsManager.reset();
        this.#bonusManager.reset();

        //Animation level
        changeGameState(States.STATE_LEVEL_WELDING);
        this.launchNewLevelAnimation(() => {
          changeGameState(States.STATE_LEVEL_READY);
        });
      }
      else if (gameState == States.STATE_LEVEL_WELDING) {
        //RAS
      }      
      else if (gameState == States.STATE_LEVEL_READY) {
        //Random music
        /*        let musicId = getRandomInt(this.#musics.length-1);
                this.#musics[musicId].play()*/

        this.#ballsManager.reset();
        this.#bonusManager.reset();
        this.#timeToLaunch = now + 1000;
        changeGameState(States.STATE_LAUNCH);
      }
      else if (gameState == States.STATE_LOOSE) {
        if (nbLives > 0) {
          nbLives--;
          this.updateTextLives();
          this.#ballsManager.reset();
          this.#timeToLaunch = now + 500;
          changeGameState(States.STATE_LAUNCH);
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
        this.#ballsManager.update(true);

        //Update bricks
        this.#brickManager.update();
        if (this.#brickManager.isLevelFinished()) {

          currentScore += 100;

          currentLevel++;
          if (currentLevel > lastLevel)
            currentLevel = 1;

          this.#brickManager.loadLevel();
          changeGameState(States.STATE_NEW_LEVEL);
        }
        //Update bonuses
        this.#bonusManager.update();

        //SPECIAL CONTROLS 
        if (this.#inputController.actions["KeyP"]) {
          this.#bPause = true;
          changeGameState(States.STATE_PAUSE);
        }
        if (this.#inputController.actions["KeyN"]) {
          currentLevel++;
          if (currentLevel > lastLevel)
            currentLevel = 1;

          this.#brickManager.loadLevel();
          changeGameState(States.STATE_NEW_LEVEL);
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
          Inspector.Show(this.#scene, { embedMode: true });
          console.log(this.#camera);
          this.#camera.attachControl(this.#canvas, true);

        }
        else {
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
    this.#ballsManager.reset();
    this.#bonusManager.reset();

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
    var lWall = MeshBuilder.CreateBox("lWall", { width: WALLS_DEPTH, height: WALLS_HEIGHT, depth: WALLS_THICKNESS, wrap: true }, this.#scene);
    lWall.rotation.y = -Math.PI / 2;
    lWall.position.x = -BRICK_WIDTH;
    lWall.position.z = (GAME_AREA_DEPTH + WALLS_THICKNESS * 2.5) - (WALLS_DEPTH / 2);

    var rWall = MeshBuilder.CreateBox("rWall", { width: WALLS_DEPTH, height: WALLS_HEIGHT, depth: WALLS_THICKNESS, wrap: true }, this.#scene);
    rWall.rotation.y = Math.PI / 2;
    rWall.position.x = GAME_AREA_WIDTH;
    rWall.position.z = (GAME_AREA_DEPTH + WALLS_THICKNESS * 2.5) - (WALLS_DEPTH / 2);


    var tWall = MeshBuilder.CreateBox("tWall", { width: (GAME_AREA_WIDTH + BRICK_WIDTH), height: WALLS_HEIGHT, depth: WALLS_THICKNESS, wrap: true }, this.#scene);
    tWall.position = new Vector3((GAME_AREA_WIDTH - BRICK_WIDTH) / 2, 0, GAME_AREA_DEPTH + (WALLS_THICKNESS * 2));
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
    callback
  ) {
    const meshTask = manager.addMeshTask(name, meshNameToLoad, url, file);

    meshTask.onSuccess = function (task) {
      const parent = task.loadedMeshes[0];
      parent.name = name;

      /*      const obj = parent.getChildMeshes()[0];
            obj.setParent(null);
            parent.dispose();*/

      meshArray[entity_number] = parent;

      if (props) {
        if (props.scaling) {
          meshArray[entity_number].scaling.copyFrom(props.scaling);
        }
        if (props.position) {
          meshArray[entity_number].position.copyFrom(props.position);
        }
        else
          meshArray[entity_number].position = Vector3.Zero();

        if (props.rotation) {
          meshArray[entity_number].rotationQuaternion = null;
          meshArray[entity_number].rotation.copyFrom(props.rotation);
        }
        else
          meshArray[entity_number].rotation = Vector3.Zero();

      }
      else {
        meshArray[entity_number].position = Vector3.Zero();
        meshArray[entity_number].rotation = Vector3.Zero();
      }

      if (shadowGenerator)
        shadowGenerator.addShadowCaster(parent);
      parent.receiveShadows = true;
      for (let mesh of parent.getChildMeshes()) {
        mesh.receiveShadows = true;
        mesh.computeWorldMatrix(true);
      }
      if (callback)
        callback(meshArray[entity_number]);
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
    let guiParent = this.#scene.getNodeByName(START_BUTTON_MESH_TARGET);
    return guiParent.getAbsolutePosition();
  }

  gotoGameCamera() {
    this.#camera.position = this.#cameraGamePosition.clone();
    this.#camera.setTarget(this.#cameraGameTarget);
  }

  loadMenuGUI() {
    // GUI
    let guiParent = this.#scene.getNodeByName(START_BUTTON_MESH_TARGET);
    this.#camera.setTarget(guiParent.getAbsolutePosition());

    var startGameButton = MeshBuilder.CreatePlane("startGameButton", { width: 10, depth: 10 });
    startGameButton.scaling = new Vector3(3.8, 16, 1);
    startGameButton.position = new Vector3(-259, 86, -361.3);
    startGameButton.rotation.x = Math.PI / 8;
    startGameButton.rotation.y = -Math.PI / 2;

    this.#menuUiTexture = AdvancedDynamicTexture.CreateForMesh(startGameButton);

    var button1 = Button.CreateSimpleButton("but1", "START");
    button1.width = 0.2;
    button1.height = 0.9;
    button1.color = "white";
    button1.fontSize = 64;
    button1.fontFamily = "Courier New";
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

    this.textLives.fontFamily = 'Courier New';
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
    this.textLives.text = `Lifes : ${nbLives}`;
  }
  updateTextScore() {
    this.textScore.text = `Score : ${currentScore}`;
  }
  updateTextHighScore() {
    this.textHigh.text = `HighScore : ${currentHighScore}`;
  }

  updateTextLevel() {
    this.textLevel.text = `Level : ${currentLevel}`;
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
  #canvas;
  #engine;
  #gamepadManager;

  inputMap = {};
  actions = {};

  constructor(engine, scene, canvas) {
    this.#scene = scene;
    this.#canvas = canvas;
    this.#engine = engine;
    this.#gamepadManager = new GamepadManager();

    this.#scene.onKeyboardObservable.add((kbInfo) => {
      switch (kbInfo.type) {
        case KeyboardEventTypes.KEYDOWN:
          this.inputMap[kbInfo.event.code] = true;
          //console.log(`KEY DOWN: ${kbInfo.event.code} / ${kbInfo.event.key}`);
          break;
        case KeyboardEventTypes.KEYUP:
          this.inputMap[kbInfo.event.code] = false;
          this.actions[kbInfo.event.code] = true;
          //console.log(`KEY UP: ${kbInfo.event.code} / ${kbInfo.event.key}`);
          break;
      }
    });

    this.#gamepadManager.onGamepadConnectedObservable.add((gamepad, state) => {
      console.log("Connected: " + gamepad.id);

      gamepad.onButtonDownObservable.add((button, state) => {
        //Button has been pressed
        console.log(button + " pressed");
      });
      gamepad.onButtonUpObservable.add((button, state) => {
        console.log(button + " released");
      });
      gamepad.onleftstickchanged((values) => {
        //Left stick has been moved
        console.log("x:" + values.x.toFixed(3) + " y:" + values.y.toFixed(3));
      });

      gamepad.onrightstickchanged((values) => {
        console.log("x:" + values.x.toFixed(3) + " y:" + values.y.toFixed(3));
      });
    });

    this.#gamepadManager.onGamepadDisconnectedObservable.add((gamepad, state) => {
      console.log("Disconnected: " + gamepad.id);
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
