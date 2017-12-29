import * as $ from 'jquery'
import { Color } from './color'

// const canvas = $('#tetris')[0]
const canvas = document.getElementById('tetris')
const context = canvas.getContext('2d')

context.scale(20, 20)

const DROP_MODE_NORMAL = 1
const DROP_MODE_FAST = 2

const GAMESTATE = {
  IDLE: 0,
  RUNNING: 1,
  PAUSED: 2,
  GAMEOVER: 3
}

const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  score: 0,
  level: 1,
  next: null,
  dropMode: DROP_MODE_NORMAL,
  state: GAMESTATE.IDLE
}

let arena = createMatrix(12, 20)
let lastTime = 0
let dropCounter = 0
let showPreview = true
const levelUpScore = 50
let initialDropInterval = 1000
let dropInterval = initialDropInterval
const dropIntervalStep = 50

const pg = pieceGenerator()

// define the pieces; possible to use other than uniform probabilities for the pieces
const pieces = [
  { type: 'I', prob: 1/7, color: new Color(255,0,0), matrix: [[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0]] },
  { type: 'J', prob: 1/7, color: new Color(255,127,0), matrix: [[0,2,0],[0,2,0],[2,2,0]] },
  { type: 'L', prob: 1/7, color: new Color(255,255,0), matrix: [[0,3,0],[0,3,0],[0,3,3]] },
  { type: 'O', prob: 1/7, color: new Color(0,255,0), matrix: [[4,4],[4,4]] },
  { type: 'S', prob: 1/7, color: new Color(0,0,255), matrix: [[0,5,5],[5,5,0],[0,0,0]] },
  { type: 'T', prob: 1/7, color: new Color(75,0,130), matrix: [[6,6,6],[0,6,0],[0,0,0]] },
  { type: 'Z', prob: 1/7, color: new Color(148,0,211), matrix: [[7,7,0],[0,7,7],[0,0,0]] }
]

/*
const pieces = [
  { type: 'I', prob: 0.1, color: new Color(255,0,0), matrix: [[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0]] },
  { type: 'J', prob: 0.1, color: new Color(255,127,0), matrix: [[0,2,0],[0,2,0],[2,2,0]] },
  { type: 'L', prob: 0.1, color: new Color(255,255,0), matrix: [[0,3,0],[0,3,0],[0,3,3]] },
  { type: 'O', prob: 0.4, color: new Color(0,255,0), matrix: [[4,4],[4,4]] },
  { type: 'S', prob: 0.05, color: new Color(0,0,255), matrix: [[0,5,5],[5,5,0],[0,0,0]] },
  { type: 'T', prob: 0.2, color: new Color(75,0,130), matrix: [[6,6,6],[0,6,0],[0,0,0]] },
  { type: 'Z', prob: 0.05, color: new Color(148,0,211), matrix: [[7,7,0],[0,7,7],[0,0,0]] }
]
*/

// rainbow colors
const fillColors = [
  new Color(0,0,0),
  new Color(255,0,0),
  new Color(255,127,0),
  new Color(255,255,0),
  new Color(0,255,0),
  new Color(0,0,255),
  new Color(75,0,130),
  new Color(148,0,211)
]
const fillColorsStr = fillColors.map(c => c.toString())
const strokeColorsStr = fillColors.map(c => c.create(0.375).toString())
const strokeWidth = 4 / 20


function arenaSweep() {
  let rowCount = 1
  for (let y = arena.length - 1; y > 0; y--) {
    if (arena[y].indexOf(0) === -1) {
      // remove row y from arena
      const row = arena.splice(y, 1)[0].fill(0)
      // put the row at the top of arena
      arena.unshift(row)
      player.score += rowCount * 10
      rowCount *= 2
    }
  }
  // set player level
  player.level = 1 + (player.score / levelUpScore | 0)
}

function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos]
  for (let i = m.length - 1; i >= 0; i--) {
    let y = o.y + i
    for (let j = 0; j < m[0].length; j++) {
      let x = o.x + j
      if (m[i][j] !== 0 && (arena[y] === undefined || arena[y][x] !== 0)) {
        return true
      }
    }
  }
  return false
}

function createMatrix(w, h) {
  return new Array(h).fill(0).map(val => new Array(w).fill(0))
}

function *pieceGenerator() {
  const cs = [0]
  pieces.map(o => o.prob).forEach((val, i) => {cs[i + 1] = cs[i] + val})
  while (true) {
    const r = Math.random()
    const n = cs.findIndex(val => val > r)
    // reset the matrix!
    const matrices = [
      [[1,0,0,0],[1,0,0,0],[1,0,0,0],[1,0,0,0]],
      [[0,2,0],[0,2,0],[2,2,0]],
      [[0,3,0],[0,3,0],[0,3,3]],
      [[4,4],[4,4]],
      [[0,5,5],[5,5,0],[0,0,0]],
      [[6,6,6],[0,6,0],[0,0,0]],
      [[7,7,0],[0,7,7],[0,0,0]]
    ]
    pieces[n-1].matrix = matrices[n-1]              
    yield pieces[n-1]
  }
}

function rotate(matrix, dir) {
  // first, transpose matrix
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < i; j++) {
      // tuple switch
      [
        matrix[j][i],
        matrix[i][j]
      ] = [
        matrix[i][j],
        matrix[j][i]
      ]
    }
  }
  // then, reverse columns
  if (dir > 0) {
    matrix.forEach(row => row.reverse())
  }else {
    matrix.reverse()
  }
}

function draw() {
    context.fillStyle = '#000'
    context.fillRect(0, 0, canvas.width, canvas.height)

    drawMatrix(arena, {x: 0, y: 0})
    drawMatrix(player.matrix, player.pos)

    // preview the next piece
    if (showPreview) {
      drawMatrix(player.next.matrix, {x: 1, y: 1}, 0.5)
    }

    if (player.state === GAMESTATE.RUNNING) { return }    

    context.fillStyle = '#fff'
    context.font = 'normal 1px Arial'
    context.textAlign = 'center'
    context.textBaseline = 'bottom'

    switch (player.state) {
      case GAMESTATE.IDLE:
        context.fillText('Press <Enter> to start', canvas.width / 2 / 20, canvas.height / 2 / 20)
        break;
      case GAMESTATE.PAUSED:
        context.fillText('Paused', canvas.width / 2 / 20, canvas.height / 2 / 20)
        break;
      case GAMESTATE.GAMEOVER:
        context.fillText('Game Over', canvas.width / 2 / 20, canvas.height / 2 / 20)
        break;    
    }      
}

function drawMatrix(matrix, offset, scale = 1) {
  matrix.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val !== 0) {
        context.strokeStyle = strokeColorsStr[val]
        context.fillStyle = fillColorsStr[val]
        context.lineWidth = strokeWidth * scale
        context.fillRect((offset.x + x) * scale, (offset.y + y) * scale, 1 * scale, 1 * scale)
        context.strokeRect((offset.x + x) * scale, (offset.y + y) * scale, 1 * scale, 1 * scale)
      }
    })
  })  
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value
      }
    })
  })
}

function playerDrop() {
  if (player.state !== GAMESTATE.RUNNING) { return }
  player.pos.y++
  if (collide(arena, player)) {
    player.pos.y--
    merge(arena, player)
    playerReset()
    arenaSweep()
    updateScore()
    updateLevel()
  }
  dropCounter = 0
}

function playerMove(dx) {
  if (player.state !== GAMESTATE.RUNNING) { return }
  // x-movement not allowed in fast drop mode
  if (player.dropMode !== DROP_MODE_NORMAL) { return }
  player.pos.x += dx
  if (collide(arena, player)) {
    player.pos.x -= dx
  }
}

function playerRotate(dir) {
  if (player.state !== GAMESTATE.RUNNING) { return }

  rotate(player.matrix, dir)
  
  if (!collide(arena, player)) { return }

  // resolve collision
  const x = player.pos.x
  const y = player.pos.y
  const steps = [0,-1,1,-2,2,-3,3,-4,4]

  steps.forEach(dx => {
    player.pos.x = x + dx
    steps.forEach(dy => {
      player.pos.y = y + dy
      if (!collide(arena,player)) { return }
    })
  })

  // could not resolve collision
  rotate(player.matrix, -dir)
  player.pos.x = x
  player.pos.y = y
}

function playerReset() {
  player.matrix = player.next.matrix
  player.next = pg.next().value
  player.pos.x = (arena[0].length - player.matrix[0].length) >> 1
  player.pos.y = 0
  player.dropMode = DROP_MODE_NORMAL
  setDropInterval()

  // game is over if a collision immediately occurs
  if (collide(arena, player)) {
    player.state = GAMESTATE.GAMEOVER
    updateScore()
    updateLevel()
  }
}

function initGame() {
  if (player.state !== GAMESTATE.IDLE) { return }
  player.score = 0
  player.level = 1  
  player.next = pg.next().value
  playerReset()
  arena.forEach(row => row.fill(0))
}

function setDropInterval() {
  switch (player.dropMode) {
    case DROP_MODE_NORMAL:
      dropInterval = initialDropInterval - (player.level - 1) * dropIntervalStep
      break;
    case DROP_MODE_FAST:
      dropInterval = 5
      break
    default:
      throw new Error('Invalid drop mode specified')
  }
}

document.addEventListener('keydown', e => {
  switch (e.keyCode) {
    case 13:  // ENTER
      if (player.state === GAMESTATE.IDLE) {
        initGame()
        player.state = GAMESTATE.RUNNING        
      }
      break;
    case 27:  // ESC
      player.state = GAMESTATE.IDLE
      break;
    case 32:  // spacebar - fast drop
      if (player.state === GAMESTATE.RUNNING) {
        player.dropMode = DROP_MODE_FAST
        setDropInterval()  
      }
      break;
    case 37:  // arrow left
      playerMove(-1)
      break
    case 39:  // arrow right
      playerMove(1)
      break
    case 40:  // arrow down
      playerDrop()
      break
    case 80:  // P - pause
      togglePause()
      break
    case 81:  // Q - rotate left (-1)
      playerRotate(-1)
      break
    case 87:  // W - rotate right (+1)
      playerRotate(1)
      break
    case 112: // F1 - toggle preview
      showPreview = !showPreview
      break
    default:
      break
  }
})

function togglePause() {
  if (player.state === GAMESTATE.RUNNING) {
    player.state = GAMESTATE.PAUSED
  }else if (player.state === GAMESTATE.PAUSED) {
    player.state = GAMESTATE.RUNNING
  }
}

function update(time = 0) {
  const dt = time - lastTime
  lastTime = time

  if (player.state === GAMESTATE.RUNNING) {
    dropCounter += dt
    if (dropCounter > dropInterval) {
      playerDrop()
    }
  }

  draw()
  requestAnimationFrame(update)
}

function updateScore() {
  $('#score').text(`Score: ${player.score}`)
}

function updateLevel() {
  $('#level').text(`Level: ${player.level}`)
}

initGame()
updateScore()
updateLevel()
update()
