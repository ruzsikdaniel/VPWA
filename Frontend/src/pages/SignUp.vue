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
        <q-input v-model="FIRSTNAME" type="text" placeholder="First Name" required />

        <q-input v-model="LASTNAME" type="text" placeholder="Last Name" required />

        <q-input v-model="NICKNAME" type="text" placeholder="Nickname" required />

        <q-input v-model="EMAIL" type="email" placeholder="Email" required />

        <q-input v-model="PASSWORD" type="password" placeholder="Password" required />

        <q-input
          v-model="CONFIRMPASSWORD"
          type="password"
          placeholder="Confirm Password"
          required
        />

        <q-btn type="submit" class="submit-button">Sign Up</q-btn>
      </form>

      <p class="footer-text">
        Already have an account? <router-link to="/signin" class="footer-link">Sign in</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { api } from 'boot/axios'
import { CONFIRMPASSWORD, EMAIL, FIRSTNAME, ISLOGGEDIN, LASTNAME, NICKNAME, PASSWORD, PROFILECOLOR, selectRandomColor, TOKEN } from 'src/stores/globalStates'

const router = useRouter()

async function handleSubmit() {
  if (
    FIRSTNAME.value.trim() === '' ||
    LASTNAME.value.trim() === '' ||
    NICKNAME.value.trim() === '' ||
    EMAIL.value.trim() === '' ||
    PASSWORD.value.trim() === '' ||
    CONFIRMPASSWORD.value.trim() === ''
  ) {
    alert('All fields are required')
  } else {
    if (PASSWORD.value.trim() === CONFIRMPASSWORD.value.trim()) {
      let profileColor = selectRandomColor()

      const userData = {
        firstName: FIRSTNAME.value.trim(),
        lastName: LASTNAME.value.trim(),
        nickname: NICKNAME.value.trim(),
        email: EMAIL.value.trim(),
        password: PASSWORD.value.trim(),
        profileColor: profileColor,
      }

      try {
        const response = await api.post('/auth/register', userData)
        const data = response.data

        if (data.status && data.status !== 200) {
          alert(data.message)
        } else {
          NICKNAME.value = data.user.nickname
          PASSWORD.value = ''
          CONFIRMPASSWORD.value = ''
          TOKEN.value = data.token.token
          FIRSTNAME.value = data.user.firstName
          LASTNAME.value = data.user.lastName
          EMAIL.value = data.user.email
          PROFILECOLOR.value = data.user.profileColor
          ISLOGGEDIN.value = true
          router.push('/')
        }
      } catch (err) {
        console.error(err)
        throw err
      }
    } else {
      alert("Passwords don't match")
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'src/css/auth.scss';
</style>
