// 设置环境（true为开发，false为生产）
export const isDev = ref(false)

// 切换环境事件
export const toggleDev = useToggle(isDev)
