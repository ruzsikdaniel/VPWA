<template>
    <div class="message-container">
        <div class="profile-picture">NS</div>
        <div>
            <div class="username">Name Surname</div>
            <div class="message-text">
            Messagedddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd
            </div>
        </div>
    </div>
</template>

<script setup>

</script>

<style lang="scss" scoped>
/* Message */

.message-container {
  display: flex;
  align-items: start;
  padding: 0.5rem 1rem;
}

.message-container:hover {
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

.message-container div:nth-child(2) {
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

</style>