<script setup lang="ts">
// import type { BlockState } from '~/types'

interface BlockState {
  x: number
  y: number
  revealed: boolean
  mine?: boolean
  flagged?: boolean
  adjacentMines: number
}

// 背景表格
const WIDTH = 5
const HEIGHT = 5
const state = ref(
  Array.from({ length: HEIGHT },
    (_, y) =>
      Array.from({ length: WIDTH },
        (_, x): BlockState =>
          ({
            x, y, revealed: false, adjacentMines: 0,
          }),
      ),
  ),
)

// 生成炸弹
function generateMines(initial: BlockState) {
  for (const row of state.value) {
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
  updateNubers()
}

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

// 根据周边炸弹数量决定数字颜色
const numberColors = [
  'text-transparent',
  'text-blue-500',
  'text-green-500',
  'text-yellow-500',
  'text-orange-500',
  'text-red-500',
  'text-pink-500',
  'text-teal-500',
]

// 计算各自周边的炸弹数量
function updateNubers() {
  state.value.forEach((row, y) => {
    row.forEach((block, x) => {
      // 如果是炸弹则跳过
      if (block.mine)
        return
      // 否则计算
      getSiblings(block).forEach((b) => {
        if (b.mine)
          block.adjacentMines += 1
      })
    })
  })
}

// 如果翻开的牌为0，则将周边同样为0的牌翻开
function expendZero(block: BlockState) {
  // 当前项不为0则跳过
  if (block.adjacentMines)
    return
  // 周边所有的0全翻开
  getSiblings(block).forEach((s) => {
    // 如果没有被翻开则翻开并递归
    if (!s.revealed) {
      s.revealed = true
      expendZero(s)
    }
  })
}

// 初始炸弹未生产，翻开第一张时才生成
let mineGenerated = false
// 设置环境（true为开发，false为生产）
const dev = false

// 右键标记
function onRightClick(block: BlockState) {
  // 如果已经被翻开则无法标记
  if (block.revealed)
    return
  block.flagged = !block.flagged
  // 判断是否游戏结束
  checkGameState()
}

// 点击翻开
function onClick(e: MouseEvent, block: BlockState) {
  // 初始炸弹未生产，翻开第一张时才生成
  if (!mineGenerated) {
    generateMines(block)
    mineGenerated = true
  }
  // 翻牌
  block.revealed = true
  // 如果点到炸弹
  if (block.mine)
    alert('BOOM!')
  // 判断该块是否为0
  expendZero(block)
  // 判断是否游戏结束
  // checkGameState()
}

// 块的背景
function getBlockClass(block: BlockState) {
  // 如果被标记
  if (block.flagged)
    return 'bg-gray-500/10'

  // 如果没有被翻开
  if (!block.revealed)
    return 'bg-gray-500/10 hover:bg-gray-500/20'
  return block.mine ? 'bg-red-500/50' : numberColors[block.adjacentMines]
}

// 判断周边是否有炸弹
// .filter(Boolean) => 移除所有的"false"类型，将越界的取除
function getSiblings(block: BlockState) {
  return diorections.map(([dx, dy]) => {
    const x2 = block.x + dx
    const y2 = block.y + dy
    // 超出边界的返回undefined
    if (x2 < 0 || x2 >= WIDTH || y2 < 0 || y2 >= HEIGHT)
      return undefined
    // 不超出边界的剩余周边返回当前项
    return state.value[y2][x2]
  })
    .filter(Boolean) as BlockState[]
}

// 当state.value改变时监听每次点击游戏的状态
watchEffect(checkGameState)

// 游戏状态
// .flat()用于将嵌套的数组“拉平”，变成一维数组。该方法返回一个新数组
// .every(callback)确定数组中的每一项的结果都满足所写的条件的时候,就会返回true,否则返回false
// .some(callback)会遍历数组中的每个元素，让每个值都执行一遍callback函数
// 如果有一个元素满足条件，返回true , 剩余的元素不会再执行检测。
// 如果没有满足条件的元素，则返回false。
function checkGameState() {
  // 初次点击不进行判断，不管输赢
  if (!mineGenerated)
    return
  const blocks = state.value.flat()

  // 如果所有的块被翻开或者被标记
  if (blocks.every(block => block.revealed || block.flagged)) {
    // 如果某一块被标记但是不是炸弹，则显示 作弊（漏洞，可以优化）
    if (blocks.some(block => block.flagged && !block.mine))
      alert('You cheat!')
    else alert('You win!')
  }
}
</script>

<template>
  Minesweeper
  <div p5>
    <div>
      <div
        v-for="row, y in state"
        :key="y"
        flex="~"
        items-center justify-center
      >
        <button
          v-for="block, x in row"
          :key="x"
          w-10
          h-10
          m="0.5"
          border="1 gray-400/50"
          flex="~"
          items-center justify-center
          :class="getBlockClass(block)"
          @click="onClick($event, block)"
          @contextmenu.prevent="onRightClick(block)"
        >
          <template v-if="block.flagged || dev">
            <div i-mdi-flag text-red />
          </template>
          <template v-else-if="block.revealed || dev">
            <div v-if="block.mine" i-mdi:mine />
            <div v-else>
              {{ block.adjacentMines || '.' }}
            </div>
          </template>
        </button>
      </div>
    </div>
  </div>
</template>
