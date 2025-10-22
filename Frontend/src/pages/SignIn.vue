<template>
  <div class="page">
    <div v-if="ISLOGGEDIN" class="flex-container">
      <div class="card">
        <p class="message">You are already logged in!</p>
        <router-link to="/" class="link-button">Go to the main page</router-link>
      </div>
    </div>

    <div v-else class="flex-container">
      <div class="card">
        <h2>Sign In</h2>

        <form v-on:submit.prevent="handleSubmit" class="form">
          <q-input v-model="NICKNAME" type="text" placeholder="Nickname" required />

          <q-input v-model="PASSWORD" type="password" placeholder="Password" required />

          <!-- pridat login error sem cez v-if -->

          <q-btn label="Sign in" @click="signinUser" color="primary" />

        </form>

        <p class="footer-text">
          Don’t have an account? <router-link to="/create" class="footer-link">Sign up</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ISLOGGEDIN, NICKNAME, PASSWORD } from 'src/stores/globalStates'
import { useRouter } from 'vue-router'
import { useUserStore } from 'src/stores/userStore'
import { useChannelStore } from 'src/stores/channelStore'
import { onMounted } from 'vue'

const userStore = useUserStore()
const router = useRouter()

onMounted(() => {
  userStore.loadUsers()
  console.log('users', userStore.users)
})

function signinUser() {
  const user = userStore.findUser(NICKNAME.value, PASSWORD.value)

  if(user){
    console.log('Signing in: ', user.nickname)
    ISLOGGEDIN.value = true

    const channelStore = useChannelStore()
    channelStore.loadChannels()

    router.push('/')
  }
  else{
    ISLOGGEDIN.value = false
  }
}

function handleSubmit() {
  ISLOGGEDIN.value = true

  router.push('/')
}
</script>

<style lang="scss" scoped>
@import 'src/css/auth.scss';

.page {
  min-height: 100vh;
  background: $auth-background;
}

.flex-container {
  min-height: 85vh;
}
</style>