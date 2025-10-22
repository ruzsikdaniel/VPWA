<template>
  <div v-if="ISLOGGEDIN" class="flex-container">
    <div class="card">
      <p class="message">You are already logged in!</p>
      <router-link to="/" class="link-button">Go to the main page</router-link>
    </div>
  </div>

  <div v-else class="flex-container">
    <div class="card">
      <h2>Sign Up</h2>

      <form v-on:submit.prevent="handleSubmit" class="form">
        <input v-model="FIRSTNAME" type="text" placeholder="First Name" required />

        <input v-model="LASTNAME" type="text" placeholder="Last Name" required />

        <input v-model="NICKNAME" type="text" placeholder="Nickname" required />

        <input v-model="EMAIL" type="email" placeholder="Email" required />

        <input v-model="PASSWORD" type="password" placeholder="Password" required />

        <input v-model="CONFIRMPASSWORD" type="password" placeholder="Confirm Password" required />

        <button type="submit" class="submit-button">Sign Up</button>
      </form>

      <p class="footer-text">
        Already have an account? <router-link to="/signin" class="footer-link">Sign in</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import {
  ISLOGGEDIN,
  FIRSTNAME,
  LASTNAME,
  NICKNAME,
  EMAIL,
  PASSWORD,
  CONFIRMPASSWORD,
} from 'src/stores/globalStates'
import { useRouter } from 'vue-router'
import { useUserStore } from 'src/stores/userStore'

const userStore = useUserStore()

const router = useRouter()

function handleSubmit() {
  if (PASSWORD.value === CONFIRMPASSWORD.value) {
    ISLOGGEDIN.value = true

    userStore.addUser(
      FIRSTNAME, LASTNAME, NICKNAME, EMAIL, PASSWORD
    )

    console.log('users: ', userStore.users)

    router.push('/')
  } else {
    alert("Passwords don't match")
  }
}
</script>

<style lang="scss" scoped>
@import 'src/css/auth.scss';
</style>
