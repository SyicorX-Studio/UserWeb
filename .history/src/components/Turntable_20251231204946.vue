<script setup lang="ts">
import { ref, computed } from 'vue'

interface Prize {
  id: number
  name: string
  probability: number
  color: string
  textColor: string
}

// 奖品配置
const prizes: Prize[] = [
  { id: 1, name: '一等奖', probability: 0.05, color: '#FFD700', textColor: '#B71C1C' }, // 金色
  { id: 2, name: '二等奖', probability: 0.10, color: '#FFF8E1', textColor: '#B71C1C' }, // 淡黄
  { id: 3, name: '三等奖', probability: 0.20, color: '#FFCDD2', textColor: '#B71C1C' }, // 浅红
  { id: 4, name: '四等奖', probability: 0.30, color: '#EF9A9A', textColor: '#B71C1C' }, // 稍深红
  { id: 5, name: '五等奖', probability: 0.34, color: '#E57373', textColor: '#FFFFFF' }, // 深红
  { id: 6, name: '未中奖', probability: 0.01, color: '#B71C1C', textColor: '#FFFFFF' }, // 暗红
]

const isSpinning = ref(false)
const rotation = ref(0)
const showResult = ref(false)
const resultPrize = ref<Prize | null>(null)

// 计算转盘背景的 conic-gradient
const wheelStyle = computed(() => {
  const sectorAngle = 360 / prizes.length
  let gradientStr = 'conic-gradient('
  
  prizes.forEach((prize, index) => {
    const startAngle = index * sectorAngle
    const endAngle = (index + 1) * sectorAngle
    gradientStr += `${prize.color} ${startAngle}deg ${endAngle}deg,`
  })
  
  // 移除最后一个逗号并闭合
  gradientStr = gradientStr.slice(0, -1) + ')'
  
  return {
    background: gradientStr,
    transform: `rotate(${rotation.value}deg)`,
    transition: isSpinning.value ? 'transform 3s cubic-bezier(0.2, 0.8, 0.3, 1)' : 'none'
  }
})

// 抽奖逻辑
const startLottery = async () => {
  if (isSpinning.value) return

  // 1. 计算中奖结果
  const random = Math.random()
  let currentProb = 0
  let selectedPrize = prizes[prizes.length - 1] // 默认最后一个

  for (const prize of prizes) {
    currentProb += prize.probability
    if (random < currentProb) {
      selectedPrize = prize
      break
    }
  }

  // 2. 计算旋转角度
  // 每个扇区角度 60度
  const sectorAngle = 360 / prizes.length
  // 目标索引
  const index = prizes.findIndex(p => p.id === selectedPrize.id)
  
  // 计算目标角度：要让指针指向该扇区，转盘需要旋转到：360 - (index * sectorAngle + sectorAngle / 2)
  // 加上多圈旋转 (比如 5 圈 = 1800度)
  const baseRotation = 1800 
  // 随机偏移量，防止每次都停在正中间
  const randomOffset = (Math.random() - 0.5) * (sectorAngle - 10) 
  
  // 目标位置校正：
  // 假设指针在顶部 (0度/360度位置)
  // 扇区0是 0-60度，扇区1是 60-120度...
  // 要让扇区0停在顶部，转盘需要旋转 360 - 30 = 330度 (或者 -30度)
  // 要让扇区1停在顶部，转盘需要旋转 360 - 90 = 270度
  // 公式：targetRotation = 360 - (index * sectorAngle + sectorAngle / 2)
  
  const targetRotation = 360 - (index * sectorAngle + sectorAngle / 2) + randomOffset
  const finalRotation = rotation.value + baseRotation + (targetRotation - (rotation.value % 360))

  isSpinning.value = true
  rotation.value = finalRotation
  resultPrize.value = selectedPrize

  // 3. 等待动画结束
  setTimeout(() => {
    isSpinning.value = false
    showResult.value = true
    triggerWebhook(selectedPrize)
  }, 3000)
}

// 触发 Webhook
const triggerWebhook = async (prize: Prize) => {
  const webhookUrl = 'https://www.feishu.cn/flow/api/trigger-webhook/db8d94317fd960eec7e22bbfe78ee982'
  try {
    // 尝试使用 fetch 发送
    // 注意：如果是纯前端直接调用飞书 Webhook 可能会遇到 CORS 问题
    console.log(`正在发送 Webhook: ${webhookUrl}, 奖品: ${prize.name}`);
    console.log(`如果是跨域失败，请尝试使用以下 curl 命令测试：`);
    console.log(`curl -X POST -H "Content-Type: application/json" -d '{"type": "${prize.name}"}' ${webhookUrl}`);

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: prize.name
      })
    })
  } catch (e) {
    console.error('Webhook trigger failed (可能是跨域限制):', e)
  }
}

const closeResult = () => {
  showResult.value = false
}
</script>

<template>
  <div class="turntable-container">
    <div class="turntable-wrapper">
      <!-- 转盘主体 -->
      <div class="wheel" :style="wheelStyle">
        <!-- 奖品文字 -->
        <div 
          v-for="(prize, index) in prizes" 
          :key="prize.id"
          class="prize-label"
          :style="{
            transform: `rotate(${index * (360 / prizes.length) + (360 / prizes.length / 2)}deg) translateY(-140px)`,
            color: prize.textColor
          }"
        >
          {{ prize.name }}
        </div>
      </div>
      
      <!-- 指针 -->
      <div class="pointer"></div>
      
      <!-- 开始按钮 -->
      <button class="start-btn" @click="startLottery" :disabled="isSpinning">
        {{ isSpinning ? '...' : '抽奖' }}
      </button>
    </div>

    <!-- 结果弹窗 -->
    <div v-if="showResult" class="modal-overlay" @click="closeResult">
      <div class="modal-content" @click.stop>
        <h3>🎉 抽奖结果 🎉</h3>
        <p class="result-text">{{ resultPrize?.name }}</p>
        <button @click="closeResult">确定</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.turntable-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: radial-gradient(circle, #D32F2F 0%, #880E4F 100%);
  overflow: hidden;
  padding: 20px;
}

.turntable-wrapper {
  position: relative;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(0,0,0,0.5);
  border: 10px solid #FFC107;
  background: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
}

.wheel {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  position: relative;
}

.prize-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: 0 0;
  font-weight: bold;
  font-size: 16px;
  text-align: center;
  width: 20px;
  height: 0;
  line-height: 0;
  white-space: nowrap;
  z-index: 1;
}

.pointer {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-top: 30px solid #FFD700;
  z-index: 10;
  filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));
}

.start-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: #FF5722;
  border: 4px solid #fff;
  color: #fff;
  font-weight: bold;
  font-size: 18px;
  cursor: pointer;
  z-index: 20;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  outline: none;
}

.start-btn:disabled {
  background: #9e9e9e;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 16px;
  text-align: center;
  width: 80%;
  max-width: 300px;
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.result-text {
  font-size: 24px;
  color: #D32F2F;
  margin: 20px 0;
  font-weight: bold;
}

button {
  background: #D32F2F;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

@keyframes popIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
