import { defineStore } from 'pinia'
import { ref } from 'vue'
import { createUser } from 'src/models/User'

export const useUserStore = defineStore('user', () => {
    const users = ref([])
    const usersDummy = ref([])

    // load dummy user - later pull users from DB
    function loadUsers(){
        clearUsers();
        clearUsersDummy();

        usersDummy.value.push(
            createUser({
                id: 'U0',
                firstName: 'user',
                lastName: 'name',
                nickname: 'username',
                email: 'user@name.com',
                password: 'password',
                color: 'black',
                channels: 'test_channel1',
                messages: ['test_message1']
            })
        )

        users.value = [...usersDummy.value]
    }

    function clearUsers(){
        users.value = []
    }

    function clearUsersDummy(){
        usersDummy.value = []
    }

    
    function addUser(fName, lName, nName, email, pass) {
        const newId = 'U' + (users.value.length - 1)
        const newColor = 'white'

        const newUser = createUser({
            id: newId,
            firstName: fName,
            lastName: lName,
            nickname: nName,
            email: email,
            password: pass,
            color: newColor,
            channels: [],
            messages: []
        })

        users.value.push(newUser)
    }

    function findUser(nickname, password){
        const found = users.value.find(
            (user) => user.nickname === nickname && user.password === password
        )

        console.log('Found user: ', found)
        return found
    }

    
    return {users, loadUsers, addUser, findUser}
})