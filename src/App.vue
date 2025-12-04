<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  // mounted() {
  //   this.checkAndShowNotification();
  // },

  // methods: {

  //   checkAndShowNotification() {
  //     const hasUnfinishedTask = true; // 替换为实际判断逻辑
  //     if (hasUnfinishedTask) {
  //       this.$notify({
  //         title: '任务提醒',
  //         message: '有任务未完成，请尽快处理！',
  //         type: 'warning',
  //         duration: 0
  //       });
  //     }
  //   }
  // }
}
</script>
