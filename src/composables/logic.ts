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

export class GamePlay {
  state = ref<BlockState[][]>([])
  mineGenerated = false

  constructor(public width: number, public height: number) {
    this.reset()
  }

  // 重置游戏
  reset() {
    this.mineGenerated = false
    this.state.value = Array.from({ length: this.height },
      (_, y) =>
        Array.from({ length: this.width },
          (_, x): BlockState => ({
            x, y, revealed: false, adjacentMines: 0,
          }),
        ),
    )
  }

  // 生成炸弹
  generateMines(state: BlockState[][], initial: BlockState) {
    for (const row of state) {
      for (const block of row) {
        // 让第一个翻牌肯定不是炸弹
        if (Math.abs(initial.x - block.x) < 1)
          continue

        if (Math.abs(initial.y - block.y) < 1)
          continue

        block.mine = Math.random() < 0.1
      }
    }
    // 计算周边炸弹
    this.updateNubers()
  }

  // 计算各自周边的炸弹数量
  updateNubers() {
    this.state.value.forEach((row) => {
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
    // 如果已经被翻开则无法标记
    if (block.revealed)
      return
    block.flagged = !block.flagged
    // 判断是否游戏结束
    // this.checkGameState()
  }

  // 点击翻开
  onClick(block: BlockState) {
    // 初始炸弹未生产，翻开第一张时才生成
    if (!this.mineGenerated) {
      this.generateMines(this.state.value, block)
      this.mineGenerated = true
    }
    // 翻牌
    block.revealed = true
    // 如果点到炸弹
    if (block.mine)
      alert('BOOM!')
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
      return this.state.value[y2][x2]
    })
      .filter(Boolean) as BlockState[]
  }

  // 游戏状态
  // .flat()用于将嵌套的数组“拉平”，变成一维数组。该方法返回一个新数组
  // .every(callback)确定数组中的每一项的结果都满足所写的条件的时候,就会返回true,否则返回false
  // .some(callback)会遍历数组中的每个元素，让每个值都执行一遍callback函数
  // 如果有一个元素满足条件，返回true , 剩余的元素不会再执行检测。
  // 如果没有满足条件的元素，则返回false。
  checkGameState() {
    // 初次点击不进行判断，不管输赢
    if (!this.mineGenerated)
      return
    const blocks = this.state.value.flat()

    // 如果所有的块被翻开或者被标记
    if (blocks.every(block => block.revealed || block.flagged)) {
      // 如果某一块被标记但是不是炸弹，则显示 作弊（漏洞，可以优化）
      if (blocks.some(block => block.flagged && !block.mine))
        alert('You cheat!')
      else alert('You win!')
    }
  }
}
