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

          <q-btn type="submit" class="submit-button">Sign In</q-btn>
        </form>

        <p class="footer-text">
          Don’t have an account? <router-link to="/create" class="footer-link">Sign up</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { api } from 'boot/axios'
import { EMAIL, FIRSTNAME, ISLOGGEDIN, LASTNAME, NICKNAME, PASSWORD, PROFILECOLOR, TOKEN } from 'src/stores/globalStates'

const router = useRouter()

async function handleSubmit() {
  const credentials = {
    nickname: NICKNAME.value,
    password: PASSWORD.value,
  }

  try {
    const response = await api.post('/auth/login', credentials)
    const { user, token } = response.data

    console.log(user)

    NICKNAME.value = user.nickname
    PASSWORD.value = ''
    TOKEN.value = token.token
    FIRSTNAME.value = user.firstName
    LASTNAME.value = user.lastName
    PROFILECOLOR.value = user.profileColor
    EMAIL.value = user.email
    ISLOGGEDIN.value = true

    router.push('/')
  } catch (err) {
    alert('Wrong Credentials')
    throw err
  }
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
