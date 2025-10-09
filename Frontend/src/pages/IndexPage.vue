<template>
  <div v-if="isLoggedIn" class="layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <h2>Chanels</h2>
      <ul>
        <li>
          <div>C1</div>
          <div>Chanel 1</div>
        </li>
        <li>
          <div>C2</div>
          <div>Chanel 2</div>
        </li>
        <li>
          <div>C3</div>
          <div>Chanel 3</div>
        </li>
        <li>
          <div>C4</div>
          <div>Chanel 4</div>
        </li>
        <li>
          <div>C5</div>
          <div>Chanel 5</div>
        </li>
        <li>
          <div>C6</div>
          <div>Chanel 6</div>
        </li>
        <li>
          <div>C7</div>
          <div>Chanel 7</div>
        </li>
        <li>
          <div>C8</div>
          <div>Chanel 8</div>
        </li>
        <li>
          <div>C9</div>
          <div>Chanel 9</div>
        </li>
        <li>
          <div>C10</div>
          <div>Chanel 10</div>
        </li>
        <li>
          <div>C10</div>
          <div>Chanel 10</div>
        </li>
        <li>
          <div>C10</div>
          <div>Chanel 10</div>
        </li>
        <li>
          <div>C10</div>
          <div>Chanel 10</div>
        </li>
        <li>
          <div>C10</div>
          <div>Chanel 10</div>
        </li>
        <li>
          <div>C10</div>
          <div>Chanel 10</div>
        </li>
        <li>
          <div>C10</div>
          <div>Chanel 10</div>
        </li>
        <li>
          <div>C10</div>
          <div>Chanel 10</div>
        </li>
      </ul>
    </aside>

    <!-- Main area -->
    <div class="main">
      <!-- Top bar -->
      <header class="top-bar">
        <div></div>
        <div class="top-bar-right">
          <div v-bind:title="`${name} ${surname} | ${nickname} | ${email}`">
            Logged in: {{ nickname }}
          </div>
          <button v-on:click="logOut">Log Out</button>
        </div>
      </header>

      <!-- Chat / content area -->
      <div class="content">
        <div class="selected-chanel">
          <div>SC</div>
          <div>Selected Chanel</div>
        </div>

        <div class="messages">
          <div class="message">
            <div class="profile-picture">NS</div>
            <div>
              <div class="username">Name Surname</div>
              <div class="message-text">Message 2</div>
            </div>
          </div>

          <div class="message">
            <div class="profile-picture">NS</div>
            <div>
              <div class="username">Name Surname</div>
              <div class="message-text">Message 1</div>
            </div>
          </div>

          <div class="message">
            <div class="profile-picture">NS</div>
            <div>
              <div class="username">Name Surname</div>
              <div class="message-text">Message 1</div>
            </div>
          </div>

          <div class="message">
            <div class="profile-picture">NS</div>
            <div>
              <div class="username">Name Surname</div>
              <div class="message-text">Message 1</div>
            </div>
          </div>

          <div class="message">
            <div class="profile-picture">NS</div>
            <div>
              <div class="username">Name Surname</div>
              <div class="message-text">Message 1</div>
            </div>
          </div>

          <div class="message">
            <div class="profile-picture">NS</div>
            <div>
              <div class="username">Name Surname</div>
              <div class="message-text">Message 1</div>
            </div>
          </div>

          <div class="message">
            <div class="profile-picture">NS</div>
            <div>
              <div class="username">Name Surname</div>
              <div class="message-text">Message 1</div>
            </div>
          </div>

          <div class="message">
            <div class="profile-picture">NS</div>
            <div>
              <div class="username">Name Surname</div>
              <div class="message-text">Message 1</div>
            </div>
          </div>

          <div class="message">
            <div class="profile-picture">NS</div>
            <div>
              <div class="username">Name Surname</div>
              <div class="message-text">Message 1</div>
            </div>
          </div>

          <div class="message">
            <div class="profile-picture">NS</div>
            <div>
              <div class="username">Name Surname</div>
              <div class="message-text">
                Messagedddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd
              </div>
            </div>
          </div>

          <div class="message">
            <div class="profile-picture">NS</div>
            <div>
              <div class="username">Name Surname</div>
              <div class="message-text">Message 1</div>
            </div>
          </div>
        </div>

        <!-- Input and bottom -->
        <div class="input-container">
          <textarea
            rows="1"
            placeholder="Type your message here..."
            ref="autoResize"
            v-model="message"
            v-on:input="resizeTextarea"
          ></textarea>
          <div style="display: flex; flex-direction: column">
            <div style="flex: 1"></div>
            <button>Send</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  isLoggedIn,
  name,
  surname,
  nickname,
  email,
  password,
  confirmPassword,
} from 'src/stores/globalStates'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

const router = useRouter()

const message = ref('')

// Redirect if not signed in
if (isLoggedIn.value === false) {
  router.push('/signin')
}

// Handle automatic resizing of a message field
const autoResize = ref(null)
function resizeTextarea() {
  const el = autoResize.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}
onMounted(() => {
  resizeTextarea() // run it when component is mounted to set the initial height
})

// Handle log out
const logOut = () => {
  isLoggedIn.value = false
  name.value = ''
  surname.value = ''
  nickname.value = ''
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
  router.push('/signin')
}
</script>

<style lang="scss" scoped>
/* --- Layout --- */
.layout {
  display: flex;
  height: 100vh;
  background: radial-gradient(circle at top left, $primary-bg-1, $primary-bg-2);
}

/* --- Sidebar --- */
.sidebar {
  width: 300px;
  color: white;
  display: flex;
  flex-direction: column;
}

.sidebar h2 {
  margin: 0;
  padding-left: 1.2rem;
  font-size: 1.5rem;
  height: 60px;
}

.sidebar ul {
  background-color: rgba(0, 0, 0, 0.4);

  flex: 1;
  overflow-y: auto;

  padding: 1rem;
  padding-left: 0.5rem;

  margin: 0;
  margin-bottom: 0.5rem;
  margin-left: 0.5rem;

  border: 1px $primary solid;
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
}

.sidebar li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.5rem;
  border-radius: 10px;
  transition: background-color 0.1s ease;
}

.sidebar li:hover {
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.1);
}

.sidebar li div:first-child {
  height: 40px;
  width: 40px;
  border-radius: 9px;

  display: flex;
  justify-content: center;
  align-items: center;

  font-weight: bold;
  font-size: 18px;
}

.sidebar li:nth-child(8n + 1) div:first-child {
  background-color: $profile-red;
}

.sidebar li:nth-child(8n + 2) div:first-child {
  background-color: $profile-blue;
}

.sidebar li:nth-child(8n + 3) div:first-child {
  background-color: $profile-green;
}

.sidebar li:nth-child(8n + 4) div:first-child {
  background-color: $profile-pink;
}

.sidebar li:nth-child(8n + 5) div:first-child {
  background-color: $profile-orange;
}

.sidebar li:nth-child(8n + 6) div:first-child {
  background-color: $profile-light-blue;
}

.sidebar li:nth-child(8n + 7) div:first-child {
  background-color: $profile-yellow;
}

.sidebar li:nth-child(8n + 8) div:first-child {
  background-color: $profile-grey;
}

/* --- Main area --- */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-height: 100vh;
}

/* --- Top bar --- */
.top-bar {
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

/* --- Content area --- */
.content {
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;

  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
  border: 1px $primary solid;

  background: #222227;
  color: #ccc;

  flex: 1;

  display: flex;
  flex-direction: column;
  overflow: hidden;

  padding-bottom: 1rem;
}

.selected-chanel {
  display: flex;
  align-items: center;

  border-bottom: 1px #777 solid;

  gap: 0.5rem;
  padding: 1rem;
}

.selected-chanel div:first-child {
  height: 30px;
  width: 30px;
  border-radius: 6px;

  display: flex;
  justify-content: center;
  align-items: center;

  font-weight: bold;
  font-size: 14px;

  background-color: $profile-green;
}

.selected-chanel div:nth-child(2) {
  font-weight: bold;
  font-size: 16px;
}

.messages {
  flex: 1;
  overflow-y: auto;

  display: flex;
  flex-direction: column-reverse;

  padding-bottom: 1rem;
}

.message {
  display: flex;
  align-items: start;
  padding: 0.5rem 1rem;
}

.message:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.profile-picture {
  height: 40px;
  width: 40px;
  border-radius: 9px;

  display: flex;
  justify-content: center;
  align-items: center;

  font-weight: bold;
  font-size: 18px;

  background-color: $profile-red;
  margin: 0 0.5rem;
}

.message div:nth-child(2) {
  flex: 1;
  overflow: hidden;
  padding-right: 8px;
}

.username {
  color: white;
  font-weight: bold;
}

.message-text {
  word-break: break-word;
}

/* --- Input container --- */
.input-container {
  display: flex;

  gap: 0.5rem;
  margin: 0 1rem;
  padding: 0.5rem;

  border: 1px solid #777;

  border-radius: 5px;
  min-height: 5rem;
}

.input-container:focus-within {
  border: 1px solid #aaa;
}

.input-container textarea {
  overflow-y: auto;
  resize: none;

  flex: 1;
  border-radius: 10px;

  border: 1px solid #777;

  background-color: transparent;

  color: #eee;
  max-height: 40vh;
  border: none;
}

.input-container textarea:focus {
  outline: none;
}

.input-container button {
  margin-bottom: 0.95rem;
  padding: 0 1.2rem;

  border-radius: 20px;
  border: none;

  background-color: $primary;
  color: white;

  transition: background-color 0.2s ease;

  height: 2rem;

  font-weight: bold;
}

.input-container button:hover {
  opacity: 0.9;
  cursor: pointer;
}
</style>
