<script setup lang="ts">
import type { BlockState } from '~/types'
import { isDev } from '~/composables'

defineProps<{ block: BlockState }>()

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
</script>

<template>
  <button
    min-w-8
    min-h-8
    m="1px"
    border="0.5 gray-400/50"
    flex="~"
    items-center justify-center
    :class="getBlockClass(block)"
  >
    <template v-if="block.flagged">
      <div i-mdi-flag text-red />
    </template>
    <template v-else-if="block.revealed || isDev">
      <div v-if="block.mine" i-mdi:mine />
      <div v-else font-600>
        {{ block.adjacentMines || '.' }}
      </div>
    </template>
  </button>
</template>
