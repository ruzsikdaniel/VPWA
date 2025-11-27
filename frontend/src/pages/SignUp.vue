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
import {
  ISLOGGEDIN,
  FIRSTNAME,
  LASTNAME,
  NICKNAME,
  EMAIL,
  PASSWORD,
  CONFIRMPASSWORD,
  PROFILECOLOR,
  TOKEN,
} from 'src/stores/globalStates'
import { useRouter } from 'vue-router'
//import { useUserStore } from 'src/stores/userStore'
import { api } from 'boot/axios'

//const userStore = useUserStore()

const router = useRouter()

/*
function handleSubmit() {
  if (PASSWORD.value === CONFIRMPASSWORD.value) {
    userStore.addUser(FIRSTNAME, LASTNAME, NICKNAME, EMAIL, PASSWORD)

    console.log('users: ', userStore.users)

    ISLOGGEDIN.value = true
    router.push('/')
  } else {
    alert("Passwords don't match")
  }
}
*/

async function handleSubmit() {
  if (PASSWORD.value === CONFIRMPASSWORD.value) {
    // TODO: implement assigning random color
    let profileColor = 'red'

    const userData = {
      firstName: FIRSTNAME.value,
      lastName: LASTNAME.value,
      nickname: NICKNAME.value,
      email: EMAIL.value,
      password: PASSWORD.value,
      profileColor: profileColor,
    }

    try {
      const response = await api.post('/auth/register', userData)
      const { user, token } = response.data

      console.log(user)

      NICKNAME.value = user.nickname
      PASSWORD.value = ''
      CONFIRMPASSWORD.value = ''
      TOKEN.value = token.token
      FIRSTNAME.value = user.firstName
      LASTNAME.value = user.lastName
      EMAIL.value = user.email
      PROFILECOLOR.value = user.profileColor
      ISLOGGEDIN.value = true
      router.push('/')

      return user
    } catch (err) {
      console.error(err)
      throw err
    }
  } else {
    alert("Passwords don't match")
  }
}
</script>

<style lang="scss" scoped>
@import 'src/css/auth.scss';
</style>
