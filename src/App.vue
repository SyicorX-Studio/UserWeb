<script setup lang="ts">
import Turntable from './components/Turntable.vue'
</script>

<template>
  <Turntable />
</template>

<style>
/* Reset */
body, html {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden; /* Prevent scrolling during spin if possible */
}
#app {
  width: 100%;
  height: 100%;
}
</style>
