<template>
    <header class="nav-bar">
        <div>

        </div>
        <div class="top-bar-right">
          <div v-bind:title="`${FIRSTNAME} ${LASTNAME} | ${NICKNAME} | ${EMAIL}`">
            Logged in: {{ NICKNAME }}
          </div>
          <button v-on:click="logOut">Log Out</button>
        </div>
      </header>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { ISLOGGEDIN, FIRSTNAME, LASTNAME, NICKNAME, EMAIL, PASSWORD, CONFIRMPASSWORD} from 'src/stores/globalStates';

const router = useRouter()

// Handle log out
const logOut = () => {
  ISLOGGEDIN.value = false
  FIRSTNAME.value = ''
  LASTNAME.value = ''
  NICKNAME.value = ''
  EMAIL.value = ''
  PASSWORD.value = ''
  CONFIRMPASSWORD.value = ''
  router.push('/signin')
}
</script>

<style lang="scss" scoped>
/* --- Top bar --- */
.nav-bar {
  height: 60px;
  color: white;

  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 0 1rem;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.top-bar-right button {
  border: none;
  color: white;
  border-radius: 50px;
  background-color: transparent;
  width: 75px;
  height: 35px;
  text-decoration: underline;

  transition:
    background-color 0.15s ease,
    font-size 0.15s ease,
    font-weight 0.15s ease;
}

.top-bar-right button:hover {
  font-size: 16px;
  background-color: rgba(255, 255, 255, 0.1);
  font-weight: bold;
  text-decoration: none;
  cursor: pointer;
}
</style>