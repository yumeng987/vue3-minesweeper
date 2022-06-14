/* eslint-disable no-alert */
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

interface GameState {
  board: BlockState[][]
  mineGenerated: boolean
  gameState: 'play' | 'won' | 'lost'
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
  reset() {
    this.state.value = {
      mineGenerated: false,
      gameState: 'play',
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
      const block = state[x][y]
      // 让第一个翻牌肯定不是炸弹
      if (Math.abs(initial.x - block.x) < 1)
        return false
      if (Math.abs(initial.y - block.y) < 1)
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
      // 如果没有被翻开则翻开并递归
      if (!s.revealed) {
        s.revealed = true
        this.expendZero(s)
      }
    })
  }

  // 初始炸弹未生产，翻开第一张mineGenerated = false

  // 右键标记
  onRightClick(block: BlockState) {
    // 如果游戏结束则不操作
    if (this.state.value.gameState !== 'play')
      return

    // 如果已经被翻开则无法标记
    if (block.revealed)
      return
    block.flagged = !block.flagged
    // 判断是否游戏结束
    // this.checkGameState()
  }

  // 点击翻开
  onClick(block: BlockState) {
    // 如果游戏结束则不操作
    if (this.state.value.gameState !== 'play')
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
      this.state.value.gameState = 'lost'
      this.showAllMines()
      return
    }

    // 判断该块是否为0
    this.expendZero(block)
    // 判断是否游戏结束
    // checkGameState()
  }

  // 判断周边是否有炸弹
  // .filter(Boolean) => 移除所有的"false"类型，将越界的取除
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
    // 初次点击不进行判断，不管输赢
    if (!this.state.value.mineGenerated)
      return
    const blocks = this.board.flat()

    // 如果所有的块被翻开或者被标记
    if (blocks.every(block => block.revealed || block.flagged)) {
      // 如果某一块被标记但是不是炸弹，则失败，并翻开所有牌
      if (blocks.some(block => block.flagged && !block.mine)) {
        this.state.value.gameState = 'lost'
        this.showAllMines()
        alert('lost')
      }
      else {
        this.state.value.gameState = 'won'
      }
    }
  }
}
