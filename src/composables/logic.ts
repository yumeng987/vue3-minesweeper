import type { Ref } from 'vue'
import type { BlockState } from '~/types'

// 方向
const diorections = [
  [1, 1],
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
]
type GameStatus = 'ready' | 'play' | 'won' | 'lost'

interface GameState {
  board: BlockState[][]
  mineGenerated: boolean
  status: GameStatus
  startMS?: number
  endMS?: number
}

export class GamePlay {
  state = ref() as Ref<GameState>

  constructor(
    public width: number,
    public height: number,
    // 炸弹总数
    public mines: number,
  ) {
    this.reset()
  }

  get board() {
    return this.state.value.board
  }

  get blocks() {
    return this.state.value.board.flat()
  }

  // 重置游戏
  reset(
    width = this.width,
    height = this.height,
    mines = this.mines,
  ) {
    this.width = width
    this.height = height
    this.mines = mines

    this.state.value = {
      mineGenerated: false,
      status: 'ready',
      board: Array.from({ length: this.height },
        (_, y) =>
          Array.from({ length: this.width },
            (_, x): BlockState => ({
              x, y, revealed: false, adjacentMines: 0,
            }),
          ),
      ),
    }
  }

  random(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  randomInt(min: number, max: number) {
    return Math.round(this.random(min, max))
  }

  // 生成炸弹
  generateMines(state: BlockState[][], initial: BlockState) {
    // 随机放置（生成对应数量的炸弹坐标）
    const placeRandom = () => {
      const x = this.randomInt(0, this.width - 1)
      const y = this.randomInt(0, this.height - 1)
      const block = state[y][x]
      // 让第一个翻牌肯定不是炸弹
      if (Math.abs(initial.x - block.x) <= 1 && Math.abs(initial.y - block.y) <= 1)
        return false
      if (block.mine)
        return false
      block.mine = true
      return true
    }
    // 根据炸弹总数 循环 随机放置函数
    Array.from({ length: this.mines }, () => null)
      .forEach(() => {
        let placed = false
        while (!placed)
          placed = placeRandom()
      })
    // 计算周边炸弹
    this.updateNumbers()
  }

  // 计算各自周边的炸弹数量
  updateNumbers() {
    this.board.forEach((row) => {
      row.forEach((block) => {
        // 如果是炸弹则跳过
        if (block.mine)
          return
        // 否则计算
        this.getSiblings(block).forEach((b) => {
          if (b.mine)
            block.adjacentMines += 1
        })
      })
    })
  }

  // 如果翻开的牌为0，则将周边同样为0的牌翻开
  expendZero(block: BlockState) {
    // 当前项不为0则跳过
    if (block.adjacentMines)
      return
    // 周边所有的0全翻开
    this.getSiblings(block).forEach((s) => {
      // 如果没有被翻开并且不是标记则翻开并递归
      if (!s.revealed) {
        if (!s.flagged)
          s.revealed = true
        this.expendZero(s)
      }
    })
  }

  // 初始炸弹未生产，翻开第一张mineGenerated = false

  // 右键标记
  onRightClick(block: BlockState) {
    // 如果游戏结束则不操作
    if (this.state.value.status !== 'play')
      return

    // 如果已经被翻开则无法标记
    if (block.revealed)
      return
    block.flagged = !block.flagged
  }

  // 点击翻开
  onClick(block: BlockState) {
    // 如果游戏是准备阶段，则变为进行阶段并开始计时
    if (this.state.value.status === 'ready') {
      this.state.value.status = 'play'
      this.state.value.startMS = +new Date()
    }
    // 如果不是进行阶段或者当前块为标记，则不操作（游戏刚开始一定得先左键才能开始标记）
    if (this.state.value.status !== 'play' || block.flagged)
      return

    // 初始炸弹未生产，翻开第一张时才生成
    if (!this.state.value.mineGenerated) {
      this.generateMines(this.board, block)
      this.state.value.mineGenerated = true
    }
    // 翻牌
    block.revealed = true
    // 如果点到炸弹，则游戏结束，并翻开所有牌
    if (block.mine) {
      this.onGameOver('lost')
      return
    }

    // 判断该块是否为0
    this.expendZero(block)
  }

  // 判断周边是否有炸弹
  // .filter(Boolean) => 移除所有的"false"类型，将越界的去除
  getSiblings(block: BlockState) {
    return diorections.map(([dx, dy]) => {
      const x2 = block.x + dx
      const y2 = block.y + dy
      // 超出边界的返回undefined
      if (x2 < 0 || x2 >= this.width || y2 < 0 || y2 >= this.height)
        return undefined
      // 不超出边界的剩余周边返回当前项
      return this.board[y2][x2]
    })
      .filter(Boolean) as BlockState[]
  }

  // 显示所有炸弹（翻到雷的时候）
  showAllMines() {
    this.board.flat().forEach((i) => {
      if (i.mine)
        i.revealed = true
    })
  }

  // 游戏状态
  // .flat()用于将嵌套的数组“拉平”，变成一维数组。该方法返回一个新数组
  // .every(callback)确定数组中的每一项的结果都满足所写的条件的时候,就会返回true,否则返回false
  // .some(callback)会遍历数组中的每个元素，让每个值都执行一遍callback函数
  // 如果有一个元素满足条件，返回true , 剩余的元素不会再执行检测。
  // 如果没有满足条件的元素，则返回false。
  checkGameState() {
    // 如果是首次点击或者当前状态不是进行阶段，则不操作
    if (!this.state.value.mineGenerated || this.state.value.status !== 'play')
      return
    const blocks = this.board.flat()

    // 如果所有的块被翻开或者被标记或者是炸弹
    // if (blocks.every(block => block.revealed || block.flagged || block.mine)) {
    //   // 如果某一块被标记但不是炸弹，则失败，并翻开所有牌
    //   if (blocks.some(block => block.flagged && !block.mine))
    //     this.onGameOver('lost')
    //   else
    //     this.onGameOver('won')
    // }
    // }

    // 如果
    if (!blocks.some(block => !block.revealed && !block.mine))
      this.onGameOver('won')
  }

  // 双击翻开周边（如果是炸弹则标记，不是炸弹则翻开）
  autoExpand(block: BlockState) {
    // 如果当前状态不是进行阶段或者标记块，则不操作
    if (this.state.value.status !== 'play' || block.flagged)
      return

    // 获取周边的所有块
    const siblings = this.getSiblings(block)
    // 获取周边标记了的块
    const flags = siblings.reduce((a, b) => a + (b.flagged ? 1 : 0), 0)
    // 获取周边没有翻开的块
    const notRevealed = siblings.reduce((a, b) => a + (!b.revealed && !b.flagged ? 1 : 0), 0)
    // 如果标记的块和当前块周边炸弹数量相等，则翻开
    if (flags === block.adjacentMines) {
      siblings.forEach((i) => {
        // i.revealed = true
        // if (!i.flagged && i.mine)
        //   this.onGameOver('lost')
        if (i.revealed || i.flagged)
          return
        i.revealed = true
        this.expendZero(i)
        if (i.mine)
          this.onGameOver('lost')
      })
    }
    // 获取块周边剩余的标记数
    const missingFlags = block.adjacentMines - flags
    // 如果周边没有翻开的块和剩余的标记数相等，则标记
    if (notRevealed === missingFlags) {
      siblings.forEach((i) => {
        if (!i.revealed && !i.flagged)
          i.flagged = true
      })
    }
  }

  // 判断游戏是否结束
  onGameOver(status: GameStatus) {
    this.state.value.status = status
    this.state.value.endMS = +Date.now()
    if (status === 'lost') {
      this.showAllMines()
      setTimeout(() => {
        alert('lost')
      }, 30)
    }
  }
}
