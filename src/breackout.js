//Breakout

import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { Scene } from "@babylonjs/core/scene";
import { UniversalCamera, MeshBuilder, Scalar, StandardMaterial, Color3, TransformNode, Color4, KeyboardEventTypes } from "@babylonjs/core";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";

import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";

import { PhysicsMotionType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { Inspector } from '@babylonjs/inspector';


import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Debug/debugLayer"; // Augments the scene with the debug methods
import "@babylonjs/inspector"; // Injects a local ES6 version of the inspector to prevent automatically relying on the none compatible version
import "@babylonjs/loaders/glTF";

import heightMapUrl from "../assets/textures/heightMap.png";
import rockTextureUrl from "../assets/textures/rock.png";
import rockTextureNormalUrl from "../assets/textures/rockn.png";

const bricksRows = 8;
const bricksCols = 10;
const brickWidth = 5;
const brickHeight = 1.5;
const brickPaddingX = 0.1;
const brickPaddingZ = 0.1;

const largeur = (bricksCols * brickWidth );
const hauteur = (bricksRows * brickHeight );
const hauteurWalls = hauteur + 35;

const baseZBall = 20 - hauteurWalls;
const ballRadius = 0.75;
const baseZPaddle = 12 - hauteurWalls;
const offArea = 10 - hauteurWalls;

const WORLD_MIN_X = -(brickWidth) + ballRadius;
const WORLD_MAX_X = (largeur) - ballRadius;

const WORLD_MIN_Y = -5;
const WORLD_MAX_Y = 5;

const WORLD_MIN_Z = offArea;
const WORLD_MAX_Z = hauteur;

var debugMaterial;
var debugBox;

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
    // Affect a material
    this.gameObject.material = ballMaterial;
    this.updatePosition();


    //this.gameObject.material = this.myMaterial;
    this.gameObject.receiveShadows = true;
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
    let xpos = Math.floor((this.x+brickWidth/2) / brickWidth);
    let zpos = Math.floor((this.z+brickHeight/2) / brickHeight);
    debugBox.position = new Vector3(xpos * brickWidth, 0, zpos * brickHeight);
    debugBox.size = 2;
    
    //Bricks collisions
    if (this.#brickManager.getBrickAt(this.x, this.y, this.z))
    {
      let bBothTestFailed = true;
      //On verifie d'ou on venait
      let brickAtXminus = this.#brickManager.getBrickAt(this.prevX, this.y, this.z );
      let brickAtZminus = this.#brickManager.getBrickAt(this.x , this.y, this.prevZ );
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

  constructor(type, x, y, z) {
    super(x, y, z);
    this.type = Scalar.Clamp(Math.floor(type), 0, 3);


    const options = {
      width: brickWidth - brickPaddingX,
      height: 1,
      depth: brickHeight - brickPaddingZ,
      wrap: true,
    };


    // Our built-in 'sphere' shape.
    this.gameObject = MeshBuilder.CreateBox("box", options);
    this.updatePosition();

    // Move the sphere upward 1/2 its height
    this.gameObject.material = brickMaterials[this.type];
    this.gameObject.material.diffuseColor = brickColors[this.type];
    this.gameObject.receiveShadows = true;
  }

  setVisible(bVisible) {
    this.gameObject.setEnabled(bVisible);
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

        let uneBrique = new BrickObj(j / 2, x, y, z);
        this.#bricks[index] = uneBrique;
        this.#iLiveBricks++;
      }
    }
  }

  update() {
    
  }

  isLevelFinished() {
    return (this.#iLiveBricks == 0);
  }

  getBrickAt(x, y, z) {
    let xpos = Math.floor((x+brickWidth/2) / brickWidth);
    let zpos = Math.floor((z+brickHeight/2) / brickHeight);
    let index = zpos * bricksCols + xpos;
    if (index >= 0 && index < this.#bricks.length)
      return this.#bricks[index].bAlive;
    else
      return false;
  }

  destroyBrickAt(x, y, z) {
    let xpos = Math.floor((x+brickWidth/2) / brickWidth);
    let zpos = Math.floor((z+brickHeight/2) / brickHeight);
    let index = zpos * bricksCols + xpos;
    if (index >= 0 && index < this.#bricks.length && this.#bricks[index].bAlive) {
      this.#bricks[index].bAlive = false;
      this.#bricks[index].setVisible(false);
      this.#iLiveBricks--;
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
  #camera;
  #light;
  #ball;
  #ground;
  #skySphere;
  #walls;

  #brickManager;
  #bInspector = false;
  #inputController;

  #state = States.STATE_NONE;


  constructor(canvas, engine) {
    this.#canvas = canvas;
    this.#engine = engine;
  }

  start() {
    this.init();
    this.loop();
    this.end();
  }

  init() {
    // Create our first scene.
    this.#scene = new Scene(this.#engine);
    this.#scene.clearColor = Color3.Black();

    this.#inputController = new InputController(this.#scene);
    this.#brickManager = new BrickManager(this.#scene);
    this.#ball = new Ball(0, 0, baseZBall, this.#brickManager);

    debugMaterial = new StandardMaterial("debugMaterial", this.#scene);
    debugMaterial.emissiveColor = Color3.Red();
    debugMaterial.wireframe = true;
    debugBox = MeshBuilder.CreateBox("debugBox", {size: ballRadius*2});
    debugBox.material = debugMaterial;
    debugBox.setEnabled(false);

    // This creates and positions a free camera (non-mesh)
    this.#camera = new UniversalCamera(
      "camera1",
      new Vector3((bricksCols * brickWidth) / 2, 80, -60),
      this.#scene
    );

    // This targets the camera to scene origin
    this.#camera.setTarget(new Vector3((bricksCols * brickWidth) / 2, 0, -(bricksRows * brickHeight) * 2));

    // Sets the sensitivity of the camera to movement and rotation


    // This attaches the camera to the canvas
    //this.#camera.attachControl(this.#canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    this.#light = new HemisphericLight(
      "light1",
      new Vector3(0, 1, 0),
      this.#scene
    );

    // Default intensity is 1. Let's dim the light a small amount
    this.#light.intensity = 0.7;





    // Our built-in 'ground' shape.
    /*    this.#ground = MeshBuilder.CreateGround(
          "ground1",
          { width: 128, height: 128, subdivisions: 2 },
          this.#scene
        );*/
    this.#ground = MeshBuilder.CreateGroundFromHeightMap("ground", heightMapUrl, {
      width: 512,
      height: 512,
      subdivisions: 1024,
      minHeight: 0,
      maxHeight: 16,
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
    this.#ground.position = new Vector3(0, -64, 0);


    var groundMaterial = new GridMaterial("groundMaterial");
    groundMaterial.majorUnitFrequency = 5;
    groundMaterial.minorUnitVisibility = 0.45;
    groundMaterial.gridRatio = 2;
    groundMaterial.backFaceCulling = false;
    groundMaterial.mainColor = new Color3(0.2, 1, 0.2);
    groundMaterial.lineColor = new Color3(0.8, 1.0, 0.8);
    groundMaterial.opacity = 0.98;

    // Affect a material
    this.#ground.material = groundMaterial;



    this.#walls = new TransformNode("walls", this.#scene);
    var lWall = MeshBuilder.CreateBox("lWall", { width: 1, height: 5, depth: hauteurWalls }, this.#scene);
    lWall.position.x = -brickWidth;
    lWall.position.z = (hauteur + brickHeight) - (hauteurWalls / 2);
    var rWall = MeshBuilder.CreateBox("rWall", { width: 1, height: 5, depth: hauteurWalls }, this.#scene);
    rWall.position.x = largeur;
    rWall.position.z = (hauteur + brickHeight) - (hauteurWalls / 2);
    var tWall = MeshBuilder.CreateBox("tWall", { width: (largeur + brickWidth), height: 5, depth: 1 }, this.#scene);
    tWall.position = new Vector3((largeur - brickWidth) / 2, 0, hauteur + brickHeight);
    lWall.setParent(this.#walls);
    rWall.setParent(this.#walls);
    tWall.setParent(this.#walls);

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

    this.#ball.launch(0.25, 0, 0.5);
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
      if ( this.#brickManager.isLevelFinished() ) {
        //..??
        this.#brickManager.init();
        this.#ball.launch(0.25, 0, 0.5);
      }

      //Render : (auto)

      //Debug
      if (this.#inputController.actions["KeyD"])
      {
        this.#bInspector = !this.#bInspector;
        if (this.#bInspector)
        {
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
