

export const BRICKS_ROWS = 25;
export const BRICKS_COLS = 13;
export const BRICK_WIDTH = (18.0 / 3.0);
export const BRICK_DEPTH = (7.0 / 3.0);
export const BRICK_PADDING_X = (1.0 / 3.0);
export const BRICK_PADDING_Z = (1.0 / 3.0);



export const GAME_AREA_WIDTH = (BRICKS_COLS * BRICK_WIDTH);
export const GAME_AREA_DEPTH = (BRICKS_ROWS * BRICK_DEPTH);
export const WALLS_DEPTH = GAME_AREA_DEPTH + 45;

export const WALLS_HEIGHT = 5;
export const WALLS_THICKNESS = 2;

export const BALL_SPEED_FACTOR = 2.2;

export const MIN_P_VELOCITY = 0.2;
export const DRAG_FORCE = 0.6;
export const PADDLE_ACC_X = 0.7;
export const MAX_VELOCITY = 14;


export const BASE_Z_BALL = -30;
export const BALL_RADIUS = 0.75;
export const PADDLE_WIDTH = (30 / 3.0);
export const PADDLE_RADIUS = ((5 / 2) / 3.0);
export const BASE_Z_PADDLE = BASE_Z_BALL - PADDLE_RADIUS * 2;
export const OFF_AREA = BASE_Z_PADDLE - PADDLE_RADIUS * 32;

export const WORLD_MIN_X = -BRICK_WIDTH + (WALLS_THICKNESS / 2) + BALL_RADIUS;
export const WORLD_MAX_X = (GAME_AREA_WIDTH) - (WALLS_THICKNESS / 2) - BALL_RADIUS;


export const WORLD_MIN_Y = -5;
export const WORLD_MAX_Y = 5;

export const WORLD_MIN_Z = OFF_AREA;
export const WORLD_MAX_Z = GAME_AREA_DEPTH;

export const BALL_LAUNCH_VX = 0.15;
export const BALL_LAUNCH_VZ = 0.5;

export const BONUS_VX = 0;
export const BONUS_VZ = -0.5;

export const START_LIVES = 6;
export const MAX_LIVES = 12;

export const START_BUTTON_MESH_TARGET = "Object_351";