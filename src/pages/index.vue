<script setup lang="ts">
import { isDev, toggleDev } from '~/composables'
import { GamePlay } from '~/composables/logic'

const play = new GamePlay(6, 6, 3)

// 计时（vueuse里面的一个工具）
// const start = new Date()
// const now = $(useNow())
// const timerMS = $computed(() => Math.round((+now - +start) / 1000))
// 持续化（刷新不重置）（vueuse里面的一个工具）
useStorage('vuesweeper-state', play.state)

const state = $computed(() => play.board)

const mineCount = $computed(() => {
  return play.blocks.reduce((a, b) => a + (b.mine ? 1 : 0), 0)
})

// 选择难度
function newGame(difficulty: 'easy' | 'medium' | 'hard') {
  switch (difficulty) {
    case 'easy':
      play.reset(9, 9, 5)
      break
    case 'medium':
      play.reset(16, 16, 30)
      break
    case 'hard':
      play.reset(30, 16, 60)
      break
  }
}

// 监听依赖
watchEffect(() => {
  play.checkGameState()
})
</script>

<template>
  Minesweeper

  <!-- 调整难度 -->
  <div flex="~ gap1" justify-center p4>
    <button btn @click="play.reset()">
      New Game
    </button>
    <button btn @click="newGame('easy')">
      Easy
    </button>
    <button btn @click="newGame('medium')">
      Medium
    </button>
    <button btn @click="newGame('hard')">
      Hard
    </button>
  </div>

  <div flex justify-center>
    <!-- <div font-mono text-2xl flex="~ gap-1" items-center>
      <div i-carbon-timer />
      {{ timerMS }}
    </div> -->
    <div>
      Count:{{ mineCount }}
    </div>
  </div>

  <div p5 w-full overflow-auto>
    <div>
      <div
        v-for="row, y in state"
        :key="y"
        flex="~"
        items-center justify-center w-max ma
      >
        <MineBlock
          v-for="block, x in row"
          :key="x"
          :block="block"
          @click="play.onClick(block)"
          @contextmenu.prevent="play.onRightClick(block)"
        />
      </div>
    </div>
  </div>

  <div flex="~ gap-1" justify-center>
    <button btn @click="toggleDev()">
      {{ isDev ? 'DEV' : 'NORMAL' }}
    </button>
  </div>

  <Confetti :passed="play.state.value.gameState === 'won'" />
</template>
